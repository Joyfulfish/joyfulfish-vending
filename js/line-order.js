// 送出詢價至 LINE

// 依購物車內容產生詢價訊息
function buildOrderMessage() {
    let message = '🐟 魚樂匯詢價\n\n';

    cart.forEach((item, index) => {
        const groupLabel = item.product.tiers.length > 1 ? ` ${getGroupLabel(item.tierIndex)}` : '';

        message += `${index + 1}. ${item.product.name}${groupLabel}\n`;
        message += `   ${item.tier.quantity}隻 × ${item.quantity} = $${(item.tier.total_price * item.quantity).toLocaleString()}\n\n`;
    });

    message += `總計：NT$ ${getCartTotal().toLocaleString()}`;
    return message;
}

// 一鍵送出至 LINE（訊息自動帶入，同時複製到剪貼簿作為後備）
async function submitToLine() {
    if (cart.length === 0) return;

    const message = buildOrderMessage();
    const copied = await copyToClipboard(message);

    const url = `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_ID)}/?${encodeURIComponent(message)}`;

    // 用 window.open 不會離開當前頁面，避免連線錯誤
    const lineWindow = window.open(url, '_blank');

    // 可能被瀏覽器阻擋
    if (!lineWindow || lineWindow.closed || typeof lineWindow.closed == 'undefined') {
        showToast('⚠️ 請允許彈出視窗，或使用下方的「手動開啟」按鈕');
        return; // 不清空購物車
    }

    toggleCart();
    clearCart();

    showToast(copied
        ? '✅ 已開啟 LINE — 訊息應已自動帶入或已複製到剪貼簿'
        : '✅ 已開啟 LINE — 請手動貼上訊息');
}
