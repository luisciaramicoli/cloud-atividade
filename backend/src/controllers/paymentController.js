const { getStripe, getOrCreatePremiumPriceId, STRIPE_WEBHOOK_SECRET } = require('../config/stripe');
const db = require('../config/db');
const { logFromReq, logAuditEvent } = require('../services/loggerService');

/**
 * Inicia o fluxo de pagamento criando uma Checkout Session do Stripe.
 * Redireciona o usuário para a página segura de pagamento hospedada pelo Stripe.
 * NUNCA recebe nem armazena dados de cartão.
 */
exports.createCheckoutSession = async (req, res) => {
    try {
        const stripe = getStripe();
        if (!stripe) {
            return res.status(503).json({ error: 'Serviço de pagamentos (Stripe) não está configurado no servidor.' });
        }

        const [rows] = await db.execute('SELECT id, nome, email, premium, stripe_customer_id FROM usuarios WHERE id = ?', [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const user = rows[0];
        if (user.premium) {
            return res.status(400).json({ error: 'Você já é um assinante do Plano Premium!' });
        }

        const priceId = await getOrCreatePremiumPriceId();
        const publicUrl = process.env.PUBLIC_URL || 'http://localhost:8218';

        const sessionParams = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            client_reference_id: String(user.id),
            metadata: {
                userId: String(user.id),
                userEmail: user.email
            },
            subscription_data: {
                metadata: {
                    userId: String(user.id)
                }
            },
            success_url: `${publicUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${publicUrl}/?checkout=cancel`
        };

        if (user.stripe_customer_id) {
            sessionParams.customer = user.stripe_customer_id;
        } else {
            sessionParams.customer_email = user.email;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        logFromReq(req, {
            type: 'audit.payment.checkout_created',
            action: 'iniciar_checkout_stripe',
            status: 'success',
            target: { type: 'checkout_session', id: session.id },
            metadata: { priceId, mode: 'subscription' }
        });

        res.json({
            url: session.url,
            sessionId: session.id
        });
    } catch (error) {
        console.error('Erro ao criar sessão de checkout no Stripe:', error);
        res.status(500).json({ error: error.message || 'Erro ao comunicar com o Stripe' });
    }
};

/**
 * Webhook assíncrono chamado pelo Stripe para notificar eventos de pagamento.
 * Valida rigorosamente a assinatura criptográfica (stripe-signature) usando o secret do webhook.
 * Atualiza o usuário para premium = 1 quando checkout.session.completed for recebido.
 */
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = STRIPE_WEBHOOK_SECRET();
    const stripe = getStripe();

    let event;

    if (webhookSecret && stripe) {
        if (!sig) {
            console.error('Webhook Stripe rejeitado: cabeçalho stripe-signature ausente.');
            return res.status(400).json({ error: 'Cabeçalho stripe-signature é obrigatório' });
        }

        try {
            // Valida a assinatura com o raw body gravado em buffer no express.json({ verify })
            event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        } catch (err) {
            console.error('Falha na validação da assinatura do Webhook Stripe:', err.message);
            return res.status(400).send(`Webhook Signature Verification Error: ${err.message}`);
        }
    } else {
        // Modo fallback para testes locais quando secret ainda não estiver configurado
        console.warn('Aviso: Processando webhook sem validação de assinatura (STRIPE_WEBHOOK_SECRET não configurado).');
        event = req.body;
    }

    if (!event || !event.type) {
        return res.status(400).json({ error: 'Evento do Stripe inválido' });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = Number(session.client_reference_id || session.metadata?.userId);
                const customerId = session.customer ? String(session.customer) : null;
                const subscriptionId = session.subscription ? String(session.subscription) : null;

                if (userId && Number.isInteger(userId) && userId > 0) {
                    await db.execute(
                        'UPDATE usuarios SET premium = 1, stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?',
                        [customerId, subscriptionId, userId]
                    );

                    logAuditEvent({
                        source: 'service.payment',
                        type: 'audit.subscription.activated',
                        trace_id: req.traceId || null,
                        actor: {
                            id: String(userId),
                            role: 'user',
                            ip: 'stripe_webhook',
                            user_agent: 'Stripe-Webhook'
                        },
                        action: 'ativar_plano_premium',
                        status: 'success',
                        target: { type: 'subscription', id: subscriptionId || session.id },
                        metadata: {
                            sessionId: session.id,
                            customerId,
                            amount_total: session.amount_total,
                            currency: session.currency
                        },
                        immediate: true
                    });

                    console.log(`[Stripe Webhook] Usuário #${userId} atualizado com sucesso para Plano Premium (premium: true).`);
                } else {
                    console.warn('[Stripe Webhook] checkout.session.completed recebido sem userId associado:', session.id);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const subId = subscription.id;

                await db.execute(
                    'UPDATE usuarios SET premium = 0 WHERE stripe_subscription_id = ?',
                    [subId]
                );

                logAuditEvent({
                    source: 'service.payment',
                    type: 'audit.subscription.cancelled',
                    trace_id: req.traceId || null,
                    actor: {
                        id: null,
                        role: 'user',
                        ip: 'stripe_webhook',
                        user_agent: 'Stripe-Webhook'
                    },
                    action: 'cancelar_plano_premium',
                    status: 'success',
                    target: { type: 'subscription', id: subId },
                    metadata: { status: subscription.status },
                    immediate: true
                });

                console.log(`[Stripe Webhook] Assinatura ${subId} cancelada. Usuário retornado ao plano gratuito.`);
                break;
            }

            default:
                console.log(`[Stripe Webhook] Evento não tratado: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Erro ao processar evento do webhook:', error);
        res.status(500).json({ error: 'Erro ao processar evento do webhook' });
    }
};

/**
 * Consulta o status da assinatura do usuário logado.
 */
exports.getSubscriptionStatus = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, nome, email, premium, stripe_customer_id, stripe_subscription_id FROM usuarios WHERE id = ?',
            [req.userId]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

        const u = rows[0];
        res.json({
            is_premium: Boolean(u.premium),
            premium: Boolean(u.premium),
            has_subscription: Boolean(u.stripe_subscription_id),
            stripe_customer_id: u.stripe_customer_id
        });
    } catch (error) {
        console.error('Erro ao consultar status da assinatura:', error);
        res.status(500).json({ error: 'Erro no banco de dados' });
    }
};
