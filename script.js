import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBPOp8NtMBP09rNtCGe5-wRre6Y_Zt5g0M",
    authDomain: "venkat-textiles.firebaseapp.com",
    projectId: "venkat-textiles",
    storageBucket: "venkat-textiles.appspot.com",
    messagingSenderId: "636994469508",
    appId: "1:636994469508:web:3635e18d8ee64288be0cd1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = [];
let fetchedProducts = [];

// Store Products Load
window.loadStoreProducts = async function() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    container.innerHTML = `<p class="text-gray-500 text-center py-6 text-xs">ప్రొడక్ట్స్ లోడ్ అవుతున్నాయి...</p>`;

    try {
        const q = query(collection(db, "items"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        fetchedProducts = [];
        querySnapshot.forEach((docSnap) => {
            fetchedProducts.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (fetchedProducts.length === 0) {
            container.innerHTML = `<p class="text-gray-500 text-center py-6 text-xs">ప్రొడక్ట్స్ ఏవీ అందుబాటులో లేవు.</p>`;
            return;
        }

        const catalogs = {};
        fetchedProducts.forEach(p => {
            const cat = p.catalog || 'SILK SAREES';
            if (!catalogs[cat]) catalogs[cat] = [];
            catalogs[cat].push(p);
        });

        let mainHtml = '';
        for (const [catName, products] of Object.entries(catalogs)) {
            mainHtml += `
                <div class="mb-6">
                    <h2 class="text-sm font-black text-rose-700 mb-3 uppercase border-b pb-1.5 flex items-center gap-1.5">
                        📁 ${catName}
                    </h2>
                    <div class="grid grid-cols-2 gap-3">
            `;

            products.forEach(p => {
                const stockVal = Number(p.stock) || 0;
                const isOut = stockVal <= 0;

                let mediaHtml = `
                    <div class="relative mb-2">
                        <img src="${p.image}" onclick="openImageZoom('${p.image}', '${p.name}')" class="w-full h-36 object-cover rounded-lg cursor-pointer">
                        <span class="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">${p.discount || 30}% off</span>
                    </div>
                `;

                if (p.video && p.video.trim() !== "") {
                    mediaHtml += `
                        <video src="${p.video}" controls class="w-full h-32 object-cover rounded-lg shadow-sm mt-2"></video>
                    `;
                }

                mainHtml += `
                    <div class="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div>
                            ${mediaHtml}
                            <h3 class="font-bold text-xs text-gray-900 truncate">${p.name}</h3>
                            <p class="text-[10px] text-gray-500 truncate mb-1">${p.description || ''}</p>
                            <div class="flex items-center gap-1.5 mb-2">
                                <span class="text-xs font-black text-rose-600">₹${p.price}</span>
                                <span class="text-[9px] text-gray-400 line-through">₹${Math.round(p.price * 1.4)}</span>
                            </div>
                        </div>
                        <div>
                            <p class="text-[9px] font-bold ${isOut ? 'text-red-600' : 'text-emerald-600'} mb-1.5">
                                ${isOut ? '❌ Out of Stock' : `📦 Stock: ${stockVal} Left`}
                            </p>
                            <button onclick="addToCart('${p.id}')" ${isOut ? 'disabled' : ''} class="w-full ${isOut ? 'bg-gray-300 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 shadow'} text-white py-1.5 rounded-lg text-xs font-bold transition">
                                🛒 Add to Cart
                            </button>
                        </div>
                    </div>
                `;
            });
            mainHtml += `</div></div>`;
        }
        container.innerHTML = mainHtml;
    } catch (e) {
        console.error(e);
        container.innerHTML = `<p class="text-red-500 text-center text-xs">లోపం ఏర్పడింది.</p>`;
    }
};

// Cart Drawer Toggle
window.toggleCart = function() {
    const drawer = document.getElementById('cartDrawer');
    if (drawer) {
        drawer.classList.toggle('hidden');
        renderCartItems();
    }
};

// Add to Cart
window.addToCart = function(id) {
    const product = fetchedProducts.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartBadge();
    alert("ప్రొడక్ట్ కార్ట్‌లోకి జోడించబడింది!");
};

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) {
        const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
        badge.innerText = totalQty;
    }
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    const totalElem = document.getElementById('cart-total');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-center text-xs py-8">మీ కార్ట్ ఖాళీగా ఉంది.</p>`;
        if (totalElem) totalElem.innerText = '₹0';
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.qty;
        html += `
            <div class="flex items-center justify-between bg-gray-50 p-2 rounded-lg border">
                <div class="flex items-center gap-2">
                    <img src="${item.image}" class="w-10 h-10 object-cover rounded">
                    <div>
                        <h4 class="text-xs font-bold text-gray-900 truncate max-w-[120px]">${item.name}</h4>
                        <p class="text-[10px] text-rose-600 font-bold">₹${item.price} x ${item.qty}</p>
                    </div>
                </div>
                <button onclick="removeFromCart(${index})" class="text-red-500 font-bold text-xs px-2 py-1">✕</button>
            </div>
        `;
    });

    container.innerHTML = html;
    if (totalElem) totalElem.innerText = `₹${total}`;
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartBadge();
    renderCartItems();
};

window.proceedToCheckout = function() {
    if (cart.length === 0) {
        alert("మీ కార్ట్ ఖాళీగా ఉంది!");
        return;
    }
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('qrTotalAmount').innerText = total;
    document.getElementById('checkoutModal').classList.remove('hidden');
};

window.closeCheckoutModal = function() {
    document.getElementById('checkoutModal').classList.add('hidden');
};

// WhatsApp Order Submit
window.finishOrderWhatsApp = async function() {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const pincode = document.getElementById('custPincode').value.trim();
    const utrNumber = document.getElementById('utrNumber').value.trim();

    if (!name || !phone || !address || !pincode || !utrNumber) {
        alert("దయచేసి అన్ని వివరాలు మరియు UTR నంబర్‌ను పూరించండి!");
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const orderId = 'VT-' + Math.floor(100000 + Math.random() * 900000);

    const orderData = {
        orderId,
        name,
        phone,
        address,
        pincode,
        utrNumber,
        items: cart,
        total,
        timestamp: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "orders"), orderData);
        
        let msg = `*V T Textiles - కొత్త ఆర్డర్*%0A`;
        msg += `🆔 Order ID: ${orderId}%0A`;
        msg += `👤 పేరు: ${name}%0A`;
        msg += `📞 ఫోన్: ${phone}%0A`;
        msg += `🏠 అడ్రస్: ${address} - ${pincode}%0A`;
        msg += `💳 UTR ID: ${utrNumber}%0A%0A`;
        msg += `*ప్రొడక్ట్స్:*%0A`;
        
        cart.forEach(item => {
            msg += `- ${item.name} (Qty: ${item.qty}) - ₹${item.price * item.qty}%0A`;
        });
        
        msg += `%0A*మొత్తం (Total): ₹${total}*`;

        cart = [];
        updateCartBadge();
        closeCheckoutModal();
        toggleCart();

        window.open(`https://wa.me/918121911438?text=${msg}`, '_blank');
    } catch (e) {
        alert("ఆర్డర్ చేయడంలో లోపం: " + e.message);
    }
};

// Customer Orders Modal
window.openCustomerOrdersModal = async function() {
    document.getElementById('customerOrdersModal').classList.remove('hidden');
    const container = document.getElementById('customer-orders-list');
    container.innerHTML = `<p class="text-gray-500 text-center text-xs py-4">ఆర్డర్లు లోడ్ అవుతున్నాయి...</p>`;

    try {
        const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = `<p class="text-gray-400 text-center text-xs py-6">మీ ఆర్డర్లు ఏవీ కనుగొనబడలేదు.</p>`;
            return;
        }

        let html = '';
        querySnapshot.forEach((docSnap) => {
            const ord = docSnap.data();
            html += `
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs space-y-1 shadow-sm">
                    <div class="flex justify-between font-bold text-gray-900 border-b pb-1">
                        <span>🆔 ${ord.orderId}</span>
                        <span class="text-rose-600">₹${ord.total}</span>
                    </div>
                    <p class="text-[10px] text-gray-700"><b>పేరు:</b> ${ord.name} | <b>ఫోన్:</b> ${ord.phone}</p>
                    <p class="text-[10px] text-gray-700"><b>అడ్రస్:</b> ${ord.address} - ${ord.pincode}</p>
                    <p class="text-[10px] text-gray-700"><b>UTR ID:</b> ${ord.utrNumber}</p>
                    <p class="text-[10px] text-emerald-600 font-bold">✅ ఆర్డర్ విజయవంతంగా స్వీకరించబడింది</p>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<p class="text-red-500 text-center text-xs">లోపం: ${e.message}</p>`;
    }
};

window.closeCustomerOrdersModal = function() {
    document.getElementById('customerOrdersModal').classList.add('hidden');
};

// Image Zoom Modal
window.openImageZoom = function(imgSrc, title) {
    const modal = document.getElementById('imageZoomModal');
    const img = document.getElementById('zoomedImg');
    const zoomedTitle = document.getElementById('zoomedTitle');
    if (!modal || !img) return;
    img.src = imgSrc;
    if (zoomedTitle) zoomedTitle.innerText = title;
    modal.classList.remove('hidden');
};

window.closeImageZoom = function() {
    const modal = document.getElementById('imageZoomModal');
    if (modal) modal.classList.add('hidden');
};

window.onload = function() {
    loadStoreProducts();
};
                                
