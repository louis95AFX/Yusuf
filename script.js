let cart = JSON.parse(localStorage.getItem('cart')) || [];
const cartCount = document.getElementById('cart-count');

function updateCartCount() {
  cartCount.textContent = cart.length;
}

document.querySelectorAll('.add-to-cart').forEach(button => {
  button.addEventListener('click', () => {
    const name = button.getAttribute('data-name');
    const price = parseFloat(button.getAttribute('data-price'));
    cart.push({ name, price });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

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

updateCartCount();

// script.js (Admin Login Modal Logic)

// --- ADMIN LOGIN MODAL LOGIC ---

// Configuration for the Admin Credentials 
// WARNING: This is for local demonstration only and INSECURE for production.
// You must replace this with Supabase Authentication or server-side checks.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password123"; 

// Get DOM elements
const adminIcon = document.getElementById('adminIcon');
const adminModal = document.getElementById('adminModal');
const closeButton = adminModal ? adminModal.querySelector('.close-button') : null;
const adminLoginForm = document.getElementById('adminLoginForm');
const loginMessage = document.getElementById('loginMessage');

if (adminIcon) {
    // Event to show the modal when the icon is clicked
    adminIcon.addEventListener('click', (e) => {
        e.preventDefault();
        if (adminModal) {
            adminModal.style.display = 'block';
            if (loginMessage) loginMessage.style.display = 'none';
        }
    });
}

if (closeButton) {
    // Event to close the modal using the X button
    closeButton.onclick = function() {
        adminModal.style.display = 'none';
    }
}

// Event to close the modal by clicking outside
window.onclick = function(event) {
    if (event.target === adminModal) {
        adminModal.style.display = 'none';
    }
}

if (adminLoginForm) {
    // Event to handle login form submission
    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const usernameInput = document.getElementById('admin-username').value;
        const passwordInput = document.getElementById('admin-password').value;

        if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
            // Successful login
            loginMessage.textContent = 'Login successful! Redirecting...';
            loginMessage.style.color = '#4CAF50'; 
            loginMessage.style.display = 'block';
            
            // Redirect to the admin page after a short delay
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);

        } else {
            // Failed login
            loginMessage.textContent = 'Invalid username or password.';
            loginMessage.style.color = '#ff4444'; 
            loginMessage.style.display = 'block';
        }
    });
}