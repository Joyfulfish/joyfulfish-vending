// 水族販賣機網站 - 主要 JavaScript

// 全域變數
let allProducts = [];
let currentCategory = '全部';
let cart = []; // 購物車

// 載入商品資料
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        allProducts = await response.json();

        // 生成分類按鈕
        generateCategoryFilters();

        // 顯示商品
        renderProducts();
    } catch (error) {
        console.error('載入商品失敗:', error);
        document.getElementById('productsGrid').innerHTML =
            '<div class="loading">❌ 載入商品失敗，請稍後再試</div>';
    }
}

// 生成分類按鈕
function generateCategoryFilters() {
    const categories = ['全部', ...new Set(allProducts.map(p => p.category))];
    const container = document.getElementById('filterContainer');

    container.innerHTML = categories.map(cat =>
        `<button class="filter-btn ${cat === '全部' ? 'active' : ''}"
                 data-category="${cat}"
                 onclick="filterByCategory('${cat}')">${cat}${cat === '全部' ? '商品' : ''}</button>`
    ).join('');
}

// 分類篩選
function filterByCategory(category) {
    currentCategory = category;

    // 更新按鈕狀態
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });

    // 重新渲染商品
    renderProducts();
}

// 渲染商品列表
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const filtered = currentCategory === '全部'
        ? allProducts
        : allProducts.filter(p => p.category === currentCategory);

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="loading">😅 此分類暫無商品</div>';
        return;
    }

    grid.innerHTML = filtered.map(product => renderProductCard(product)).join('');
}

// 渲染單個商品卡片
function renderProductCard(product) {
    const isSoldOut = product.soldOut === 1;
    const hasTiers = product.tiers && product.tiers.length > 1;

    return `
        <div class="product-card ${isSoldOut ? 'sold-out' : ''}" data-id="${product.id}">
            ${product.image ?
                `<img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.style.display='none'">` :
                `<div class="product-image" style="background: var(--border-light);"></div>`
            }
            <div class="product-info">
                <div class="product-header">
                    <div class="product-name">${product.name}</div>
                    ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                </div>

                ${product.size || product.note ?
                    `<div class="product-size">
                        ${product.size || ''}
                        ${product.note ? `<span class="product-note">${product.note}</span>` : ''}
                    </div>` : ''}

                ${isSoldOut ? renderSoldOut() :
                  hasTiers ? renderTierSelector(product) : renderSinglePrice(product)}

                ${!isSoldOut ? renderOrderButton(product) : ''}
            </div>
        </div>
    `;
}

// 渲染售完狀態
function renderSoldOut() {
    return '<div class="sold-out-badge">已售完</div>';
}

// 渲染單一價格
function renderSinglePrice(product) {
    const tier = product.tiers[0];
    return `
        <div class="single-price">
            <div class="price">NT$ ${tier.total_price.toLocaleString()}</div>
        </div>
    `;
}

// 渲染階梯定價選擇器（A組/B組/C組樣式）
function renderTierSelector(product) {
    const groupLabels = ['A組', 'B組', 'C組'];

    return `
        <div class="tier-selector">
            <div class="tier-groups">
                ${product.tiers.map((tier, index) => {
                    const groupLabel = groupLabels[index] || `${index + 1}組`;
                    return `
                        <div class="tier-group ${index === 0 ? 'selected' : ''}"
                             onclick="selectTier(${product.id}, ${index})">
                            <div class="tier-group-header">
                                <div class="tier-group-label">${groupLabel}</div>
                                <div class="tier-group-moq">最低購買量：${tier.quantity} 隻</div>
                            </div>
                            <div class="tier-group-content">
                                <div class="tier-group-price-row">
                                    <div class="tier-group-price">NT$ ${tier.total_price.toLocaleString()}</div>
                                    ${tier.unit_price > 0 ?
                                        `<div class="tier-group-avg">平均 $${tier.unit_price}/隻</div>` :
                                        ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// 渲染訂購按鈕
function renderOrderButton(product) {
    return `
        <button class="order-btn" onclick="addToCart(${product.id})">
            加入詢價清單
        </button>
    `;
}

// 選擇階梯價格
function selectTier(productId, tierIndex) {
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    const groups = card.querySelectorAll('.tier-group');

    groups.forEach((group, idx) => {
        group.classList.toggle('selected', idx === tierIndex);
    });
}

// 加入購物車
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);

    // 找出選中的階梯
    let selectedTierIndex = 0;
    const selectedGroup = card.querySelector('.tier-group.selected');
    if (selectedGroup) {
        const groups = card.querySelectorAll('.tier-group');
        selectedTierIndex = Array.from(groups).indexOf(selectedGroup);
    }

    const tier = product.tiers[selectedTierIndex];

    // 檢查購物車是否已有相同商品（相同商品 + 相同階梯）
    const existingIndex = cart.findIndex(item =>
        item.productId === productId && item.tierIndex === selectedTierIndex
    );

    if (existingIndex >= 0) {
        // 已存在，增加數量
        cart[existingIndex].quantity += 1;
    } else {
        // 新增到購物車
        cart.push({
            productId: productId,
            tierIndex: selectedTierIndex,
            quantity: 1,
            product: product,
            tier: tier
        });
    }

    // 更新購物車顯示
    updateCartBadge();

    // 顯示提示
    showToast(`✅ 已加入詢價清單`);
}

// 更新購物車數量徽章
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// 顯示提示訊息
function showToast(message) {
    // 創建 toast 元素
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 2rem;
        background: rgba(45, 55, 72, 0.95);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    // 3秒後移除
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 切換購物車顯示
function toggleCart() {
    const modal = document.getElementById('cartModal');
    const isActive = modal.classList.toggle('active');

    if (isActive) {
        renderCart();
    }
}

// 點擊背景關閉購物車
function closeCartOnBackdrop(event) {
    if (event.target.id === 'cartModal') {
        toggleCart();
    }
}

// 渲染購物車內容
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p>購物車是空的</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">快去選購商品吧！</p>
            </div>
        `;
        cartFooter.style.display = 'none';
        return;
    }

    // 渲染商品列表
    cartItems.innerHTML = cart.map((item, index) => {
        const groupLabels = ['A組', 'B組', 'C組'];
        const groupLabel = item.product.tiers.length > 1
            ? (groupLabels[item.tierIndex] || `${item.tierIndex + 1}組`)
            : '';

        return `
            <div class="cart-item">
                <img src="${item.product.image || ''}"
                     class="cart-item-image"
                     onerror="this.style.display='none'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.product.name}</div>
                    <div class="cart-item-spec">
                        ${item.product.size || ''}
                        ${groupLabel ? `｜${groupLabel}` : ''}
                        ｜${item.tier.quantity} 隻
                    </div>
                    <div class="cart-item-controls">
                        <button class="cart-qty-btn" onclick="updateCartQuantity(${index}, -1)">−</button>
                        <span class="cart-qty">${item.quantity}</span>
                        <button class="cart-qty-btn" onclick="updateCartQuantity(${index}, 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-price">
                    <div class="cart-item-total">NT$ ${(item.tier.total_price * item.quantity).toLocaleString()}</div>
                    <div class="cart-item-delete" onclick="removeFromCart(${index})">刪除</div>
                </div>
            </div>
        `;
    }).join('');

    // 計算總價
    const totalPrice = cart.reduce((sum, item) => sum + (item.tier.total_price * item.quantity), 0);
    document.getElementById('cartTotalPrice').textContent = `NT$ ${totalPrice.toLocaleString()}`;

    cartFooter.style.display = 'block';
}

// 更新購物車商品數量
function updateCartQuantity(index, change) {
    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCartBadge();
    renderCart();
}

// 從購物車移除商品
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartBadge();
    renderCart();
}

// 送出至 LINE
function submitToLine() {
    if (cart.length === 0) return;

    // 生成極簡訊息（確保能帶到 LINE）
    let items = [];
    let total = 0;

    cart.forEach((item) => {
        const groupLabels = ['A組', 'B組', 'C組'];
        const groupLabel = item.product.tiers.length > 1
            ? groupLabels[item.tierIndex] || ''
            : '';

        // 極簡格式：品名 組別 數量 價格
        const itemText = `${item.product.name}${groupLabel ? ' ' + groupLabel : ''} ${item.tier.quantity}隻×${item.quantity}組`;
        items.push(itemText);
        total += item.tier.total_price * item.quantity;
    });

    // 組合訊息 - 使用最短格式
    const message = `魚樂匯詢價\n${items.join('\n')}\n共${total}元`;

    // 清空購物車
    cart = [];
    updateCartBadge();
    toggleCart();

    // 嘗試多種 URL 格式
    const encodedMessage = encodeURIComponent(message);

    // 方法1：使用 line:// scheme（優先，直接開 app）
    const lineSchemeUrl = `line://msg/text/${encodedMessage}`;

    // 方法2：使用 https 格式（備用）
    const httpsUrl = `https://line.me/R/msg/text/?${encodedMessage}`;

    // 方法3：帶 text 參數到官方帳號
    const officialUrl = `https://line.me/R/ti/p/@joyfulfish?text=${encodedMessage}`;

    // 先試 line:// scheme
    window.location.href = lineSchemeUrl;

    // 如果 0.5 秒後還在頁面上，改用 https（備用方案）
    setTimeout(() => {
        try {
            window.location.href = officialUrl;
        } catch (e) {
            // 如果都失敗，顯示訊息
            alert('請複製以下訊息：\n\n' + message);
        }
    }, 500);
}

// 顯示訂單預覽
function showOrderPreview(message) {
    const modal = document.getElementById('cartModal');
    const content = modal.querySelector('.cart-content');

    // 替換內容為訊息預覽
    content.innerHTML = `
        <div class="cart-header">
            <h2>詢價清單</h2>
            <button class="cart-close" onclick="closeOrderPreview()">✕</button>
        </div>
        <div class="cart-items" style="padding: 1.5rem;">
            <div style="
                background: var(--bg-primary);
                padding: 1.5rem;
                border-radius: var(--radius);
                border: 1px solid var(--border-light);
                white-space: pre-wrap;
                font-family: monospace;
                font-size: 0.9rem;
                line-height: 1.6;
                max-height: 50vh;
                overflow-y: auto;
            " id="orderMessage">${message}</div>
            <div style="
                margin-top: 1rem;
                padding: 1rem;
                background: #fff9f5;
                border-left: 3px solid var(--accent-orange);
                border-radius: 6px;
                font-size: 0.9rem;
                color: var(--text-secondary);
            ">
                💡 請長按上方訊息複製，然後點擊下方按鈕開啟 LINE 貼上傳送
            </div>
        </div>
        <div class="cart-footer">
            <button class="cart-submit-btn" onclick="copyAndOpenLine()" style="margin-bottom: 0.8rem;">
                📋 複製訊息
            </button>
            <button class="cart-submit-btn" onclick="openLineOnly()">
                📱 開啟 LINE
            </button>
        </div>
    `;
}

// 複製並開啟 LINE
function copyAndOpenLine() {
    const messageEl = document.getElementById('orderMessage');
    const message = messageEl.textContent;

    // 嘗試複製
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(() => {
            showToast('✅ 訊息已複製！');
            // 1 秒後開啟 LINE
            setTimeout(() => {
                openLineOnly();
            }, 1000);
        }).catch(() => {
            alert('請長按上方訊息手動複製，然後點擊「開啟 LINE」按鈕');
        });
    } else {
        alert('請長按上方訊息手動複製，然後點擊「開啟 LINE」按鈕');
    }
}

// 只開啟 LINE
function openLineOnly() {
    // 清空購物車
    cart = [];
    updateCartBadge();

    // 關閉彈窗
    closeOrderPreview();

    // 開啟 LINE
    window.open('https://line.me/R/ti/p/@joyfulfish', '_blank');

    showToast('📱 請在 LINE 中貼上剛才複製的訊息');
}

// 關閉訂單預覽
function closeOrderPreview() {
    const modal = document.getElementById('cartModal');
    modal.classList.remove('active');

    // 恢復購物車內容
    setTimeout(() => {
        renderCart();
    }, 300);
}

// 訪客統計
function initVisitorStats() {
    // 本地模擬統計（上線後可替換為真實的 API）
    let totalViews = parseInt(localStorage.getItem('totalViews') || '0');
    totalViews += 1;
    localStorage.setItem('totalViews', totalViews.toString());

    // 顯示統計
    document.getElementById('totalViews').textContent = totalViews.toLocaleString();

    // 模擬在線人數（1-10 之間隨機）
    const onlineVisitors = Math.floor(Math.random() * 10) + 1;
    document.getElementById('onlineVisitors').textContent = onlineVisitors;

    // 定期更新在線人數（每 30 秒）
    setInterval(() => {
        const online = Math.floor(Math.random() * 10) + 1;
        document.getElementById('onlineVisitors').textContent = online;
    }, 30000);
}

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    initVisitorStats();
});
