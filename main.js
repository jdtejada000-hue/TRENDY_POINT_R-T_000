document.addEventListener('DOMContentLoaded', () => {
    let inventory = [];
    let cart = [];

    // --- Selectors ---
    const productGrid = document.getElementById('productGrid');
    const productSearch = document.getElementById('productSearch');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cartBtn = document.getElementById('cartBtn');
    const cartCount = document.getElementById('cartCount');
    const sideDrawer = document.getElementById('sideDrawer');
    const closeDrawer = document.getElementById('closeDrawer');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const proceedToCheckout = document.getElementById('proceedToCheckout');
    const orderModal = document.getElementById('orderModal');
    const closeModal = document.querySelector('.close-modal');
    const orderForm = document.getElementById('orderForm');

    // --- Supabase Config ---
    const SUPABASE_URL = 'https://YOUR_PROJECT_URL.supabase.co';
    const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
    const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

    // --- Data Loading ---
    fetch('inventory.json')
        .then(response => response.json())
        .then(data => {
            inventory = data;
            renderProducts(inventory);
            initAnimations();
        });

    // --- Functions ---
    function renderProducts(products) {
        productGrid.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.setAttribute('data-category', product.category);
            
            // Check for generated image or use icon
            const imgContent = product.image 
                ? `<img src="${product.image}" alt="${product.name}" class="p-img-rendering">` 
                : `<i class="fas ${getCategoryIcon(product.category)}"></i>`;

            card.innerHTML = `
                <div class="product-img">
                    ${imgContent}
                </div>
                <h3>${product.name}</h3>
                <span class="product-price">$${product.price.toLocaleString()}</span>
                <p class="product-desc">${product.description}</p>
                <div class="card-actions">
                    <button class="btn btn-primary btn-card add-to-cart" data-id="${product.id}">Adquirir</button>
                </div>
            `;
            productGrid.appendChild(card);
        });

        // Re-init Tilt
        VanillaTilt.init(document.querySelectorAll(".product-card"), {
            max: 10,
            speed: 400,
            glare: true,
            "max-glare": 0.2
        });
    }

    function getCategoryIcon(category) {
        const icons = {
            'Smartwatch': 'fa-stopwatch-20',
            'Audio': 'fa-headphones',
            'TV & Streaming': 'fa-tv',
            'Accesorios': 'fa-plug',
            'Vape': 'fa-wind',
            'Gaming': 'fa-gamepad',
            'Combo': 'fa-box-open',
            'Hogar': 'fa-house-laptop'
        };
        return icons[category] || 'fa-microchip';
    }

    function updateCart() {
        cartCount.innerText = cart.length;
        renderCartItems();
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotal.innerText = `$${total.toLocaleString()}`;
    }

    function renderCartItems() {
        cartItems.innerHTML = '';
        cart.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span>$${item.price.toLocaleString()}</span>
                </div>
                <button class="remove-item" data-index="${index}">&times;</button>
            `;
            cartItems.appendChild(itemEl);
        });
    }

    function initAnimations() {
        gsap.registerPlugin(ScrollTrigger);
        gsap.from(".hero-text > *", {
            y: 50,
            opacity: 0,
            duration: 1.2,
            stagger: 0.2,
            ease: "power3.out"
        });
        
        gsap.from(".product-card", {
            scrollTrigger: {
                trigger: ".product-grid",
                start: "top 80%"
            },
            scale: 0.9,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "back.out(1.7)"
        });
    }

    // --- Event Listeners ---
    productSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = inventory.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.description.toLowerCase().includes(term)
        );
        renderProducts(filtered);
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            const filtered = category === 'all' ? inventory : inventory.filter(p => p.category === category);
            renderProducts(filtered);
        });
    });

    productGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const id = parseInt(e.target.dataset.id);
            const product = inventory.find(p => p.id === id);
            cart.push(product);
            updateCart();
            sideDrawer.classList.add('active');
        }
    });

    cartItems.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item')) {
            const index = parseInt(e.target.dataset.index);
            cart.splice(index, 1);
            updateCart();
        }
    });

    cartBtn.addEventListener('click', () => sideDrawer.classList.toggle('active'));
    closeDrawer.addEventListener('click', () => sideDrawer.classList.remove('active'));

    proceedToCheckout.addEventListener('click', () => {
        if (cart.length === 0) return alert("Por favor, selecciona al menos un artículo de lujo.");
        orderModal.classList.add('active');
        sideDrawer.classList.remove('active');
    });

    closeModal.addEventListener('click', () => orderModal.classList.remove('active'));

    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const itemsList = cart.map(i => i.name).join(', ');
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        
        const orderData = {
            customer_name: document.getElementById('fullName').value,
            cedula: document.getElementById('cedula').value,
            phone: document.getElementById('phone').value,
            delivery_address: document.getElementById('address').value,
            time_slot: document.querySelector('input[name="timeSlot"]:checked').value,
            items_summary: itemsList,
            total_price: total
        };

        if (supabase && SUPABASE_URL !== 'https://YOUR_PROJECT_URL.supabase.co') {
            const { error } = await supabase
                .from('trendy_orders')
                .insert([orderData]);

            if (error) {
                console.error("Error Supabase:", error);
                alert("Error técnico al procesar el protocolo. Intenta de nuevo.");
            } else {
                alert(`¡Gracias ${orderData.customer_name}! Tu pedido ha sido registrado con éxito. Un asesor de TRENDY POINT R&T validará tu entrega.`);
                finalizeOrder();
            }
        } else {
            console.log("Orden Recibida (Modo Local):", orderData);
            alert(`¡Gracias ${orderData.customer_name}! Pedido procesado localmente. Configura Supabase para persistencia real.`);
            finalizeOrder();
        }
    });

    function finalizeOrder() {
        cart = [];
        updateCart();
        orderModal.classList.remove('active');
        orderForm.reset();
    }
});
