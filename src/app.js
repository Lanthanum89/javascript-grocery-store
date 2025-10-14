const products = [
  { id: 1, name: 'Apples', price: 1.5, category: 'Fruits', stock: 15 },
  { id: 2, name: 'Bananas', price: 1.2, category: 'Fruits', stock: 20 },
  { id: 3, name: 'Carrots', price: 0.9, category: 'Vegetables', stock: 12 },
  { id: 4, name: 'Bread', price: 2.5, category: 'Bakery', stock: 8 },
  { id: 5, name: 'Milk', price: 1.8, category: 'Dairy', stock: 10 },
  { id: 6, name: 'Oranges', price: 2.0, category: 'Fruits', stock: 18 },
  { id: 7, name: 'Broccoli', price: 1.6, category: 'Vegetables', stock: 14 },
  { id: 8, name: 'Cheese', price: 3.5, category: 'Dairy', stock: 6 },
  { id: 9, name: 'Croissants', price: 4.0, category: 'Bakery', stock: 5 }
];

let cart = JSON.parse(localStorage.getItem('groceryCart')) || [];
let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
let currentCategory = 'All';
let searchTerm = '';

// Discount codes
const discountCodes = {
  'SAVE10': 0.10,
  'WELCOME': 0.15,
  'FRUIT20': 0.20
};

let appliedDiscount = 0;

function saveCartToStorage() {
  localStorage.setItem('groceryCart', JSON.stringify(cart));
}

function renderCatalog() {
  const catalog = document.getElementById('catalog');
  catalog.innerHTML = '';
  
  // Filter products by category and search term
  let filteredProducts = products.filter(product => {
    const matchesCategory = currentCategory === 'All' || product.category === currentCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  filteredProducts.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product';
    const isOutOfStock = product.stock === 0;
    
    div.innerHTML = `
      <div class="product-info">
        <span class="product-name">${product.name}</span>
        <span class="product-category">${product.category}</span>
        <span class="product-price">$${product.price.toFixed(2)}</span>
        <span class="product-stock">Stock: ${product.stock}</span>
      </div>
      <button onclick="addToCart(${product.id})" ${isOutOfStock ? 'disabled' : ''}>
        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
      </button>
    `;
    
    if (isOutOfStock) {
      div.classList.add('out-of-stock');
    }
    
    catalog.appendChild(div);
  });
}

function renderCart() {
  const cartDiv = document.getElementById('cart');
  cartDiv.innerHTML = '';
  
  if (cart.length === 0) {
    cartDiv.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info">
        <span class="item-name">${item.name}</span>
        <span class="item-price">$${item.price.toFixed(2)} each</span>
      </div>
      <div class="quantity-controls">
        <button onclick="decreaseQuantity(${item.id})" class="qty-btn">-</button>
        <span class="quantity">${item.qty}</span>
        <button onclick="increaseQuantity(${item.id})" class="qty-btn">+</button>
      </div>
      <div class="item-total">
        <span>$${(item.price * item.qty).toFixed(2)}</span>
        <button class="remove" onclick="removeFromCart(${item.id})">Remove</button>
      </div>
    `;
    cartDiv.appendChild(div);
  });

  // Cart summary
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = subtotal * appliedDiscount;
  const total = subtotal - discountAmount;
  
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'cart-summary';
  summaryDiv.innerHTML = `
    <div class="discount-section">
      <input type="text" id="discountCode" placeholder="Enter discount code">
      <button onclick="applyDiscount()">Apply</button>
    </div>
    <div class="totals">
      <div class="subtotal">Subtotal: $${subtotal.toFixed(2)}</div>
      ${appliedDiscount > 0 ? `<div class="discount">Discount (${(appliedDiscount * 100).toFixed(0)}%): -$${discountAmount.toFixed(2)}</div>` : ''}
      <div class="total"><strong>Total: $${total.toFixed(2)}</strong></div>
    </div>
    <div class="cart-actions">
      <button onclick="clearCart()" class="clear-btn">Clear Cart</button>
      <button onclick="checkout()" class="checkout-btn">Checkout</button>
    </div>
  `;
  cartDiv.appendChild(summaryDiv);
}

function renderCategories() {
  const categoriesDiv = document.getElementById('categories');
  const categories = ['All', ...new Set(products.map(p => p.category))];
  
  categoriesDiv.innerHTML = '';
  categories.forEach(category => {
    const button = document.createElement('button');
    button.textContent = category;
    button.className = `category-btn ${category === currentCategory ? 'active' : ''}`;
    button.onclick = () => filterByCategory(category);
    categoriesDiv.appendChild(button);
  });
}

function renderOrderHistory() {
  const historyDiv = document.getElementById('orderHistory');
  if (orderHistory.length === 0) {
    historyDiv.innerHTML = '<p>No order history yet.</p>';
    return;
  }

  historyDiv.innerHTML = '<h3>Order History</h3>';
  orderHistory.forEach((order, index) => {
    const orderDiv = document.createElement('div');
    orderDiv.className = 'order-item';
    orderDiv.innerHTML = `
      <div class="order-header">
        <strong>Order #${index + 1}</strong>
        <span>${new Date(order.date).toLocaleDateString()}</span>
      </div>
      <div class="order-items">
        ${order.items.map(item => `${item.name} x${item.qty}`).join(', ')}
      </div>
      <div class="order-total">Total: $${order.total.toFixed(2)}</div>
    `;
    historyDiv.appendChild(orderDiv);
  });
}

// Event handlers
window.addToCart = function(id) {
  const product = products.find(p => p.id === id);
  if (product.stock === 0) return;
  
  const cartItem = cart.find(item => item.id === id);
  if (cartItem) {
    if (cartItem.qty < product.stock) {
      cartItem.qty++;
    } else {
      alert('Not enough stock available!');
      return;
    }
  } else {
    cart.push({ ...product, qty: 1 });
  }
  
  product.stock--;
  saveCartToStorage();
  renderCart();
  renderCatalog();
};

window.removeFromCart = function(id) {
  const cartItem = cart.find(item => item.id === id);
  if (cartItem) {
    const product = products.find(p => p.id === id);
    product.stock += cartItem.qty;
  }
  cart = cart.filter(item => item.id !== id);
  saveCartToStorage();
  renderCart();
  renderCatalog();
};

window.increaseQuantity = function(id) {
  const cartItem = cart.find(item => item.id === id);
  const product = products.find(p => p.id === id);
  
  if (cartItem && product.stock > 0) {
    cartItem.qty++;
    product.stock--;
    saveCartToStorage();
    renderCart();
    renderCatalog();
  } else {
    alert('Not enough stock available!');
  }
};

window.decreaseQuantity = function(id) {
  const cartItem = cart.find(item => item.id === id);
  const product = products.find(p => p.id === id);
  
  if (cartItem && cartItem.qty > 1) {
    cartItem.qty--;
    product.stock++;
    saveCartToStorage();
    renderCart();
    renderCatalog();
  }
};

window.clearCart = function() {
  if (confirm('Are you sure you want to clear your cart?')) {
    // Restore stock
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id);
      product.stock += item.qty;
    });
    
    cart = [];
    appliedDiscount = 0;
    saveCartToStorage();
    renderCart();
    renderCatalog();
  }
};

window.applyDiscount = function() {
  const code = document.getElementById('discountCode').value.toUpperCase();
  if (discountCodes[code]) {
    appliedDiscount = discountCodes[code];
    alert(`Discount code "${code}" applied! ${(appliedDiscount * 100).toFixed(0)}% off`);
    renderCart();
  } else {
    alert('Invalid discount code!');
  }
};

window.checkout = function() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal - (subtotal * appliedDiscount);
  
  const order = {
    items: [...cart],
    total: total,
    date: new Date().toISOString(),
    discount: appliedDiscount
  };
  
  orderHistory.push(order);
  localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
  
  alert(`Order placed successfully! Total: $${total.toFixed(2)}`);
  
  cart = [];
  appliedDiscount = 0;
  saveCartToStorage();
  renderCart();
  renderOrderHistory();
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

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  renderCategories();
  renderCatalog();
  renderCart();
  renderOrderHistory();
});
