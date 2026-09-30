const axios = require('axios');
const { INTERNAL_TOKEN } = require('./security');

// Cliente HTTP para os serviços internos (auth e log). Carrega o token de serviço, que NUNCA deve ir para APIs externas
// (por isso é uma instância separada, e não um header global do axios).
const internalClient = axios.create({
  headers: { 'x-internal-token': INTERNAL_TOKEN },
  timeout: 5000
});

module.exports = { internalClient };
