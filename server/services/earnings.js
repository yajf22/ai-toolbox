const fs = require("fs");
const path = require("path");
const payment = require("./payment");
const deepseek = require("./deepseek");
require("dotenv").config();

const EARNINGS_FILE = path.join(__dirname, "..", "..", "data", "earnings.json");

function safeParseJSON(filePath, defaultVal) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("JSON parse error:", e.message);
    }
    return defaultVal;
}

function getEarningsReport() {
    const payData = payment.getEarnings();
    const usage = deepseek.getUsage();
    
    const report = {
        timestamp: new Date().toISOString(),
        walletAddress: require("./wallet").getAddress(),
        payments: {
            total: payData.totalPayments,
            totalUSDT: payData.totalUSDT,
            totalRMB: payData.estimatedRMB
        },
        deepseek: {
            totalCalls: usage.totalCalls,
            totalTokens: usage.totalTokens,
            estimatedCostRMB: parseFloat(usage.estimatedCost.toFixed(4))
        },
        profit: {
            revenueRMB: payData.estimatedRMB,
            costRMB: parseFloat(usage.estimatedCost.toFixed(4)),
            netProfitRMB: parseFloat((payData.estimatedRMB - usage.estimatedCost).toFixed(2))
        },
        lastUpdated: new Date().toISOString()
    };
    
    try {
        let existing = safeParseJSON(EARNINGS_FILE, { history: [] });
        existing.current = report;
        if (!existing.history) existing.history = [];
        existing.history.push({
            time: report.timestamp,
            totalUSDT: payData.totalUSDT,
            totalRMB: payData.estimatedRMB
        });
        if (existing.history.length > 100) {
            existing.history = existing.history.slice(-100);
        }
        const json = JSON.stringify(existing, null, 2);
        fs.writeFileSync(EARNINGS_FILE, json, "utf8");
    } catch(e) {
        console.error("Earnings save error:", e.message);
    }
    
    return report;
}

module.exports = { getEarningsReport };
