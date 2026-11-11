// 商品：載入、分類篩選、搜尋、卡片渲染

let allProducts = [];
let currentCategory = '全部';
let searchKeyword = '';

// 載入商品資料
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        allProducts = await response.json();
        generateCategoryFilters();
        renderProducts();
    } catch (error) {
        console.error('載入商品失敗:', error);
        // 直接雙擊開啟檔案（file://）時，瀏覽器會擋掉 fetch，需改用本地伺服器
        const hint = location.protocol === 'file:'
            ? '<br><small>偵測到直接開啟檔案，請雙擊「本地測試.command」，或使用線上網址</small>'
            : '';
        document.getElementById('productsGrid').innerHTML =
            `<div class="loading">❌ 載入商品失敗，請稍後再試${hint}</div>`;
    }
}

// ---------- 分類篩選 ----------

function generateCategoryFilters() {
    const categories = ['全部', ...new Set(allProducts.map(p => p.category))];
    const container = document.getElementById('filterContainer');

    container.innerHTML = categories.map(cat =>
        `<button class="filter-btn ${cat === '全部' ? 'active' : ''}"
                 data-category="${cat}"
                 onclick="filterByCategory('${cat}')">${cat}${cat === '全部' ? '商品' : ''}</button>`
    ).join('');
}

// 更新分類按鈕的選取狀態
function setActiveFilterButton(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
}

function filterByCategory(category) {
    currentCategory = category;
    setActiveFilterButton(category);
    renderProducts();
}

// ---------- 搜尋 ----------

function handleSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');

    searchKeyword = input.value.trim();
    clearBtn.classList.toggle('active', Boolean(searchKeyword));

    // 有搜尋關鍵字時，取消分類篩選（顯示全部）
    if (searchKeyword) {
        currentCategory = '全部';
        setActiveFilterButton('全部');
    }

    renderProducts();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').classList.remove('active');
    searchKeyword = '';
    renderProducts();
}

function matchesKeyword(product, keyword) {
    return product.name.toLowerCase().includes(keyword) ||
           product.category.toLowerCase().includes(keyword) ||
           product.size.toLowerCase().includes(keyword) ||
           (product.note && product.note.toLowerCase().includes(keyword));
}

// ---------- 渲染 ----------

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const resultText = document.getElementById('searchResultText');

    // 先按分類篩選，再按搜尋關鍵字篩選
    let filtered = currentCategory === '全部'
        ? allProducts
        : allProducts.filter(p => p.category === currentCategory);

    if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        filtered = filtered.filter(p => matchesKeyword(p, keyword));
    }

    // 搜尋結果提示
    if (searchKeyword) {
        const safeKeyword = escapeHtml(searchKeyword);
        const message = filtered.length > 0
            ? `搜尋「<strong>${safeKeyword}</strong>」找到 <strong>${filtered.length}</strong> 個商品`
            : `找不到包含「<strong>${safeKeyword}</strong>」的商品，請嘗試其他關鍵字`;
        resultText.innerHTML = `<div class="search-result-text">${message}</div>`;
    } else {
        resultText.innerHTML = '';
    }

    if (filtered.length === 0) {
        grid.innerHTML = searchKeyword
            ? '<div class="loading">🔍 找不到相關商品</div>'
            : '<div class="loading">😅 此分類暫無商品</div>';
        return;
    }

    grid.innerHTML = filtered.map(renderProductCard).join('');
}

// 計算單一階梯的原價 / 省下金額
function getDiscountInfo(tier) {
    const hasOriginalPrice = Boolean(tier.original_price && tier.original_price > tier.total_price);
    return {
        hasOriginalPrice,
        discount: hasOriginalPrice ? tier.original_price - tier.total_price : 0
    };
}

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

function renderSoldOut() {
    return '<div class="sold-out-badge">已售完</div>';
}

// 單一價格
function renderSinglePrice(product) {
    const tier = product.tiers[0];
    const { hasOriginalPrice, discount } = getDiscountInfo(tier);

    return `
        <div class="single-price">
            ${hasOriginalPrice ? `<div class="original-price">原價 NT$ ${tier.original_price.toLocaleString()}</div>` : ''}
            <div class="price">NT$ ${tier.total_price.toLocaleString()}</div>
            ${hasOriginalPrice ? `<div class="discount-badge">省 NT$ ${discount.toLocaleString()}</div>` : ''}
        </div>
    `;
}

// 階梯定價選擇器（A組 / B組 / C組）
function renderTierSelector(product) {
    return `
        <div class="tier-selector">
            <div class="tier-groups">
                ${product.tiers.map((tier, index) => {
                    const { hasOriginalPrice, discount } = getDiscountInfo(tier);

                    return `
                        <div class="tier-group ${index === 0 ? 'selected' : ''}"
                             onclick="selectTier(${product.id}, ${index})">
                            <div class="tier-group-header">
                                <div class="tier-group-label">${getGroupLabel(index)}</div>
                                <div class="tier-group-moq">最低購買量：${tier.quantity} 隻</div>
                            </div>
                            <div class="tier-group-content">
                                ${hasOriginalPrice ? `<div class="tier-original-price">原價 NT$ ${tier.original_price.toLocaleString()}</div>` : ''}
                                <div class="tier-group-price-row">
                                    <div class="tier-group-price">NT$ ${tier.total_price.toLocaleString()}</div>
                                    ${tier.unit_price > 0 ?
                                        `<div class="tier-group-avg">平均 $${tier.unit_price}/隻</div>` :
                                        ''}
                                </div>
                                ${hasOriginalPrice ? `<div class="tier-discount-badge">省 NT$ ${discount.toLocaleString()}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

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
    card.querySelectorAll('.tier-group').forEach((group, idx) => {
        group.classList.toggle('selected', idx === tierIndex);
    });
}
