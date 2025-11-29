// men.js

// 1. CONFIGURATION: REPLACE THESE WITH YOUR ACTUAL SUPABASE DETAILS
// NOTE: If you are seeing 401 errors, double check these keys!
const SUPABASE_URL = 'https://vbsnssijyfgfnjoaefrl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZic25zc2lqeWZnZm5qb2FlZnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjgzMTgsImV4cCI6MjA3ODkwNDMxOH0.LsENEzsmQ3HzCnkawgL4xvdvjsldGg4gIuX3Avf2Qes';

// Initialize the Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get reference to the container from men.html
const productListElement = document.getElementById('product-list');

// --- RENDERING FUNCTION ---

/**
 * Renders the fetched product array into the HTML container.
 * @param {Array<Object>} products - Array of product objects.
 */
function renderProducts(products) {
    if (!productListElement) return;

    if (products.length === 0) {
        productListElement.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">No men\'s perfumes found.</p>';
        return;
    }

    productListElement.innerHTML = products.map(product => {
        const stockStatusClass = product.qty > 0 ? 'in-stock' : 'out-of-stock';
        
        return `
        <div class="product-card" data-id="${product.id}">
            <img src="${product.image_url}" alt="${product.name}">
            <div class="product-info">
                <h4 class="perfume-name">${product.name}</h4>
                <p class="price-display">R${product.price ? product.price.toFixed(2) : '0.00'}</p>
                <p class="description-text">${product.description || 'A rare blend of exquisite notes, perfect for a lasting impression.'}</p>
                <div class="stock-info">
                    <span class="stock-status ${stockStatusClass}">${product.qty > 0 ? 'In Stock' : 'Out of Stock'}</span>
                    <span class="category-tag"><small>${product.category}</small></span>
                </div>
            </div>

            <button class="add-to-cart" 
                    data-name="${product.name}" 
                    data-price="${product.price}" 
                    data-id="${product.id}"
                    ${product.qty <= 0 ? 'disabled' : ''}>
                ${product.qty <= 0 ? 'Sold Out' : 'Add to Cart'}
            </button>
        </div>
        `;
    }).join('');
}

// --- FETCHING FUNCTION ---

/**
 * Fetches only products where the category is 'Men' (case-insensitive).
 */
async function fetchMenProducts() {
    if (!productListElement) return;

    // Show loading state
    productListElement.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px 0;">
            <i class="fas fa-spinner fa-spin fa-3x" style="color: #4CAF50; margin-bottom: 15px;"></i>
            <p>Loading men's perfumes...</p>
        </div>
    `;

    // FIX: Changed .eq('category', 'Men') to the case-insensitive .ilike('category', 'men')
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .ilike('category', 'men') // <--- FIXED for case-insensitivity
        .order('id', { ascending: false });

    if (error) {
        // Log and display a better error message if the fetch fails (e.g., 401 error)
        console.error('Error fetching men\'s products:', error.message || error);
        productListElement.innerHTML = `<p style="color:red; grid-column: 1 / -1;">Error loading products: ${error.message || 'Check console for details (possible 401 Unauthorized).'}</p>`;
        return;
    }

    renderProducts(products);
}

// Initialize the fetch when the script loads
fetchMenProducts();