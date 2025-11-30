// admin.js

// 1. CONFIGURATION: REPLACE THESE WITH YOUR ACTUAL SUPABASE DETAILS
const SUPABASE_URL = 'https://vbsnssijyfgfnjoaefrl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZic25zc2lqeWZnZm5qb2FlZnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjgzMTgsImV4cCI6MjA3ODkwNDMxOH0.LsENEzsmQ3HzCnkawgL4xvdvjsldGg4gIuX3Avf2Qes';

// Initialize the Supabase client correctly
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get references to the DOM elements (These may be null on public pages)
const form = document.getElementById('addProductForm');
const messageElement = document.getElementById('message');
const productListElement = document.getElementById('product-list');

// --- EDIT MODAL VARIABLES ---
const editModal = document.getElementById('editModal');
const closeButton = document.querySelector('.modal-content .close-button');
const editProductForm = document.getElementById('editProductForm');

// ------------------------------------------------------------------
// --- NEW CART MANAGEMENT LOGIC ---
// ------------------------------------------------------------------

/**
 * Retrieves the current cart array from localStorage.
 * @returns {Array} The cart array, or an empty array if none exists.
 */
function getCartItems() {
    return JSON.parse(localStorage.getItem('cartItems')) || [];
}

/**
 * Updates the visual cart count displayed in the header.
 */
function updateCartCount() {
    const cart = getCartItems();
    const cartCountElement = document.getElementById('cart-count');
    
    if (cartCountElement) {
        // Calculate the total quantity of all items in the cart
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

/**
 * Adds a product to the local shopping cart and updates the count.
 * @param {string} productId - The unique ID of the product.
 * @param {string} productName - The name of the product.
 * @param {number} productPrice - The price of the product.
 */
function addToCart(productId, productName, productPrice) {
    let cart = getCartItems();
    
    // Find the quantity input field associated with this product ID
    const qtyInput = document.getElementById(`qty-${productId}`);
    // Default quantity to 1 if the input is not found or invalid
    const selectedQty = qtyInput ? parseInt(qtyInput.value) : 1; 
    
    if (selectedQty < 1 || isNaN(selectedQty)) return; 

    // Find the item in the cart
    const existingItemIndex = cart.findIndex(item => item.id === productId);

    if (existingItemIndex > -1) {
        // Item exists: increase the quantity
        cart[existingItemIndex].quantity += selectedQty;
    } else {
        // Item does not exist: add a new item object
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: selectedQty
        });
    }

    // Save the updated cart back to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cart));
    
    // Update the visual cart count
    updateCartCount();
    
    console.log(`${selectedQty} x ${productName} added to cart.`);
}

// --- HELPER FUNCTIONS (Existing) ---

function displayMessage(msg, isSuccess = true) {
    if (!messageElement) return; // Exit if not on the admin page
    
    messageElement.textContent = msg;
    messageElement.style.backgroundColor = isSuccess ? '#D4EDDA' : '#F8D7DA';
    messageElement.style.color = isSuccess ? '#155724' : '#721C24';
    messageElement.style.display = 'block';
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

// --- PRODUCT ADDITION LOGIC (Admin Only - Existing) ---

async function handleProductSubmit(event) {
    event.preventDefault();
    if (!messageElement) return;
    
    messageElement.style.display = 'none';

    // Capture fields
    const name = document.getElementById('name').value;
    const price = parseFloat(document.getElementById('price').value);
    const category = document.getElementById('category').value;
    const imageFile = document.getElementById('image').files[0];
    const description = document.getElementById('description').value;
    const qty = parseInt(document.getElementById('qty').value);

    if (!name || isNaN(price) || !imageFile || !description || isNaN(qty)) {
        displayMessage('Please fill out all fields correctly, including description and quantity.', false);
        return;
    }

    try {
        // 1. UPLOAD IMAGE
        // Ensure category is used for path to avoid collisions
        const filePath = `${category.replace(/\s/g, '_')}/${Date.now()}_${imageFile.name}`; 
        const { error: uploadError } = await supabaseClient.storage
            .from('product_images')
            .upload(filePath, imageFile);
        if (uploadError) throw uploadError;

        // 2. GET PUBLIC URL
        const { data: publicURLData } = supabaseClient.storage
            .from('product_images')
            .getPublicUrl(filePath);
        const image_url = publicURLData.publicUrl;
        
        // 3. INSERT PRODUCT DATA
        const { error: insertError } = await supabaseClient
            .from('products')
            .insert([{ name, price, category, image_url, description, qty }]);

        if (insertError) throw insertError;

        displayMessage(`Product "${name}" added successfully!`);
        form.reset();
        fetchProducts();
    
    } catch (error) {
        console.error('Error adding product:', error);
        displayMessage(`Error adding product: ${error.message}`, false);
    }
}

// ------------------------------------------------------------------
// --- PRODUCT LISTING, EDITING, AND DELETION LOGIC ---
// ------------------------------------------------------------------

async function fetchProducts() {
    if (!productListElement) return;

    const isAdminPage = !!form;

    // 1. SHOW LOADING SPINNER
    productListElement.innerHTML = `
        <div id="loading-spinner-container" style="grid-column: 1 / -1; text-align: center; padding: 50px 0;">
            <i class="fas fa-spinner fa-spin fa-3x" style="color: #4CAF50; margin-bottom: 15px;"></i>
            <p>${isAdminPage ? 'Loading admin inventory...' : 'Loading exquisite perfumes...'}</p>
        </div>
    `;

    // 2. FETCH DATA
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('id', { ascending: false });

    // 3. HANDLE ERRORS
    if (error) {
        console.error('Error fetching products:', error);
        productListElement.innerHTML = '<p style="color:red; grid-column: 1 / -1;">Error loading products.</p>';
        return;
    }

    // 4. HANDLE EMPTY DATA
    if (products.length === 0) {
        productListElement.innerHTML = '<p style="grid-column: 1 / -1;">No products found in the database.</p>';
        return;
    }

    // 5. RENDER PRODUCTS
    productListElement.innerHTML = products.map(product => {
        const stockStatusClass = product.qty > 0 ? 'in-stock' : 'out-of-stock';
        const stockMessage = product.qty > 0 ? 'In Stock' : 'Out of Stock';
        
        return `
        <div class="product-card ${isAdminPage ? 'product-item' : ''}">
            <img src="${product.image_url}" alt="${product.name}">
            <div class="product-info">
                
                <h4 class="perfume-name">${product.name}</h4>

                <p class="price-display">R${product.price ? product.price.toFixed(2) : '0.00'}</p>
                
                <p class="description-text">${product.description || 'A rare blend of exquisite notes, perfect for a lasting impression.'}</p>
                
                <div class="stock-info">
                    <span class="stock-status ${stockStatusClass}">${stockMessage}</span>
                    <span class="category-tag"><small>${product.category}</small></span>
                </div>
                
                ${!isAdminPage ? `
                    <div class="quantity-selector">
                        <label for="qty-${product.id}">Qty:</label>
                        <input type="number" id="qty-${product.id}" value="1" min="1" max="${product.qty}" class="qty-input" ${product.qty <= 0 ? 'disabled' : ''}>
                    </div>
                ` : ''}
            </div>

            ${isAdminPage ? `
                <div class="admin-actions">
                    <button data-id="${product.id}" class="edit-btn">Edit</button> 
                    <button data-id="${product.id}" data-image="${product.image_url}" class="delete-btn">Delete</button>
                </div>
            ` : `
                <button class="add-to-cart" 
                        data-name="${product.name}" 
                        data-price="${product.price}" 
                        data-id="${product.id}"
                        ${product.qty <= 0 ? 'disabled' : ''}>
                    ${product.qty <= 0 ? 'Sold Out' : 'Add to Cart'}
                </button>
            `}
        </div>
        `;
    }).join('');
    
    // 6. ATTACH CART LISTENERS only on the public page
    if (!isAdminPage) {
        attachAddToCartListeners();
    }
}


// --- PRODUCT DELETION FUNCTION (Existing) ---

async function handleDelete(productId, imageURL) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }

    // 1. Delete the Database Record
    const { error: dbError } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', productId);

    if (dbError) {
        console.error('Error deleting product record:', dbError);
        alert('Failed to delete product record: ' + dbError.message);
        return;
    }

    // 2. Delete the Image from Storage 
    if (imageURL) {
        try {
            // Get the file name/path from the full public URL
            const urlParts = imageURL.split('/');
            const fileName = urlParts.slice(urlParts.findIndex(part => part === 'product_images') + 1).join('/');

            const { error: storageError } = await supabaseClient
                .storage
                .from('product_images') // **Ensure this matches your Supabase bucket name**
                .remove([fileName]);

            if (storageError) {
                console.warn('Warning: Failed to delete image from storage (it might be in a path):', storageError);
            }
        } catch (e) {
            console.error('Error during image deletion process:', e);
        }
    }

    alert('Product deleted successfully!');
    // 3. Refresh the product list after deletion
    fetchProducts(); 
}


// --- PRODUCT EDITING FUNCTIONS (Existing) ---

async function openEditModal(productId) {
    // 1. Fetch the product details
    const { data: product, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (error) {
        console.error('Error fetching product for edit:', error);
        alert('Could not load product details.');
        return;
    }

    // 2. Populate the form fields
    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-description').value = product.description;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-qty').value = product.qty;
    document.getElementById('edit-category').value = product.category;
    document.getElementById('edit-original-image-url').value = product.image_url;

    const imageName = product.image_url.split('/').pop();
    document.getElementById('current-image-name').textContent = imageName;

    // 3. Display the modal
    document.getElementById('edit-message').textContent = '';
    editModal.style.display = 'block';
}


async function editProduct(e) {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value;
    const description = document.getElementById('edit-description').value;
    const price = parseFloat(document.getElementById('edit-price').value);
    const qty = parseInt(document.getElementById('edit-qty').value);
    const category = document.getElementById('edit-category').value;
    const imageFile = document.getElementById('edit-image').files[0];
    const originalImageUrl = document.getElementById('edit-original-image-url').value;
    const messageElement = document.getElementById('edit-message');

    messageElement.textContent = 'Saving changes...';
    messageElement.style.color = 'blue';

    let imageUrl = originalImageUrl;
    
    // 1. Handle Image Update (if a new file is selected)
    if (imageFile) {
        try {
            // Delete old image from storage bucket
            const urlParts = originalImageUrl.split('/');
            const oldFilePath = urlParts.slice(urlParts.findIndex(part => part === 'product_images') + 1).join('/');

            const { error: deleteError } = await supabaseClient
                .storage
                .from('product_images') 
                .remove([oldFilePath]);

            if (deleteError) {
                console.error('Error deleting old image:', deleteError);
            }

            // Upload the new image file
            const newFilePath = `${category.replace(/\s/g, '_')}/${Date.now()}_${imageFile.name}`; 
            const { error: uploadError } = await supabaseClient
                .storage
                .from('product_images') 
                .upload(newFilePath, imageFile);

            if (uploadError) throw uploadError;

            // Get the public URL for the new image
            const { data: urlData } = supabaseClient
                .storage
                .from('product_images')
                .getPublicUrl(newFilePath);
            
            imageUrl = urlData.publicUrl;

        } catch (error) {
            console.error('Image upload error:', error);
            messageElement.textContent = `Error updating image: ${error.message}`;
            messageElement.style.color = 'red';
            return;
        }
    }

    // 2. Update the product record in the database
    const { error: updateError } = await supabaseClient
        .from('products')
        .update({
            name: name,
            description: description,
            price: price,
            qty: qty,
            category: category,
            image_url: imageUrl
        })
        .eq('id', id);

    if (updateError) {
        console.error('Error updating product:', updateError);
        messageElement.textContent = `Error updating product: ${updateError.message}`;
        messageElement.style.color = 'red';
    } else {
        messageElement.textContent = 'Product updated successfully!';
        messageElement.style.color = 'green';
        
        // Refresh the product list and close the modal after a delay
        setTimeout(() => {
            editModal.style.display = 'none';
            fetchProducts(); 
        }, 1500);
    }
}

// ------------------------------------------------------------------
// --- EVENT LISTENER FUNCTION FOR CART BUTTONS ---
// ------------------------------------------------------------------

function attachAddToCartListeners() {
    productListElement.querySelectorAll('.add-to-cart').forEach(button => {
        // Ensure the listener is not added multiple times
        button.removeEventListener('click', handleAddToCartClick);
        button.addEventListener('click', handleAddToCartClick);
    });
}

function handleAddToCartClick(e) {
    const target = e.currentTarget; // Use currentTarget to get the button itself
    const id = target.dataset.id;
    const name = target.dataset.name;
    const price = parseFloat(target.dataset.price); 
    
    if (id && name && !isNaN(price)) {
        addToCart(id, name, price);
    } else {
        console.error("Missing or invalid product data on Add to Cart button.");
    }
}


// --- EVENT LISTENERS AND INITIALIZATION (Modified) ---

// Event listener for the Edit Form submission
if (editProductForm) {
    editProductForm.addEventListener('submit', editProduct);
}

// Event listeners for closing the modal
if (closeButton) {
    closeButton.onclick = function() {
        editModal.style.display = 'none';
        document.getElementById('edit-message').textContent = ''; 
    }
}
window.onclick = function(event) {
    if (event.target == editModal) {
        editModal.style.display = 'none';
        document.getElementById('edit-message').textContent = ''; 
    }
}


// Event listener for Product Add form
if (form) { 
    form.addEventListener('submit', handleProductSubmit);
}

// Event delegation for Edit and Delete buttons on the product list
if (productListElement) { 
    productListElement.addEventListener('click', (e) => {
        const target = e.target;
        const productId = target.dataset.id;
        const imageURL = target.dataset.image;

        if (target.classList.contains('edit-btn') && productId) {
            openEditModal(productId);
        } else if (target.classList.contains('delete-btn') && productId) {
            handleDelete(productId, imageURL);
        }
    });
}

// Initial calls when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // 1. Update count from any existing items
    updateCartCount();
    
    // 2. Fetch and render products (which will attach listeners on public pages)
    fetchProducts();
});
