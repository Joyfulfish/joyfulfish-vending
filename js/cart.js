// 購物車（詢價清單）

let cart = [];

function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.tier.total_price * item.quantity, 0);
}

// 清空購物車並更新徽章
function clearCart() {
    cart = [];
    updateCartBadge();
}

// 加入購物車
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);

    // 找出選中的階梯
    const groups = Array.from(card.querySelectorAll('.tier-group'));
    const selectedIndex = groups.findIndex(group => group.classList.contains('selected'));
    const tierIndex = Math.max(selectedIndex, 0);

    // 相同商品 + 相同階梯 → 增加數量
    const existing = cart.find(item =>
        item.productId === productId && item.tierIndex === tierIndex
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            productId,
            tierIndex,
            quantity: 1,
            product,
            tier: product.tiers[tierIndex]
        });
    }

    updateCartBadge();
    showToast('✅ 已加入詢價清單');
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

    cartItems.innerHTML = cart.map((item, index) => {
        const groupLabel = item.product.tiers.length > 1 ? getGroupLabel(item.tierIndex) : '';

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

    document.getElementById('cartTotalPrice').textContent = `NT$ ${getCartTotal().toLocaleString()}`;
    cartFooter.style.display = 'block';
}

// 調整數量（減到 0 即移除）
function updateCartQuantity(index, change) {
    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCartBadge();
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartBadge();
    renderCart();
}
