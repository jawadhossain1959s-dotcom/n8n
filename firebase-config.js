const firebaseConfig = {
  apiKey: "AIzaSyAYyOSjbsko0kA3Szp9MSm0lE_CES10P4E",
  authDomain: "fabbly-30dd8.firebaseapp.com",
  projectId: "fabbly-30dd8",
  storageBucket: "fabbly-30dd8.firebasestorage.app",
  messagingSenderId: "754244594171",
  appId: "1:754244594171:web:ca7349656f40412e37835e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

window.fetchProducts = async function() {
    try {
        const snapshot = await db.collection('products').get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    } catch (e) {
        console.error("Error fetching products: ", e);
        return [];
    }
};
