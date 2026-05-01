document.addEventListener('DOMContentLoaded', async () => {
    let globalProducts = [];
    if (window.fetchProducts) {
        globalProducts = await window.fetchProducts();
    }
    // Mobile menu toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            // Future implementation for mobile menu
            alert('Mobile menu toggled');
        });
    }

    // Simple scroll animation for cards
    const cards = document.querySelectorAll('.card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    cards.forEach(card => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });

    // ===== Search Bar with Live Suggestions =====
    const searchBar = document.querySelector('.search-bar');
    const searchContainer = document.querySelector('.search-container');
    const searchBtn = document.querySelector('.search-btn');

    if (searchBar && searchContainer) {
        // Create suggestions dropdown
        let suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'search-suggestions';
        searchContainer.appendChild(suggestionsDiv);

        function getProducts() {
            return globalProducts;
        }

        function renderSuggestions(query) {
            const products = getProducts();
            const q = query.toLowerCase().trim();

            if (q.length < 1) {
                suggestionsDiv.classList.remove('active');
                return;
            }

            const matches = products.filter(p => p.name.toLowerCase().includes(q));

            if (matches.length === 0) {
                suggestionsDiv.innerHTML = '<div class="search-no-results">No products found</div>';
                suggestionsDiv.classList.add('active');
                return;
            }

            suggestionsDiv.innerHTML = '';
            matches.forEach(product => {
                const item = document.createElement('a');
                item.className = 'search-suggestion-item';
                item.href = `product.html?id=${product.id}`;
                item.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="search-suggestion-img">
                    <div class="search-suggestion-info">
                        <span class="search-suggestion-name">${product.name}</span>
                        <span class="search-suggestion-price">৳${product.price}</span>
                    </div>
                `;
                suggestionsDiv.appendChild(item);
            });
            suggestionsDiv.classList.add('active');
        }

        searchBar.addEventListener('input', function() {
            renderSuggestions(this.value);
        });

        searchBar.addEventListener('focus', function() {
            if (this.value.trim().length >= 1) {
                renderSuggestions(this.value);
            }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchContainer.contains(e.target)) {
                suggestionsDiv.classList.remove('active');
            }
        });

        // Search button & Enter key → go to collections page with query
        function performSearch() {
            const q = searchBar.value.trim();
            if (q.length > 0) {
                window.location.href = `collections.html?search=${encodeURIComponent(q)}`;
            }
        }

        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch();
        });

        searchBar.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }

    // Cart Sidebar Logic
    const cartOpenBtn = document.getElementById('cartOpenBtn');
    const cartCloseBtn = document.getElementById('cartCloseBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');

    function openCart(e) {
        if(e) e.preventDefault();
        if(cartSidebar && cartOverlay) {
            cartSidebar.classList.add('open');
            cartOverlay.classList.add('active');
        }
    }

    function closeCart(e) {
        if(e) e.preventDefault();
        if(cartSidebar && cartOverlay) {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('active');
        }
    }

    if(cartOpenBtn) {
        cartOpenBtn.addEventListener('click', openCart);
    }
    
    if(cartCloseBtn) {
        cartCloseBtn.addEventListener('click', closeCart);
    }
    
    if(cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    // Cart State & Functionality
    let cart = JSON.parse(localStorage.getItem('fabbly_cart')) || [];

    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    const cartCounts = document.querySelectorAll('.cart-count');
    
    function renderCart() {
        if(!cartItemsContainer) return;
        
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let count = 0;
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Your bag is empty.</p>';
        } else {
            cart.forEach((item, index) => {
                total += item.price * item.quantity;
                count += item.quantity;
                
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <div class="cart-item-img-wrap">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    </div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <p class="cart-item-size">Size: ${item.size}</p>
                        <div class="cart-item-qty">
                            <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                        </div>
                    </div>
                    <div class="cart-item-price-remove">
                        <button class="remove-btn" onclick="removeItem(${index})" aria-label="Remove item">&times;</button>
                        <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });
        }
        
        if (cartTotalPrice) cartTotalPrice.innerText = '$' + total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        cartCounts.forEach(c => {
            c.innerText = count;
        });
        localStorage.setItem('fabbly_cart', JSON.stringify(cart));
    }

    window.updateQty = function(index, delta) {
        if (cart[index]) {
            cart[index].quantity += delta;
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
            renderCart();
        }
    };
    
    window.removeItem = function(index) {
        cart.splice(index, 1);
        renderCart();
    };

    // Add To Bag Action (Product Page)
    const addBtn = document.querySelector('.add-to-cart-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const titleEl = document.querySelector('.product-details h1');
            const priceEl = document.querySelector('.product-price');
            const imgEl = document.querySelector('.product-image-container img');
            const activeSizeEl = document.querySelector('.size-btn.active');
            
            if (!activeSizeEl) {
                alert('Please select a size first.');
                return;
            }
            
            if(titleEl && priceEl && imgEl) {
                const name = titleEl.innerText;
                const priceMatch = priceEl.innerText.match(/[\d,.]+/);
                const priceStr = priceMatch ? priceMatch[0].replace(/,/g, '') : '0';
                const price = parseFloat(priceStr);
                const image = imgEl.src;
                const size = activeSizeEl.innerText;
                
                const existingItem = cart.find(i => i.name === name && i.size === size);
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({ name, price, image, size, quantity: 1 });
                }
                
                renderCart();
                openCart();
            }
        });
    }

    // Load dynamic products in Collections page
    const collectionsGrid = document.getElementById('collectionsGrid');
    if (collectionsGrid) {
        let products = globalProducts;
        
        // Check for search query in URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        
        if (searchQuery && searchQuery.trim().length > 0) {
            const q = searchQuery.toLowerCase().trim();
            products = products.filter(p => p.name.toLowerCase().includes(q));
            
            // Pre-fill search bar with query
            if (searchBar) searchBar.value = searchQuery;
            
            // Update heading to show search results
            const heading = document.querySelector('.collections h2');
            if (heading) {
                heading.innerHTML = `Results for "<em>${searchQuery}</em>"`;
            }
        }
        
        if (products.length === 0) {
            collectionsGrid.innerHTML = searchQuery 
                ? '<p style="text-align:center; padding: 2rem; color: #999;">No products match your search. Try a different keyword.</p>'
                : '<p>No products available yet.</p>';
        } else {
            collectionsGrid.innerHTML = '';
            products.forEach(product => {
                const card = document.createElement('a');
                card.href = `product.html?id=${product.id}`;
                card.className = 'card';
                card.innerHTML = `
                    <div class="product-card-image-wrap">
                        <img src="${product.image}" alt="${product.name}" class="card-image" style="object-fit: cover; object-position: center; border-radius: 12px;">
                    </div>
                    <div class="product-card-info">
                        <h3 class="product-card-title">${product.name}</h3>
                        <p class="product-card-price">৳${product.price}</p>
                        <div class="product-card-rating">
                            <span class="stars">★★★★★</span>
                        </div>
                    </div>
                `;
                
                // Add intersection observer animation
                card.style.opacity = 0;
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.6s ease-out';
                observer.observe(card);
                
                collectionsGrid.appendChild(card);
            });
        }
    }

    renderCart();
});
