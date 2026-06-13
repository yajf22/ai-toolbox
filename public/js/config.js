// ====== DeepSeek API Configuration ======
// 密钥在部署时自动注入，不存储在代码中
const DEEPSEEK_CONFIG = {
    apiKey: "DEEPSEEK_API_KEY_PLACEHOLDER",
    model: "deepseek-chat",
    apiUrl: "https://api.deepseek.com/chat/completions"
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
