// 訪客統計（本地模擬，上線後可替換為真實的 API）

function randomOnlineVisitors() {
    return Math.floor(Math.random() * 10) + 1; // 1-10
}

function initVisitorStats() {
    const onlineEl = document.getElementById('onlineVisitors');

    const totalViews = parseInt(localStorage.getItem('totalViews') || '0') + 1;
    localStorage.setItem('totalViews', totalViews.toString());
    document.getElementById('totalViews').textContent = totalViews.toLocaleString();

    onlineEl.textContent = randomOnlineVisitors();

    // 每 30 秒更新一次在線人數
    setInterval(() => {
        onlineEl.textContent = randomOnlineVisitors();
    }, 30000);
}
