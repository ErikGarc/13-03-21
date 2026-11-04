
import { auth } from "./firebase-config.js";

import { signInWithEmailAndPassword } from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const formulario = document.getElementById("formLogin");
const mensaje = document.getElementById("mensajeLogin");

formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const correo =
        document.getElementById("correo").value.trim();

    const contrasena =
        document.getElementById("contrasena").value;

    mensaje.textContent = "Verificando acceso... 💌";

    try {

        await signInWithEmailAndPassword(
            auth,
            correo,
            contrasena
        );
        console.log("LOGIN EXITOSO EN FIREBASE");
        console.log("Usuario autenticado:", auth.currentUser?.uid);

        mensaje.textContent = "¡Bienvenida! 💗";

        window.location.replace("buzon.html");

    } catch (error) {

        console.error("Error Firebase:", error.code);

        mensaje.textContent =
            "No pudimos iniciar sesión. Revisa tus datos.";

    }

});
