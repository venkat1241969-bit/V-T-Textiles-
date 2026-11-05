import { collection, getDocs, query, orderBy, where, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let allProducts = [];
let cart = [];
let selectedCategory = 'ALL';

window.loadStoreProducts = async function() {
    const container = document.getElementById('store-products-list');
    container.innerHTML = `<p class="text-gray-500 text-center py-6 text-xs col-span-2">ప్రొడక్ట్స్ లోడ్ అవుతున్నాయి...</p>`;

    try {
        const q = query(collection(window.db, "items"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        allProducts = [];

        querySnapshot.forEach((docSnap) => {
            allProducts.push({ id: docSnap.id, ...docSnap.data() });
        });

        displayProducts();
    } catch (e) {
        container.innerHTML = `<p class="text-red-500 text-center text-xs col-span-2">లోపం: ${e.message}</p>`;
    }
};

window.filterCategory = function(cat, btn) {
    selectedCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.remove('bg-rose-600', 'text-white');
        b.classList.add('bg-gray-100', 'text-gray-700');
    });
    btn.classList.remove('bg-gray-100', 'text-gray-700');
    btn.classList.add('bg-rose-600', 'text-white');
    displayProducts();
};

function displayProducts() {
    const container = document.getElementById('store-products-list');
    const filtered = selectedCategory === 'ALL' 
        ? allProducts 
        : allProducts.filter(p => (p.catalog || '').toUpperCase() === selectedCategory);

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-center py-8 text-xs col-span-2">ఈ కేటగిరీలో ప్రొడక్ట్స్ ఏవీ లేవు.</p>`;
        return;
    }

    let html = '';
    filtered.forEach(p => {
        const stock = Number(p.stock) || 0;
        const isOut = stock <= 0;
        
        html += `
            <div class="bg-white rounded-2xl p-2.5 border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                    <div onclick="openZoomModal('${p.image}', '${p.name}')" class="w-full h-52 bg-gray-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden border border-gray-100 cursor-pointer relative group">
                        <img src="${p.image}" class="w-full h-full object-contain">
                        <span class="absolute bottom-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow">🔍 జూమ్ చేయి</span>
                    </div>
                    <h3 class="font-bold text-xs text-gray-900 truncate">${p.name}</h3>
                    <p class="text-[10px] text-gray-500 line-clamp-1">${p.description || ''}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-rose-600 font-black text-sm">₹${p.price}</span>
                        <span class="text-gray-400 text-[10px] line-through">₹${Math.round(p.price * 1.3)}</span>
                        <span class="bg-rose-50 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded">30% OFF</span>
                    </div>
                </div>
                <div class="mt-3">
                    <p class="text-[10px] font-bold ${isOut ? 'text-red-500' : 'text-emerald-600'} mb-1">${isOut ? 'అవుట్ ఆఫ్ స్టాక్' : 'స్టాక్ లో ఉంది'}</p>
                    <button onclick="addToCart('${p.id}')" ${isOut ? 'disabled' : ''} class="w-full ${isOut ? 'bg-gray-300 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'} text-white py-1.5 rounded-lg text-xs font-bold shadow transition">
                        ${isOut ? 'అవుట్ ఆఫ్ స్టాక్' : 'కార్ట్‌కి జోడించు'}
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.openZoomModal = function(imgSrc, title) {
    document.getElementById('zoomImage').src = imgSrc;
    document.getElementById('zoomTitle').innerText = title;
    document.getElementById('zoomModal').classList.remove('hidden');
};

window.closeZoomModal = function() {
    document.getElementById('zoomModal').classList.add('hidden');
};

window.addToCart = function(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
    alert("ప్రొడక్ట్ కార్ట్‌కి జోడించబడింది!");
};

function updateCartUI() {
    const countElem = document.getElementById('cart-count');
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    countElem.innerText = totalQty;
}

window.openCartModal = function() {
    document.getElementById('cartModal').classList.remove('hidden');
    const container = document.getElementById('cart-items-list');
    
    if (cart.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-center py-6 text-xs">మీ కార్ట్ ఖాళీగా ఉంది.</p>`;
        document.getElementById('cart-total-amount').innerText = "₹0";
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        html += `
            <div class="flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-200 text-xs">
                <div>
                    <h4 class="font-bold text-gray-900">${item.name}</h4>
                    <p class="text-rose-600 font-semibold">₹${item.price} x ${item.qty}</p>
                </div>
                <button onclick="removeFromCart(${index})" class="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded">తొలగించు</button>
            </div>
        `;
    });
    container.innerHTML = html;
    document.getElementById('cart-total-amount').innerText = `₹${total}`;
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
    openCartModal();
};

window.closeCartModal = function() {
    document.getElementById('cartModal').classList.add('hidden');
};

window.openCheckoutModal = function() {
    if (cart.length === 0) {
        alert("కార్ట్ ఖాళీగా ఉంది!");
        return;
    }
    closeCartModal();
    document.getElementById('checkoutModal').classList.remove('hidden');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('checkout-total').innerText = `₹${total}`;
};

window.closeCheckoutModal = function() {
    document.getElementById('checkoutModal').classList.add('hidden');
};

window.submitOrder = async function(event) {
    event.preventDefault();
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const address = document.getElementById('custAddress').value;
    const pincode = document.getElementById('custPincode').value;
    const utrNumber = document.getElementById('custUtr').value;

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const orderId = 'VT' + Math.floor(100000 + Math.random() * 900000);

    try {
        await addDoc(collection(window.db, "orders"), {
            orderId,
            name,
            phone,
            address,
            pincode,
            utrNumber,
            items: cart,
            total,
            timestamp: new Date().toISOString()
        });

        alert("మీ ఆర్డర్ విజయవంతంగా సమర్పించబడింది! ఆర్డర్ ఐడీ: " + orderId);
        cart = [];
        updateCartUI();
        closeCheckoutModal();
        document.getElementById('checkoutForm').reset();
    } catch(e) {
        alert("ఆర్డర్ సబ్మిట్ చేయడంలో లోపం: " + e.message);
    }
};

window.openMyOrdersModal = function() {
    document.getElementById('myOrdersModal').classList.remove('hidden');
};

window.closeMyOrdersModal = function() {
    document.getElementById('myOrdersModal').classList.add('hidden');
};

window.searchMyOrders = async function() {
    const phone = document.getElementById('searchPhone').value.trim();
    const container = document.getElementById('my-orders-result');
    
    if(!phone) {
        alert("దయచేసి మీ ఫోన్ నంబర్ ఎంటర్ చేయండి!");
        return;
    }

    container.innerHTML = `<p class="text-gray-500 text-center text-xs py-4">వెతుకుతోంది...</p>`;

    try {
        const q = query(collection(window.db, "orders"), where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if(querySnapshot.empty) {
            container.innerHTML = `<p class="text-red-500 text-center text-xs py-4">ఈ నంబర్‌తో ఎలాంటి ఆర్డర్లు కనుగొనబడలేదు.</p>`;
            return;
        }

        let html = '';
        querySnapshot.forEach((docSnap) => {
            const ord = docSnap.data();
            let formattedDateTime = "సమయం అందుబాటులో లేదు";
            if (ord.timestamp) {
                formattedDateTime = new Date(ord.timestamp).toLocaleString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                });
            }

            html += `
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs space-y-1.5 shadow-sm">
                    <div class="flex justify-between font-bold text-gray-900 border-b pb-1">
                        <span>🆔 ${ord.orderId}</span>
                        <span class="text-rose-600">₹${ord.total}</span>
                    </div>
                    <p class="text-[10px] text-rose-700 font-bold">📅 ఆర్డర్ చేసిన తేదీ & సమయం: ${formattedDateTime}</p>
                    <p class="text-[10px] text-gray-600"><b>పేరు:</b> ${ord.name} | <b>ఫోన్:</b> ${ord.phone}</p>
                    <p class="text-[10px] text-gray-600"><b>అడ్రస్:</b> ${ord.address} - ${ord.pincode}</p>
                    <div class="bg-white p-2 rounded border border-gray-100 mt-1">
                        <p class="text-[10px] font-bold text-emerald-700">🚚 వేబిల్లు నంబర్ (Tracking): ${ord.waybill || 'త్వరలో అప్‌డేట్ చేయబడుతుంది'}</p>
                        <p class="text-[10px] text-gray-600"><b>షిప్పింగ్ తేదీ:</b> ${ord.shippingDate || 'చర్చలలో ఉంది'}</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = `<p class="text-red-500 text-center text-xs">లోపం: ${e.message}</p>`;
    }
};

window.onload = function() {
    loadStoreProducts();
};
