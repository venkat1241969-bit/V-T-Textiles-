// Firebase SDK Imports
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

// Cart array
let cart = [];
let fetchedProducts = [];

// Load Products on Store Page
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

        // Group products by catalog/category
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

                // డబుల్ ఇమేజ్ రాకుండా కేవలం ఒక్క ఇమేజ్ మరియు ఉంటే వీడియో వచ్చేలా సెట్ చేసిన కోడ్
                let mediaHtml = `
                    <div class="relative mb-2">
                        <img src="${p.image}" onclick="openImageZoom('${p.image}', '${p.name}')" class="w-full h-36 object-cover rounded-lg cursor-pointer hover:opacity-95 transition">
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
        console.error("Error loading products: ", e);
        container.innerHTML = `<p class="text-red-500 text-center text-xs">ప్రొడక్ట్స్ లోడ్ చేయడంలో లోపం ఏర్పడింది.</p>`;
    }
};

// Image Zoom Modal Functions
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

// Add to Cart Logic
window.addToCart = function(id) {
    const product = fetchedProducts.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    alert("ప్రొడక్ట్ కార్ట్‌లోకి జోడించబడింది!");
    // updateCartCount(); // ఒకవేళ కార్ట్ కౌంట్ ఫంక్షన్ ఉంటే ఇక్కడ రన్ అవుతుంది
};

// Page Load Event
window.onload = function() {
    loadStoreProducts();
};
