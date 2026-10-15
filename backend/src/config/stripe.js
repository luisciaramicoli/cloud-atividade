const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';

const STRIPE_ACCOUNT_ID = process.env.STRIPE_ACCOUNT_ID || '';

function createStripeClient(key) {
    const opts = {
        apiVersion: '2023-10-16',
        appInfo: {
            name: 'CineCloud',
            version: '1.0.0'
        }
    };
    if (STRIPE_ACCOUNT_ID || (key && key.startsWith('oak_'))) {
        opts.stripeAccount = STRIPE_ACCOUNT_ID || 'acct_1SuOjYD9qoJtG1qn';
    }
    return new Stripe(key, opts);
}

let stripeClient = null;

if (STRIPE_SECRET_KEY) {
    stripeClient = createStripeClient(STRIPE_SECRET_KEY);
}

function getStripe() {
    if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
        stripeClient = createStripeClient(process.env.STRIPE_SECRET_KEY);
    }
    return stripeClient;
}

// Cache local do ID do preço para evitar chamadas repetidas ao Stripe
let cachedPriceId = STRIPE_PRICE_ID || null;

/**
 * Garante que existe um Produto e Preço no Stripe para o Plano Premium (R$ 9,90/mês).
 * Se STRIPE_PRICE_ID estiver nas variáveis de ambiente, usa diretamente.
 * Caso contrário, busca ou cria automaticamente no catálogo de produtos do Stripe em modo de teste.
 */
async function getOrCreatePremiumPriceId() {
    if (cachedPriceId) return cachedPriceId;
    if (process.env.STRIPE_PRICE_ID) {
        cachedPriceId = process.env.STRIPE_PRICE_ID;
        return cachedPriceId;
    }

    const stripe = getStripe();
    if (!stripe) {
        throw new Error('Stripe não configurado. Defina STRIPE_SECRET_KEY.');
    }

    // Busca se já existe o produto CineCloud Premium
    const products = await stripe.products.list({ limit: 10, active: true });
    let premiumProduct = products.data.find(p => p.name.toLowerCase().includes('cinecloud premium') || p.name.toLowerCase().includes('plano premium'));

    if (!premiumProduct) {
        premiumProduct = await stripe.products.create({
            name: 'Plano Premium — CineCloud',
            description: 'Acesso a favoritos ilimitados, badge exclusiva e recursos premium.',
            metadata: { app: 'cinecloud', plan: 'premium' }
        });
    }

    // Busca preços ativos desse produto
    const prices = await stripe.prices.list({
        product: premiumProduct.id,
        active: true,
        limit: 10
    });

    let premiumPrice = prices.data.find(pr => pr.recurring && pr.unit_amount === 990 && pr.currency === 'brl');

    if (!premiumPrice) {
        // Cria preço recorrente de R$ 9,90 / mês
        premiumPrice = await stripe.prices.create({
            product: premiumProduct.id,
            unit_amount: 990, // R$ 9,90
            currency: 'brl',
            recurring: {
                interval: 'month'
            },
            metadata: { plan: 'premium_monthly' }
        });
    }

    cachedPriceId = premiumPrice.id;
    return cachedPriceId;
}

module.exports = {
    getStripe,
    getOrCreatePremiumPriceId,
    STRIPE_WEBHOOK_SECRET: () => process.env.STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET
};
