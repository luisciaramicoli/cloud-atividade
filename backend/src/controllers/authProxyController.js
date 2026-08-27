const axios = require('axios');
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

exports.register = async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/register`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro de gateway' });
    }
};

exports.login = async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/login`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro de gateway' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/forgot-password`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro de gateway' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/reset-password`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro de gateway' });
    }
};
