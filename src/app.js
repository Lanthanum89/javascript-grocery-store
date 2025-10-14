const products = [
  { id: 1, name: 'Apples', price: 1.20, category: 'Fruits', stock: 15, description: 'Fresh red apples', rating: 4.5, reviews: 23 },
  { id: 2, name: 'Bananas', price: 0.95, category: 'Fruits', stock: 20, description: 'Ripe yellow bananas', rating: 4.2, reviews: 18 },
  { id: 3, name: 'Carrots', price: 0.70, category: 'Vegetables', stock: 12, description: 'Organic carrots', rating: 4.0, reviews: 15 },
  { id: 4, name: 'Bread', price: 2.00, category: 'Bakery', stock: 8, description: 'Whole wheat bread', rating: 4.3, reviews: 31 },
  { id: 5, name: 'Milk', price: 1.45, category: 'Dairy', stock: 10, description: 'Fresh whole milk', rating: 4.4, reviews: 27 },
  { id: 6, name: 'Oranges', price: 1.60, category: 'Fruits', stock: 18, description: 'Juicy oranges', rating: 4.1, reviews: 12 },
  { id: 7, name: 'Broccoli', price: 1.30, category: 'Vegetables', stock: 14, description: 'Fresh broccoli', rating: 3.9, reviews: 8 },
  { id: 8, name: 'Cheese', price: 2.80, category: 'Dairy', stock: 6, description: 'Sharp cheddar cheese', rating: 4.6, reviews: 42 },
  { id: 9, name: 'Croissants', price: 3.20, category: 'Bakery', stock: 5, description: 'Buttery croissants', rating: 4.7, reviews: 35 },
  { id: 10, name: 'Strawberries', price: 2.55, category: 'Fruits', stock: 9, description: 'Sweet strawberries', rating: 4.5, reviews: 19 },
  { id: 11, name: 'Yogurt', price: 0.85, category: 'Dairy', stock: 16, description: 'Greek yogurt', rating: 4.2, reviews: 22 },
  { id: 12, name: 'Lettuce', price: 1.05, category: 'Vegetables', stock: 11, description: 'Crisp lettuce', rating: 3.8, reviews: 9 }
];

let cart = JSON.parse(localStorage.getItem('groceryCart')) || [];
let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let currentCategory = 'All';
let searchTerm = '';
let sortBy = 'name';
let showOnlyInStock = false;

// Discount codes with expiry dates (minimum orders adjusted for GBP)
const discountCodes = {
  'SAVE10': { discount: 0.10, expiry: '2025-12-31', minOrder: 0 },
  'WELCOME': { discount: 0.15, expiry: '2025-11-30', minOrder: 8 },
  'FRUIT20': { discount: 0.20, expiry: '2025-10-31', minOrder: 12 },
  'BULK25': { discount: 0.25, expiry: '2025-12-25', minOrder: 40 }
};

let appliedDiscount = 0;
let currentDiscountCode = '';

// User preferences updated to GBP
let userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {
  currency: 'GBP',
  theme: 'pink',
  notifications: true
};

function saveToStorage() {
  localStorage.setItem('groceryCart', JSON.stringify(cart));
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
}

function showNotification(message, type = 'info') {
  if (!userPreferences.notifications) return;

  const bg =
    type === 'success' ? '#2f7d59' :     // green
    type === 'error'   ? '#b23a3a' :     // red (semantic)
                        '#2f5d50';       // neutral moss (info)

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bg};
    color: #fff;
    padding: 1em;
    border-radius: 4px;
    z-index: 1000;
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function getStarRating(rating) {
  const stars = Math.round(rating * 2) / 2;
  let starHTML = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= stars) {
      starHTML += '★';
    } else if (i - 0.5 <= stars) {
      starHTML += '☆';
    } else {
      starHTML += '☆';
    }
  }
  return starHTML;
}

function formatPrice(price) {
  return `£${price.toFixed(2)}`;
}

function sortProducts(products) {
  return products.sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'popularity':
        return b.reviews - a.reviews;
      default:
        return a.name.localeCompare(b.name);
    }
  });
}

function renderCatalog() {
  const catalog = document.getElementById('catalog');
  catalog.innerHTML = '';
  
  // Filter and sort products
  let filteredProducts = products.filter(product => {
    const matchesCategory = currentCategory === 'All' || product.category === currentCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock = !showOnlyInStock || product.stock > 0;
    return matchesCategory && matchesSearch && matchesStock;
  });

  filteredProducts = sortProducts(filteredProducts);

  if (filteredProducts.length === 0) {
    catalog.innerHTML = '<p style="text-align: center; color: #6b7280;">No products found matching your criteria.</p>';
    return;
  }

  filteredProducts.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product';
    const isOutOfStock = product.stock === 0;
    const isInWishlist = wishlist.some(item => item.id === product.id);
    
    div.innerHTML = `
      <div class="product-info">
        <div class="product-header">
          <span class="product-name">${product.name}</span>
          <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id})" title="${isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
            ${isInWishlist ? '❤️' : '🤍'}
          </button>
        </div>
        <span class="product-category">${product.category}</span>
        <span class="product-description">${product.description}</span>
        <div class="product-rating">
          <span class="stars">${getStarRating(product.rating)}</span>
          <span class="rating-text">${product.rating} (${product.reviews} reviews)</span>
        </div>
        <span class="product-price">${formatPrice(product.price)}</span>
        <span class="product-stock ${product.stock <= 5 ? 'low-stock' : ''}">
          Stock: ${product.stock} ${product.stock <= 5 && product.stock > 0 ? '⚠️' : ''}
        </span>
      </div>
      <div class="product-actions">
        <button onclick="addToCart(${product.id})" ${isOutOfStock ? 'disabled' : ''}>
          ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
        <button onclick="quickView(${product.id})" class="quick-view-btn">Quick View</button>
      </div>
    `;
    
    if (isOutOfStock) {
      div.classList.add('out-of-stock');
    }
    
    catalog.appendChild(div);
  });
}

function renderFilters() {
  const filtersDiv = document.getElementById('filters');
  filtersDiv.innerHTML = `
    <div class="filter-group">
      <label>Sort by:</label>
      <select id="sortSelect" onchange="updateSort()">
        <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Name</option>
        <option value="price-low" ${sortBy === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
        <option value="price-high" ${sortBy === 'price-high' ? 'selected' : ''}>Price: High to Low</option>
        <option value="rating" ${sortBy === 'rating' ? 'selected' : ''}>Highest Rated</option>
        <option value="popularity" ${sortBy === 'popularity' ? 'selected' : ''}>Most Popular</option>
      </select>
    </div>
    <div class="filter-group">
      <label>
        <input type="checkbox" ${showOnlyInStock ? 'checked' : ''} onchange="toggleStockFilter()">
        In Stock Only
      </label>
    </div>
  `;
}

function renderCart() {
  const cartDiv = document.getElementById('cart');
  cartDiv.innerHTML = '';
  
  if (cart.length === 0) {
    cartDiv.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  // Cart statistics
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const statsDiv = document.createElement('div');
  statsDiv.className = 'cart-stats';
  statsDiv.innerHTML = `<p><strong>${itemCount} item${itemCount !== 1 ? 's' : ''} in cart</strong></p>`;
  cartDiv.appendChild(statsDiv);

  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info">
        <span class="item-name">${item.name}</span>
        <span class="item-description">${item.description}</span>
        <span class="item-price">${formatPrice(item.price)} each</span>
      </div>
      <div class="quantity-controls">
        <button onclick="decreaseQuantity(${item.id})" class="qty-btn">-</button>
        <span class="quantity">${item.qty}</span>
        <button onclick="increaseQuantity(${item.id})" class="qty-btn">+</button>
      </div>
      <div class="item-total">
        <span>${formatPrice(item.price * item.qty)}</span>
        <button class="remove" onclick="removeFromCart(${item.id})">Remove</button>
        <button class="move-to-wishlist" onclick="moveToWishlist(${item.id})">♡ Wishlist</button>
      </div>
    `;
    cartDiv.appendChild(div);
  });

  // Cart summary with enhanced features (adjusted for UK shipping)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = subtotal * appliedDiscount;
  const shipping = subtotal >= 20 ? 0 : 3.99; // Free shipping over £20
  const tax = (subtotal - discountAmount) * 0.20; // UK VAT is 20%
  const total = subtotal - discountAmount + shipping + tax;
  
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'cart-summary';
  summaryDiv.innerHTML = `
    <div class="discount-section">
      <input type="text" id="discountCode" placeholder="Enter discount code" value="${currentDiscountCode}">
      <button onclick="applyDiscount()">Apply</button>
      ${appliedDiscount > 0 ? `<button onclick="removeDiscount()" class="remove-discount">Remove</button>` : ''}
    </div>
    <div class="available-codes">
      <small>Available codes: SAVE10, WELCOME, FRUIT20, BULK25</small>
    </div>
    <div class="totals">
      <div class="subtotal">Subtotal: ${formatPrice(subtotal)}</div>
      ${appliedDiscount > 0 ? `<div class="discount">Discount (${currentDiscountCode}): -${formatPrice(discountAmount)}</div>` : ''}
      <div class="shipping">Shipping: ${shipping === 0 ? 'FREE' : formatPrice(shipping)} ${subtotal < 20 ? '(Free over £20)' : ''}</div>
      <div class="tax">VAT (20%): ${formatPrice(tax)}</div>
      <div class="total"><strong>Total: ${formatPrice(total)}</strong></div>
    </div>
    <div class="cart-actions">
      <button onclick="saveForLater()" class="save-btn">Save for Later</button>
      <button onclick="clearCart()" class="clear-btn">Clear Cart</button>
      <button onclick="checkout()" class="checkout-btn">Checkout (${formatPrice(total)})</button>
    </div>
  `;
  cartDiv.appendChild(summaryDiv);
}

function renderWishlist() {
  const wishlistDiv = document.getElementById('wishlist');
  if (wishlist.length === 0) {
    wishlistDiv.innerHTML = '<h3>Wishlist</h3><p>Your wishlist is empty.</p>';
    return;
  }

  wishlistDiv.innerHTML = '<h3>Wishlist (' + wishlist.length + ' items)</h3>';
  wishlist.forEach(item => {
    const div = document.createElement('div');
    div.className = 'wishlist-item';
    div.innerHTML = `
      <span>${item.name} - ${formatPrice(item.price)}</span>
      <div>
        <button onclick="moveToCart(${item.id})">Add to Cart</button>
        <button onclick="removeFromWishlist(${item.id})" class="remove">Remove</button>
      </div>
    `;
    wishlistDiv.appendChild(div);
  });
}

function renderCategories() {
  const categoriesDiv = document.getElementById('categories');
  const categories = ['All', ...new Set(products.map(p => p.category))];
  
  categoriesDiv.innerHTML = '';
  categories.forEach(category => {
    const count = category === 'All' ? products.length : products.filter(p => p.category === category).length;
    const button = document.createElement('button');
    button.textContent = `${category} (${count})`;
    button.className = `category-btn ${category === currentCategory ? 'active' : ''}`;
    button.onclick = () => filterByCategory(category);
    categoriesDiv.appendChild(button);
  });
}

// Quick view modal
function quickView(id) {
  const product = products.find(p => p.id === id);
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="closeModal()">&times;</span>
      <h2>${product.name}</h2>
      <p class="category">${product.category}</p>
      <p class="description">${product.description}</p>
      <div class="rating">
        <span class="stars">${getStarRating(product.rating)}</span>
        <span>${product.rating} (${product.reviews} reviews)</span>
      </div>
      <p class="price">${formatPrice(product.price)}</p>
      <p class="stock">Stock: ${product.stock}</p>
      <div class="modal-actions">
        <button onclick="addToCart(${product.id}); closeModal()">Add to Cart</button>
        <button onclick="toggleWishlist(${product.id}); closeModal()">Add to Wishlist</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}

// Enhanced event handlers
window.addToCart = function(id) {
  const product = products.find(p => p.id === id);
  if (product.stock === 0) {
    showNotification('Product is out of stock!', 'error');
    return;
  }
  
  const cartItem = cart.find(item => item.id === id);
  if (cartItem) {
    if (cartItem.qty < product.stock) {
      cartItem.qty++;
      showNotification(`${product.name} quantity increased!`, 'success');
    } else {
      showNotification('Not enough stock available!', 'error');
      return;
    }
  } else {
    cart.push({ ...product, qty: 1 });
    showNotification(`${product.name} added to cart!`, 'success');
  }
  
  product.stock--;
  saveToStorage();
  renderCart();
  renderCatalog();
  updateCartBadge();
};

window.toggleWishlist = function(id) {
  const product = products.find(p => p.id === id);
  const existingIndex = wishlist.findIndex(item => item.id === id);
  
  if (existingIndex > -1) {
    wishlist.splice(existingIndex, 1);
    showNotification(`${product.name} removed from wishlist!`, 'info');
  } else {
    wishlist.push(product);
    showNotification(`${product.name} added to wishlist!`, 'success');
  }
  
  saveToStorage();
  renderWishlist();
  renderCatalog();
};

window.moveToCart = function(id) {
  const wishlistItem = wishlist.find(item => item.id === id);
  if (wishlistItem) {
    addToCart(id);
    removeFromWishlist(id);
  }
};

window.moveToWishlist = function(id) {
  const cartItem = cart.find(item => item.id === id);
  if (cartItem) {
    toggleWishlist(id);
    removeFromCart(id);
  }
};

window.removeFromWishlist = function(id) {
  wishlist = wishlist.filter(item => item.id !== id);
  saveToStorage();
  renderWishlist();
  renderCatalog();
};

window.updateSort = function() {
  sortBy = document.getElementById('sortSelect').value;
  renderCatalog();
};

window.toggleStockFilter = function() {
  showOnlyInStock = !showOnlyInStock;
  renderCatalog();
};

window.applyDiscount = function() {
  const code = document.getElementById('discountCode').value.toUpperCase();
  const discountInfo = discountCodes[code];
  
  if (!discountInfo) {
    showNotification('Invalid discount code!', 'error');
    return;
  }
  
  const today = new Date();
  const expiryDate = new Date(discountInfo.expiry);
  
  if (today > expiryDate) {
    showNotification('Discount code has expired!', 'error');
    return;
  }
  
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  
  if (subtotal < discountInfo.minOrder) {
    showNotification(`Minimum order of £${discountInfo.minOrder} required for this code!`, 'error');
    return;
  }
  
  appliedDiscount = discountInfo.discount;
  currentDiscountCode = code;
  showNotification(`Discount code "${code}" applied! ${(appliedDiscount * 100).toFixed(0)}% off`, 'success');
  renderCart();
};

window.removeDiscount = function() {
  appliedDiscount = 0;
  currentDiscountCode = '';
  document.getElementById('discountCode').value = '';
  showNotification('Discount removed!', 'info');
  renderCart();
};

window.saveForLater = function() {
  const saved = JSON.parse(localStorage.getItem('savedCarts')) || [];
  const cartToSave = {
    items: [...cart],
    date: new Date().toISOString(),
    total: cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  };
  saved.push(cartToSave);
  localStorage.setItem('savedCarts', JSON.stringify(saved));
  showNotification('Cart saved for later!', 'success');
};

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = itemCount;
  badge.style.display = itemCount > 0 ? 'block' : 'none';
}

// Initialize enhanced app
document.addEventListener('DOMContentLoaded', function() {
  renderFilters();
  renderCategories();
  renderCatalog();
  renderCart();
  renderWishlist();
  updateCartBadge();
  
  // Add cart badge to header
  const header = document.querySelector('h1');
  header.innerHTML = `🛒 Grocery Store <span id="cartBadge" class="cart-badge">0</span>`;
});

// Keep existing functions
window.removeFromCart = function(id) {
  const cartItem = cart.find(item => item.id === id);
  if (cartItem) {
    const product = products.find(p => p.id === id);
    product.stock += cartItem.qty;
    showNotification(`${cartItem.name} removed from cart!`, 'info');
  }
  cart = cart.filter(item => item.id !== id);
  saveToStorage();
  renderCart();
  renderCatalog();
  updateCartBadge();
};

window.increaseQuantity = function(id) {
  const cartItem = cart.find(item => item.id === id);
  const product = products.find(p => p.id === id);
  
  if (cartItem && product.stock > 0) {
    cartItem.qty++;
    product.stock--;
    saveToStorage();
    renderCart();
    renderCatalog();
    updateCartBadge();
  } else {
    showNotification('Not enough stock available!', 'error');
  }
};

window.decreaseQuantity = function(id) {
  const cartItem = cart.find(item => item.id === id);
  const product = products.find(p => p.id === id);
  
  if (cartItem && cartItem.qty > 1) {
    cartItem.qty--;
    product.stock++;
    saveToStorage();
    renderCart();
    renderCatalog();
    updateCartBadge();
  }
};

window.clearCart = function() {
  if (confirm('Are you sure you want to clear your cart?')) {
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id);
      product.stock += item.qty;
    });
    
    cart = [];
    appliedDiscount = 0;
    currentDiscountCode = '';
    saveToStorage();
    renderCart();
    renderCatalog();
    updateCartBadge();
    showNotification('Cart cleared!', 'info');
  }
};

window.checkout = function() {
  if (cart.length === 0) {
    showNotification('Your cart is empty!', 'error');
    return;
  }
  
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = subtotal * appliedDiscount;
  const shipping = subtotal >= 20 ? 0 : 3.99; // Free shipping over £20
  const tax = (subtotal - discountAmount) * 0.20; // UK VAT 20%
  const total = subtotal - discountAmount + shipping + tax;
  
  const order = {
    items: [...cart],
    subtotal: subtotal,
    discount: discountAmount,
    shipping: shipping,
    tax: tax,
    total: total,
    date: new Date().toISOString(),
    discountCode: currentDiscountCode
  };
  
  orderHistory.push(order);
  localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
  
  showNotification(`Order placed successfully! Total: ${formatPrice(total)}`, 'success');
  
  cart = [];
  appliedDiscount = 0;
  currentDiscountCode = '';
  saveToStorage();
  renderCart();
  renderOrderHistory();
  updateCartBadge();
};

window.filterByCategory = function(category) {
  currentCategory = category;
  renderCategories();
  renderCatalog();
};

window.searchProducts = function() {
  searchTerm = document.getElementById('searchInput').value;
  renderCatalog();
};

function renderOrderHistory() {
  const historyDiv = document.getElementById('orderHistory');
  if (orderHistory.length === 0) {
    historyDiv.innerHTML = '<h3>Order History</h3><p>No order history yet.</p>';
    return;
  }

  historyDiv.innerHTML = '<h3>Order History</h3>';
  orderHistory.slice().reverse().forEach((order, index) => {
    const orderDiv = document.createElement('div');
    orderDiv.className = 'order-item';
    orderDiv.innerHTML = `
      <div class="order-header">
        <strong>Order #${orderHistory.length - index}</strong>
        <span>${new Date(order.date).toLocaleDateString()}</span>
      </div>
      <div class="order-items">
        ${order.items.map(item => `${item.name} x${item.qty}`).join(', ')}
      </div>
      <div class="order-breakdown">
        <div>Subtotal: ${formatPrice(order.subtotal)}</div>
        ${order.discount > 0 ? `<div>Discount: -${formatPrice(order.discount)}</div>` : ''}
        <div>Shipping: ${order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</div>
        <div>VAT: ${formatPrice(order.tax)}</div>
      </div>
      <div class="order-total">Total: ${formatPrice(order.total)}</div>
      <button onclick="reorderItems(${orderHistory.length - index - 1})" class="reorder-btn">Reorder</button>
    `;
    historyDiv.appendChild(orderDiv);
  });
}

window.reorderItems = function(orderIndex) {
  const order = orderHistory[orderIndex];
  let addedItems = 0;
  
  order.items.forEach(orderItem => {
    const product = products.find(p => p.id === orderItem.id);
    if (product && product.stock >= orderItem.qty) {
      const cartItem = cart.find(item => item.id === orderItem.id);
      if (cartItem) {
        cartItem.qty += orderItem.qty;
      } else {
        cart.push({ ...orderItem });
      }
      product.stock -= orderItem.qty;
      addedItems++;
    }
  });
  
  if (addedItems > 0) {
    saveToStorage();
    renderCart();
    renderCatalog();
    updateCartBadge();
    showNotification(`${addedItems} items reordered successfully!`, 'success');
  } else {
    showNotification('Some items are no longer available!', 'error');
  }
};
