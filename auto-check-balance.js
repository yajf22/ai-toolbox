// auto-check-balance.js - 每天检查DeepSeek余额
const axios = require("axios");
const fs = require("fs");

const DEEPSEEK_KEY = "sk-58e0a0dfea604a30bafcf83718a0eed2";

async function checkBalance() {
    console.log("🔍 检查DeepSeek余额...");
    
    const res = await axios.get("https://api.deepseek.com/user/balance", {
        headers: { "Authorization": "Bearer " + DEEPSEEK_KEY },
        timeout: 10000
    });
    
    const balance = parseFloat(res.data.balance_infos?.[0]?.total_balance || "0");
    console.log("💰 余额: ¥" + balance.toFixed(2));
    
    // 读取当前记录
    let records = { history: [], currentBalance: 0 };
    if (fs.existsSync("data/balance-record.json")) {
        try {
            records = JSON.parse(fs.readFileSync("data/balance-record.json", "utf8"));
        } catch(e) {}
    }
    
    records.currentBalance = balance;
    records.lastChecked = new Date().toISOString();
    records.history.push({ time: records.lastChecked, balance });
    if (records.history.length > 365) records.history = records.history.slice(-365);
    
    // 更新网站配置（让前端知道余额状态）
    const status = {
        balance: balance,
        low: balance < 2,
        critical: balance < 0.5
    };
    
    fs.writeFileSync("data/balance-record.json", JSON.stringify(records, null, 2));
    fs.writeFileSync("public/data/balance-status.json", JSON.stringify(status, null, 2));
    
    console.log("📊 状态:", balance >= 2 ? "✅ 充足" : balance >= 0.5 ? "⚠️ 偏低" : "🔴 即将用完");
}

checkBalance().catch(e => {
    console.error("❌ 检查失败:", e.message);
    process.exit(1);
});
