// --- Integrated cart.js / cart-display.js ---

const cartContainer = document.getElementById('cart-container');
const cartSummaryElement = document.getElementById('cart-summary');
const checkoutButton = document.getElementById('checkout-btn');
const whatsappNumber = "276402099342"; // **FIXED: Use only digits for the number, no spaces, no '+'**

// --- Cart Rendering Logic ---

/**
 * Renders the cart contents and summary to the cart page.
 */
function renderCart() {
    // getCartItems() should fetch the cart array from localStorage/session
    const cart = getCartItems();
    cartContainer.innerHTML = ''; // Clear previous content
    let subtotal = 0;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="empty-cart">Your shopping cart is currently empty. <a href="collections.html">Start shopping!</a></p>';
        cartSummaryElement.innerHTML = '';
        checkoutButton.disabled = true;
        return;
    }

    cart.forEach(item => {
        // Assume 'item' has properties: id, name, price, quantity
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const cartItemDiv = document.createElement('div');
        // NOTE: Changed class from 'cart-item-card' to 'cart-item' to match your renderCart logic
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

// ... (renderSummary function remains the same) ...

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


// --- WhatsApp Checkout Logic ---

/**
 * Gathers cart details using the cart data array and generates the pre-filled WhatsApp message.
 * This is more reliable than reading from the DOM after rendering.
 * @returns {string} The URL-encoded message text.
 */
function generateWhatsAppMessage() {
    // Get the current cart array directly
    const cart = getCartItems(); 
    let message = "Hello Yusuf,\n\nI would like to place an order for the following items:\n\n";
    let subtotal = 0;
    
    if (cart.length === 0) {
        return encodeURIComponent("Hello Yusuf, I visited your cart but it appears to be empty. Can you please assist me with my order?");
    }

    // Loop through the data in the cart array
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        // Accumulate the message details
        // Note: Assuming Rands (R) based on your renderCart code
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


// --- Event Listeners ---

/**
 * Attaches event listeners for removing items and changing quantities, AND Checkout.
 */
function attachCartListeners() {
    // 1. Remove Item & 2. Quantity Change (These remain the same)
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            updateCartItem(id, 0); // Quantity 0 means remove
        });
    });

    document.querySelectorAll('.cart-qty-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const newQty = parseInt(e.target.value);
            if (newQty < 1 || isNaN(newQty)) {
                // If invalid, revert to 1 or remove entirely
                e.target.value = 1; 
                updateCartItem(id, 1);
            } else {
                updateCartItem(id, newQty);
            }
        });
    });

    // 3. Checkout Button - REMOVE the old alert and ADD the WhatsApp handler
    // We remove the old listener first to avoid duplication
    checkoutButton.removeEventListener('click', () => { /* old listener function */ });
    checkoutButton.addEventListener('click', handleCheckout);
}

// ... (updateCartItem function remains the same) ...

/**
 * Updates the quantity of an item in the cart or removes it.
 * @param {string} productId - The ID of the item.
 * @param {number} newQuantity - The new quantity (0 to remove).
 */
function updateCartItem(productId, newQuantity) {
    let cart = getCartItems(); // Assume this retrieves the current cart array
    const existingItemIndex = cart.findIndex(item => item.id === productId);

    if (existingItemIndex > -1) {
        if (newQuantity <= 0) {
            // Remove the item
            cart.splice(existingItemIndex, 1);
        } else {
            // Update the quantity
            cart[existingItemIndex].quantity = newQuantity;
        }

        // Save and re-render
        localStorage.setItem('cartItems', JSON.stringify(cart));
        // updateCartCount(); // Assume this is a function to update the header count
        renderCart();      // Re-render the cart page
    }
}


// --- Initialize Cart Page on Load ---
document.addEventListener('DOMContentLoaded', renderCart);