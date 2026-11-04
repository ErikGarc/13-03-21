
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// Configuración de nuestro proyecto 13-03-21

const firebaseConfig = {
    apiKey: "AIzaSyCqcJQ3Hdpri_8G3zUUVi429a40mgzaIrg",
    authDomain: "project-7627901744214255942.firebaseapp.com",
    projectId: "project-7627901744214255942",
    storageBucket: "project-7627901744214255942.firebasestorage.app",
    messagingSenderId: "612437329889",
    appId: "1:612437329889:web:ed206b741ab4369b97f4a0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Preparar Firebase Authentication
const auth = getAuth(app);

// Exportar para usar en otros archivos
export { app, auth };

console.log("🔥 Firebase inicializado correctamente");
