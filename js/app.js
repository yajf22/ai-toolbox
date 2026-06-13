// === Standalone version for GitHub Pages ===
// No backend needed - works purely client-side

function updateUI() {
    const vip = localStorage.getItem("vip_expiry");
    const navStatus = document.getElementById("navStatus");
    if (!navStatus) return;
    if (vip && Date.now() < parseInt(vip)) {
        navStatus.innerHTML = "⭐ VIP";
        navStatus.style.background = "#6c5ce7";
        navStatus.style.color = "white";
        window.isVIP = true;
    } else {
        navStatus.innerHTML = "🔓 免费模式";
        navStatus.style.background = "#f0f0f0";
        navStatus.style.color = "";
        window.isVIP = false;
    }
}

document.addEventListener("DOMContentLoaded", updateUI);
