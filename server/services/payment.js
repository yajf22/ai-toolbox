require('dotenv').config();
const fs = require('fs');
const path = require('path');
const wallet = require('./wallet');

const PAYMENTS_FILE = path.join(__dirname, '..', '..', 'data', 'payments.json');

// Price in USDT
const PRICE_USDT = 1;

let payments = [];
try {
    if (fs.existsSync(PAYMENTS_FILE)) {
        payments = JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8'));
    }
} catch(e) { payments = []; }

function savePayments() {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
}

// Generate access token (valid for 24 hours)
function generateToken(address) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    payments.push({
        address,
        token,
        amount: PRICE_USDT,
        createdAt: Date.now(),
        expiresAt,
        verified: true
    });
    savePayments();
    return { token, expiresAt };
}

// Verify a payment token
function verifyToken(token) {
    const payment = payments.find(p => p.token === token);
    if (!payment) return { valid: false, reason: 'invalid_token' };
    if (Date.now() > payment.expiresAt) return { valid: false, reason: 'expired' };
    return { valid: true, address: payment.address };
}

// Get total earnings
function getEarnings() {
    const validPayments = payments.filter(p => p.verified);
    return {
        totalPayments: validPayments.length,
        totalUSDT: validPayments.length * PRICE_USDT,
        estimatedRMB: validPayments.length * PRICE_USDT * 7.3,
        allPayments: validPayments
    };
}

module.exports = { PRICE_USDT, generateToken, verifyToken, getEarnings, savePayments };

