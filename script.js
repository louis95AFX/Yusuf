// =================================================================
// 1. UTILITY FUNCTIONS (CART DATA & COUNT)
// =================================================================

// Get cart from localStorage or initialize it as an empty array
let cart = JSON.parse(localStorage.getItem('cartItems')) || []; 
// NOTE: I changed the key from 'cart' to 'cartItems' for consistency with the cart page code.

const cartCount = document.getElementById('cart-count');

/**
 * Updates the displayed cart count in the header/navigation.
 */
function updateCartCount() {
  // We use the length of the cart array for the count
  if (cartCount) {
    cartCount.textContent = cart.length;
  }
}

/**
 * Placeholder function for retrieving cart items.
 * In a real application, this would fetch the array saved in localStorage.
 * @returns {Array} The current cart items array.
 */
function getCartItems() {
    // Read the primary storage key for the cart
    return JSON.parse(localStorage.getItem('cartItems')) || [];
}

// =================================================================
// 2. PRODUCT PAGE 'ADD TO CART' LOGIC
// =================================================================

document.querySelectorAll('.add-to-cart').forEach(button => {
  button.addEventListener('click', () => {
    const name = button.getAttribute('data-name');
    const price = parseFloat(button.getAttribute('data-price'));
    const id = button.getAttribute('data-id') || Date.now().toString(); // Use product ID or a timestamp

    // Check if the item already exists in the cart to update quantity instead of adding a new entry
    let existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Add item with quantity 1
        cart.push({ id, name, price, quantity: 1 });
    }

    // Save the updated cart array to local storage
    localStorage.setItem('cartItems', JSON.stringify(cart));
    
    // Update the display count
    updateCartCount();

    // Alert the user
    alert(`🛒 Item added! "${name}" has been successfully added to your cart.`);

    // subtle feedback
    button.textContent = "Added!";
    button.style.background = "#333";
    button.style.color = "#d4af37";
    setTimeout(() => {
      button.textContent = "Add to Cart";
      button.style.background = "linear-gradient(90deg, #d4af37, #f7d774)";
      button.style.color = "#000";
    }, 1500);
  });
});

// =================================================================
// 3. CART PAGE RENDERING & DISPLAY LOGIC (Based on cart.js/cart-display.js)
// =================================================================

const cartContainer = document.getElementById('cart-container');
const cartSummaryElement = document.getElementById('cart-summary');
const checkoutButton = document.getElementById('checkout-btn');

/**
 * Renders the cart contents and summary to the cart page.
 */
function renderCart() {
    const currentCart = getCartItems(); // Get the current data
    cart = currentCart; // Keep the global 'cart' variable updated
    cartContainer.innerHTML = ''; 
    let subtotal = 0;

    if (currentCart.length === 0) {
        cartContainer.innerHTML = '<p class="empty-cart">Your shopping cart is currently empty. <a href="collections.html">Start shopping!</a></p>';
        cartSummaryElement.innerHTML = '';
        checkoutButton.disabled = true;
        return;
    }

    currentCart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.dataset.id = item.id;

        cartItemDiv.innerHTML = `
            <div class="item-details">
                <h4 class="item-name">${item.name}</h4>
                <p class="item-price">R${item.price.toFixed(2)}</p>
            </div>
            <div class="item-controls">
                <input type="number" 
                       value="${item.quantity}" 
                       min="1" 
                       data-id="${item.id}"
                       class="cart-qty-input">
                <p>Total: R${itemTotal.toFixed(2)}</p>
                <button class="remove-item-btn" data-id="${item.id}">Remove</button>
            </div>
        `;
        cartContainer.appendChild(cartItemDiv);
    });

    renderSummary(subtotal);
    attachCartListeners();
    checkoutButton.disabled = false;
}

/**
 * Renders the total summary section.
 * @param {number} subtotal - The calculated subtotal of all items.
 */
function renderSummary(subtotal) {
    const shippingCost = 100.00; // Example shipping cost
    const total = subtotal + shippingCost;

    cartSummaryElement.innerHTML = `
        <h3>Order Summary</h3>
        <p>Subtotal: <span>R${subtotal.toFixed(2)}</span></p>
        <p>Shipping: <span>R${shippingCost.toFixed(2)}</span></p>
        <hr>
        <h4>Order Total: <span>R${total.toFixed(2)}</span></h4>
    `;
}

/**
 * Attaches event listeners for removing items and changing quantities, AND Checkout.
 */
function attachCartListeners() {
    // 1. Remove Item
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            updateCartItem(id, 0); // Quantity 0 means remove
        });
    });

    // 2. Quantity Change
    document.querySelectorAll('.cart-qty-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const newQty = parseInt(e.target.value);
            if (newQty < 1 || isNaN(newQty)) {
                e.target.value = 1; 
                updateCartItem(id, 1);
            } else {
                updateCartItem(id, newQty);
            }
        });
    });

    // 3. Checkout Button - Attach WhatsApp handler
    // We remove any existing listener first to ensure only one handler is active
    checkoutButton.removeEventListener('click', handleCheckout); 
    checkoutButton.addEventListener('click', handleCheckout);
}

/**
 * Updates the quantity of an item in the cart or removes it.
 */
function updateCartItem(productId, newQuantity) {
    let currentCart = getCartItems();
    const existingItemIndex = currentCart.findIndex(item => item.id === productId);

    if (existingItemIndex > -1) {
        if (newQuantity <= 0) {
            currentCart.splice(existingItemIndex, 1);
        } else {
            currentCart[existingItemIndex].quantity = newQuantity;
        }

        localStorage.setItem('cartItems', JSON.stringify(currentCart));
        updateCartCount();
        renderCart();      
    }
}


// =================================================================
// 4. WHATSAPP CHECKOUT LOGIC
// =================================================================

const whatsappNumber = "276402099342"; // Your WhatsApp number (digits only, including country code)

/**
 * Gathers cart details and generates the pre-filled WhatsApp message.
 */
function generateWhatsAppMessage() {
    const currentCart = getCartItems();
    let message = "Hello Yusuf,\n\nI would like to place an order for the following items:\n\n";
    let subtotal = 0;
    
    if (currentCart.length === 0) {
        return encodeURIComponent("Hello Yusuf, I visited your cart but it appears to be empty. Can you please assist me with my order?");
    }

    currentCart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        message += `${item.quantity}x ${item.name} (R${item.price.toFixed(2)} each)\n`;
    });
    
    const shippingCost = 100.00;
    const total = subtotal + shippingCost;

    // Add summary
    message += `\n---\n`;
    message += `Subtotal: R${subtotal.toFixed(2)}\n`;
    message += `Shipping: R${shippingCost.toFixed(2)}\n`;
    message += `Order Total: R${total.toFixed(2)}\n`;
    message += `\nPlease confirm the availability and final total. Thank you!`;

    // URL-encode the message
    return encodeURIComponent(message);
}

/**
 * Handles the checkout button click to redirect to WhatsApp.
 */
function handleCheckout() {
    const encodedMessage = generateWhatsAppMessage();
    
    // Construct the WhatsApp link
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Redirect the user
    window.open(whatsappLink, '_blank');
}


// =================================================================
// 5. ADMIN LOGIN MODAL LOGIC (Based on script.js)
// =================================================================

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password123"; 

const adminIcon = document.getElementById('adminIcon');
const adminModal = document.getElementById('adminModal');
const closeButton = adminModal ? adminModal.querySelector('.close-button') : null;
const adminLoginForm = document.getElementById('adminLoginForm');
const loginMessage = document.getElementById('loginMessage');

if (adminIcon) {
    adminIcon.addEventListener('click', (e) => {
        e.preventDefault();
        if (adminModal) {
            adminModal.style.display = 'block';
            if (loginMessage) loginMessage.style.display = 'none';
        }
    });
}

if (closeButton) {
    closeButton.onclick = function() {
        adminModal.style.display = 'none';
    }
}

window.onclick = function(event) {
    if (event.target === adminModal) {
        adminModal.style.display = 'none';
    }
}

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const usernameInput = document.getElementById('admin-username').value;
        const passwordInput = document.getElementById('admin-password').value;

        if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
            loginMessage.textContent = 'Login successful! Redirecting...';
            loginMessage.style.color = '#4CAF50'; 
            loginMessage.style.display = 'block';
            
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);

        } else {
            loginMessage.textContent = 'Invalid username or password.';
            loginMessage.style.color = '#ff4444'; 
            loginMessage.style.display = 'block';
        }
    });
}


// =================================================================
// 6. INITIALIZATION
// =================================================================

// Initialize cart count on all pages
updateCartCount(); 

// Initialize cart page display when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only run renderCart if the necessary elements are present (i.e., we are on the cart page)
    if (cartContainer && cartSummaryElement) {
        renderCart();
    }
});