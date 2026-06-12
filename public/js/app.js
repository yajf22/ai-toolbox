// App state
const state = {
    token: localStorage.getItem('accessToken') || '',
    freeUses: JSON.parse(localStorage.getItem('freeUses') || '{}'),
    walletAddress: ''
};

// API base
const API = '/api';

// On load
document.addEventListener('DOMContentLoaded', async () => {
    updateUI();
    await loadStats();
    await loadWalletAddress();
    checkToken();
});

function updateUI() {
    const navStatus = document.getElementById('navStatus');
    const tokenBar = document.getElementById('tokenBar');
    
    if (state.token) {
        const expiry = localStorage.getItem('tokenExpiry');
        if (expiry && Date.now() < parseInt(expiry)) {
            navStatus.innerHTML = '⭐ VIP';
            navStatus.style.background = '#6c5ce7';
            navStatus.style.color = 'white';
            tokenBar.style.display = 'block';
            document.getElementById('tokenExpiry').textContent = 
                '有效期至: ' + new Date(parseInt(expiry)).toLocaleString();
            state.isVIP = true;
        } else {
            state.token = '';
            localStorage.removeItem('accessToken');
            localStorage.removeItem('tokenExpiry');
            state.isVIP = false;
            tokenBar.style.display = 'none';
            navStatus.innerHTML = '🔓 免费模式';
            navStatus.style.background = '#f0f0f0';
            navStatus.style.color = '';
        }
    } else {
        state.isVIP = false;
        tokenBar.style.display = 'none';
        navStatus.innerHTML = '🔓 免费模式';
        navStatus.style.background = '#f0f0f0';
        navStatus.style.color = '';
    }
}

async function loadStats() {
    try {
        const res = await fetch(`${API}/earnings`);
        const data = await res.json();
        document.getElementById('statUSDT').textContent = data.earnings.totalUSDT + ' USDT';
        document.getElementById('statRMB').textContent = '¥' + data.earnings.estimatedRMB;
        document.getElementById('statUsers').textContent = data.earnings.totalPayments + ' 人';
        document.getElementById('statCalls').textContent = data.deepseekUsage.totalCalls + ' 次';
    } catch(e) {
        console.log('Stats load deferred');
    }
}

async function loadWalletAddress() {
    try {
        const res = await fetch(`${API}/payment/address`);
        const data = await res.json();
        state.walletAddress = data.address;
        document.getElementById('walletAddress').textContent = data.address;
    } catch(e) {
        console.log('Wallet address deferred');
    }
}

function checkToken() {
    if (state.token) {
        fetch(`${API}/token/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: state.token })
        })
        .then(r => r.json())
        .then(data => {
            if (!data.valid) {
                state.token = '';
                localStorage.removeItem('accessToken');
                localStorage.removeItem('tokenExpiry');
                updateUI();
            }
        })
        .catch(() => {});
    }
}

function showPayment() {
    document.getElementById('paymentModal').style.display = 'block';
    loadWalletAddress();
}

function closePayment() {
    document.getElementById('paymentModal').style.display = 'none';
}

function copyAddress() {
    const addr = document.getElementById('walletAddress').textContent;
    navigator.clipboard.writeText(addr).then(() => {
        alert('钱包地址已复制！');
    }).catch(() => {
        // Fallback
        const el = document.createElement('textarea');
        el.value = addr;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alert('钱包地址已复制！');
    });
}

async function verifyPayment() {
    const statusEl = document.getElementById('paymentStatus');
    statusEl.innerHTML = '🔄 正在检查支付...';
    statusEl.style.background = '#fff3cd';
    statusEl.style.color = '#856404';
    
    try {
        // First check wallet balance
        const verifyRes = await fetch(`${API}/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const verifyData = await verifyRes.json();
        
        if (verifyData.collectedUSDT > 0) {
            // Claim token
            const claimRes = await fetch(`${API}/payment/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const claimData = await claimRes.json();
            
            if (claimData.canClaim && claimData.tokens.length > 0) {
                const tokenData = claimData.tokens[0];
                state.token = tokenData.token;
                localStorage.setItem('accessToken', tokenData.token);
                localStorage.setItem('tokenExpiry', tokenData.expiresAt.toString());
                
                statusEl.innerHTML = '✅ 支付验证成功！VIP已激活24小时 🎉';
                statusEl.style.background = '#d4edda';
                statusEl.style.color = '#155724';
                
                updateUI();
                setTimeout(closePayment, 3000);
            } else {
                statusEl.innerHTML = '⚠️ 已检测到支付，但系统处理中，请稍后再试。';
                statusEl.style.background = '#fff3cd';
                statusEl.style.color = '#856404';
            }
        } else {
            // Show wallet info again
            const addrRes = await fetch(`${API}/payment/address`);
            const addrData = await addrRes.json();
            
            statusEl.innerHTML = '⏳ 尚未检测到支付。请确认已转账到以下地址：<br>' +
                '<code style="word-break:break-all">' + addrData.address + '</code><br>' +
                '金额：<strong>1 USDT</strong> (TRC-20网络)<br>' +
                '转账后等待约1-2分钟到账，然后再次点击验证。';
            statusEl.style.background = '#fff3cd';
            statusEl.style.color = '#856404';
        }
    } catch(e) {
        statusEl.innerHTML = '❌ 验证失败：' + e.message;
        statusEl.style.background = '#f8d7da';
        statusEl.style.color = '#721c24';
    }
}

// Free usage tracking
function checkFreeUse(toolName) {
    if (state.isVIP) return true;
    
    const today = new Date().toDateString();
    const key = toolName + '_' + today;
    const uses = parseInt(localStorage.getItem('freeUse_' + key) || '0');
    
    if (uses >= 3) {
        alert('今日免费次数已用完（3/3）。请购买VIP解锁无限使用！');
        showPayment();
        return false;
    }
    return true;
}

function incrementFreeUse(toolName) {
    if (state.isVIP) return;
    const today = new Date().toDateString();
    const key = toolName + '_' + today;
    const uses = parseInt(localStorage.getItem('freeUse_' + key) || '0');
    localStorage.setItem('freeUse_' + key, (uses + 1).toString());
}

function getFreeUsesLeft(toolName) {
    const today = new Date().toDateString();
    const key = toolName + '_' + today;
    const uses = parseInt(localStorage.getItem('freeUse_' + key) || '0');
    return Math.max(0, 3 - uses);
}

// Global functions for HTML onclick
window.showPayment = showPayment;
window.closePayment = closePayment;
window.copyAddress = copyAddress;
window.verifyPayment = verifyPayment;
window.checkFreeUse = checkFreeUse;
window.incrementFreeUse = incrementFreeUse;
window.getFreeUsesLeft = getFreeUsesLeft;
window.updateUI = updateUI;
window.loadStats = loadStats;
