const express = require('express');
const router = express.Router();
const deepseek = require('../services/deepseek');
const wallet = require('../services/wallet');
const payment = require('../services/payment');
const fs = require('fs');
const path = require('path');

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get wallet address for payment
router.get('/payment/address', (req, res) => {
    res.json({
        address: wallet.getAddress(),
        priceUSDT: payment.PRICE_USDT,
        priceRMB: (payment.PRICE_USDT * 7.3).toFixed(1),
        network: 'TRC-20',
        token: 'USDT',
        note: 'Send USDT (TRC-20) to this address. After payment, use /payment/verify to check.'
    });
});

// Verify payment
router.post('/payment/verify', async (req, res) => {
    try {
        const balance = await wallet.checkUSDTBalance(wallet.getAddress());
        
        // Calculate earnings from wallet balance
        const collectedUSDT = balance.usdt;
        const earnings = payment.getEarnings();
        
        res.json({
            walletBalance: balance,
            collectedUSDT: collectedUSDT,
            estimatedRMB: (collectedUSDT * 7.3).toFixed(1),
            totalVerifiedPayments: earnings.totalPayments,
            status: collectedUSDT > 0 ? 'payments_received' : 'awaiting_payment'
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Generate access token after payment verification
router.post('/payment/claim', async (req, res) => {
    try {
        const balance = await wallet.checkUSDTBalance(wallet.getAddress());
        // For each 1 USDT, user gets 24h access
        const earnedTokens = Math.floor(balance.usdt) - payment.getEarnings().totalPayments;
        
        if (earnedTokens <= 0) {
            return res.json({ 
                canClaim: false, 
                message: 'No new payments detected. Please send USDT to the wallet address.',
                address: wallet.getAddress()
            });
        }
        
        const tokens = [];
        for (let i = 0; i < earnedTokens; i++) {
            const token = payment.generateToken(wallet.getAddress());
            tokens.push(token);
        }
        
        res.json({ canClaim: true, tokens });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Verify an access token
router.post('/token/verify', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ valid: false, reason: 'no_token' });
    
    const result = payment.verifyToken(token);
    res.json(result);
});

// ========== AI Writing Tools ==========

// Generic AI chat
router.post('/ai/chat', async (req, res) => {
    const { messages, token } = req.body;
    if (!token) return res.status(403).json({ error: 'Access token required' });
    
    const verified = payment.verifyToken(token);
    if (!verified.valid) return res.status(403).json({ error: `Invalid token: ${verified.reason}` });
    
    try {
        const result = await deepseek.chat(messages);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Pre-defined AI tools
const TOOLS = {
    'xiaohongshu': { name: '小红书文案', prompt: 'xiaohongshu' },
    'product-desc': { name: '电商产品描述', prompt: 'product_desc' },
    'article': { name: '公众号文章', prompt: 'article' },
    'short-video': { name: '短视频脚本', prompt: 'short_video' },
    'seo': { name: 'SEO文章', prompt: 'seo_article' },
    'translate': { name: '翻译', prompt: 'translate' },
    'custom': { name: '自由创作', prompt: 'custom' }
};

router.get('/ai/tools', (req, res) => {
    res.json(TOOLS);
});

router.post('/ai/generate', async (req, res) => {
    const { tool, input, token, targetLang } = req.body;
    if (!token) return res.status(403).json({ error: 'Access token required' });
    
    const verified = payment.verifyToken(token);
    if (!verified.valid) return res.status(403).json({ error: `Invalid token: ${verified.reason}` });
    
    if (!TOOLS[tool]) return res.status(400).json({ error: 'Unknown tool' });
    
    try {
        let messages;
        const toolConfig = TOOLS[tool];
        if (tool === 'translate') {
            messages = deepseek.PROMPTS[toolConfig.prompt](input, targetLang || '中文');
        } else {
            messages = deepseek.PROMPTS[toolConfig.prompt](input);
        }
        
        const result = await deepseek.chat(messages, { maxTokens: 4096 });
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Usage stats
router.get('/admin/usage', (req, res) => {
    const usage = deepseek.getUsage();
    const earnings = payment.getEarnings();
    res.json({ usage, earnings, walletAddress: wallet.getAddress() });
});

// Earnings report
router.get('/earnings', (req, res) => {
    const earnings = payment.getEarnings();
    const usage = deepseek.getUsage();
    const walletBalance = { usdt: 0 }; // Will be updated on demand
    res.json({
        earnings,
        deepseekUsage: usage,
        profit: {
            revenueUSDT: earnings.totalUSDT,
            revenueRMB: earnings.estimatedRMB,
            deepseekCostRMB: usage.estimatedCost.toFixed(4),
            profitRMB: (earnings.estimatedRMB - usage.estimatedCost).toFixed(2)
        }
    });
});

module.exports = router;
