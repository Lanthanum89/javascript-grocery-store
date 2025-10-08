const products = [
  { id: 1, name: 'Apples', price: 1.5 },
  { id: 2, name: 'Bananas', price: 1.2 },
  { id: 3, name: 'Carrots', price: 0.9 },
  { id: 4, name: 'Bread', price: 2.5 },
  { id: 5, name: 'Milk', price: 1.8 }
];

let cart = [];

function renderCatalog() {
  const catalog = document.getElementById('catalog');
  catalog.innerHTML = '';
  products.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <span>${product.name} - $${product.price.toFixed(2)}</span>
      <button onclick="addToCart(${product.id})">Add to Cart</button>
    `;
    catalog.appendChild(div);
  });
}

function renderCart() {
  const cartDiv = document.getElementById('cart');
  cartDiv.innerHTML = '';
  if (cart.length === 0) {
    cartDiv.textContent = 'Your cart is empty.';
    return;
  }
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span>${item.name} x ${item.qty} - $${(item.price * item.qty).toFixed(2)}</span>
      <button class="remove" onclick="removeFromCart(${item.id})">Remove</button>
    `;
    cartDiv.appendChild(div);
  });
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalDiv = document.createElement('div');
  totalDiv.innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
  cartDiv.appendChild(totalDiv);
}

window.addToCart = function(id) {
  const product = products.find(p => p.id === id);
  const cartItem = cart.find(item => item.id === id);
  if (cartItem) {
    cartItem.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  renderCart();
};

window.removeFromCart = function(id) {
  cart = cart.filter(item => item.id !== id);
  renderCart();
};

renderCatalog();
renderCart();
