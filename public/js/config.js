// ====== DeepSeek API Configuration ======
// API密钥在后端代理服务器上，不暴露给浏览器
const DEEPSEEK_CONFIG = {
    apiKey: "USE_PROXY",
    model: "deepseek-chat",
    apiUrl: "https://api.deepseek.com/chat/completions",
    proxyUrl: "PROXY_URL_PLACEHOLDER"
};

// ====== Wallet & Payment Info ======
const WALLET_CONFIG = {
    address: "TBHxP5cowCPmjcCrCcbjZg2oRRqpW6Dz6p",
    network: "TRC-20",
    priceUSDT: 1,
    priceRMB: 7.3
};

// ====== Usage Limits ======
const FREE_DAILY_LIMIT = 3;
