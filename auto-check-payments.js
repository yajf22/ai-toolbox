// auto-check-payments.js - 定时检查钱包USDT到账
// 由 GitHub Actions 每10分钟运行一次
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const WALLET_ADDR = "TBHxP5cowCPmjcCrCcbjZg2oRRqpW6Dz6p";
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

async function checkPayments() {
    console.log("🔍 检查钱包:", WALLET_ADDR);
    
    // 从TRON API获取余额
    const res = await axios.get("https://api.trongrid.io/v1/accounts/" + WALLET_ADDR, { timeout: 15000 });
    const tokens = res.data.data?.[0]?.trc20 || [];
    
    let usdtBalance = 0;
    for (const tok of tokens) {
        if (tok[USDT_CONTRACT]) {
            usdtBalance = parseInt(tok[USDT_CONTRACT]) / 1e6;
        }
    }
    
    console.log("💰 USDT 余额:", usdtBalance);
    
    // 获取最近的USDT转账记录
    const txsRes = await axios.get(
        "https://api.trongrid.io/v1/accounts/" + WALLET_ADDR + "/transactions/trc20?limit=20&contract_address=" + USDT_CONTRACT,
        { timeout: 15000 }
    );
    
    const transactions = txsRes.data.data || [];
    console.log("📋 最近交易:", transactions.length, "笔");
    
    // 找出转入的交易（to=钱包地址）
    const incomingTxs = transactions.filter(tx => 
        tx.to === WALLET_ADDR && 
        parseInt(tx.value) > 0 &&
        tx.token_info?.symbol === "USDT"
    );
    
    console.log("📥 转入交易:", incomingTxs.length, "笔");
    
    // 读取已有的记录
    let records = { balance: 0, paid: 0, transactions: [], lastChecked: "" };
    const recordFile = "data/payment-records.json";
    if (fs.existsSync(recordFile)) {
        try {
            records = JSON.parse(fs.readFileSync(recordFile, "utf8"));
        } catch(e) {}
    }
    
    // 记录新交易
    for (const tx of incomingTxs) {
        const txId = tx.transaction_id;
        if (!records.transactions.find(t => t.id === txId)) {
            const amount = parseInt(tx.value) / Math.pow(10, tx.token_info?.decimals || 6);
            records.transactions.push({
                id: txId,
                from: tx.from,
                amount: amount,
                time: tx.block_timestamp,
                date: new Date(tx.block_timestamp).toISOString()
            });
            records.paid += amount;
            console.log("🆕 新交易:", amount, "USDT 来自", tx.from);
        }
    }
    
    records.balance = usdtBalance;
    records.lastChecked = new Date().toISOString();
    
    // 保留最近100条记录
    if (records.transactions.length > 100) {
        records.transactions = records.transactions.slice(-100);
    }
    
    fs.writeFileSync(recordFile, JSON.stringify(records, null, 2));
    console.log("✅ 记录已更新, 总收款:", records.paid, "USDT");
    console.log("📊 折合RMB: ¥", (records.paid * 7.3).toFixed(1));
}

checkPayments().catch(e => {
    console.error("❌ 检查失败:", e.message);
    process.exit(1);
});
