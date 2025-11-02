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
