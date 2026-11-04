

import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// ==================================
// BUZÓN DE AMOR - 13-03-21
// ==================================

const db = getFirestore();

const estado = document.getElementById("estadoBuzon");
const seccion = document.getElementById("seccionCartas");
const lista = document.getElementById("listaCartas");
const botonSalir = document.getElementById("cerrarSesion");
const botonAdmin = document.getElementById("administrarCartas");

// ==========================================
// VENTANA GRANDE PARA LEER CARTAS
// ==========================================

const modalCarta = document.getElementById("modalCarta");
const papelCarta = modalCarta.querySelector(".papel-carta");

const tituloModal = document.getElementById("tituloModalCarta");
const contenidoModal = document.getElementById("contenidoModalCarta");
const botonCerrarModal = document.getElementById("cerrarModalCarta");

const encabezadoPapel = modalCarta.querySelector(".encabezado-papel");

let botonAnterior = null;
let cerrandoCarta = false;


let CLAVE_CARTAS_LEIDAS = "";

function configurarLecturasUsuario(uid) {
    CLAVE_CARTAS_LEIDAS = `13-03-21-cartas-leidas-${uid}`;
}

function obtenerCartasLeidas() {
    try {
        return JSON.parse(
            localStorage.getItem(CLAVE_CARTAS_LEIDAS) || "[]"
        );
    } catch (error) {
        return [];
    }
}

function marcarCartaLeida(idCarta) {
    const leidas = obtenerCartasLeidas();

    if (!leidas.includes(idCarta)) {
        leidas.push(idCarta);

        localStorage.setItem(
            CLAVE_CARTAS_LEIDAS,
            JSON.stringify(leidas)
        );
    }
}


// ==========================================
// FORMATEAR FECHA DE PUBLICACIÓN
// ==========================================

function formatearFechaCarta(fechaFirebase) {

    if (!fechaFirebase) {
        return "Una fecha especial";
    }

    const fecha = typeof fechaFirebase.toDate === "function"
        ? fechaFirebase.toDate()
        : new Date(fechaFirebase);

    if (Number.isNaN(fecha.getTime())) {
        return "Una fecha especial";
    }

    return new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(fecha);
}

// ==========================================
// ABRIR CARTA GRANDE
// ==========================================

function abrirModalCarta(carta, boton) {

    tituloModal.textContent =
        carta.titulo || "Una carta para ti";

    // Fecha de publicación de esta carta
    const fechaCarta = formatearFechaCarta(
        carta.fechaPublicacion
    );

    encabezadoPapel.textContent = fechaCarta + " ♡";

    contenidoModal.textContent =
        carta.contenido || "";

    botonAnterior = boton;

    // Localizar el papel que sale del sobre
    const papelPequeno =
        boton.querySelector(".papel-animado");

    const origen = papelPequeno?.getBoundingClientRect();

    // Mostrar la ventana grande
    modalCarta.hidden = false;
    document.body.style.overflow = "hidden";

    // Calcular posición final
    const destino = papelCarta.getBoundingClientRect();

    const reducirMovimiento = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (
        !reducirMovimiento &&
        origen &&
        destino.width > 0 &&
        destino.height > 0
    ) {

        const escalaX = origen.width / destino.width;
        const escalaY = origen.height / destino.height;

        const moverX =
            origen.left + origen.width / 2 -
            (destino.left + destino.width / 2);

        const moverY =
            origen.top + origen.height / 2 -
            (destino.top + destino.height / 2);

        // El papel pequeño se convierte
        // visualmente en la carta grande
        papelCarta.animate(
            [
                {
                    transform:
                        `translate(${moverX}px, ${moverY}px) ` +
                        `scale(${escalaX}, ${escalaY})`,
                    opacity: 0.7
                },
                {
                    transform: "translate(0, 0) scale(1)",
                    opacity: 1
                }
            ],
            {
                duration: 850,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)"
            }
        );
    }

    papelCarta.focus();
}

// ==========================================
// CERRAR CARTA GRANDE
// ==========================================

async function cerrarModalCarta() {

    if (modalCarta.hidden || cerrandoCarta) {
        return;
    }

    cerrandoCarta = true;

    const reducirMovimiento = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!reducirMovimiento) {

        papelCarta.classList.add("cerrando");

        await new Promise(resolve => {
            setTimeout(resolve, 350);
        });
    }

    modalCarta.hidden = true;

    document.body.style.overflow = "";

    papelCarta.classList.remove("cerrando");

    botonAnterior?.focus();
    botonAnterior = null;

    cerrandoCarta = false;
}

// Botón cerrar
botonCerrarModal.addEventListener(
    "click",
    cerrarModalCarta
);

// Cerrar con ESC
document.addEventListener("keydown", (evento) => {

    if (
        evento.key === "Escape" &&
        !modalCarta.hidden
    ) {
        cerrarModalCarta();
    }
});

// Cerrar al hacer clic fuera
modalCarta.querySelector(".fondo-modal")
    .addEventListener("click", cerrarModalCarta);

// ==========================================
// CORAZONES FLOTANTES
// ==========================================

function lanzarCorazones(sobre) {

    const reducirMovimiento = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducirMovimiento) {
        return;
    }

    const simbolos = ["♥", "♡", "💕", "♥", "♡"];

    for (let i = 0; i < simbolos.length; i++) {

        const corazon = document.createElement("span");

        corazon.className = "corazon-flotante";
        corazon.textContent = simbolos[i];

        const movimientoX = (i - 2) * 35;

        corazon.style.setProperty(
            "--movimiento-x",
            `${movimientoX}px`
        );

        corazon.style.animationDelay = `${i * 0.1}s`;

        sobre.appendChild(corazon);

        corazon.addEventListener(
            "animationend",
            () => corazon.remove(),
            { once: true }
        );
    }
}

// ==========================================
// IDENTIFICAR ADMINISTRADOR
// ==========================================

const UID_ADMIN = "mcAB5fSljFaIdT6N7miwIUhLKj82";

// ==========================================
// CONSULTAR CARTAS PUBLICADAS
// ==========================================

onAuthStateChanged(auth, async (usuario) => {

    if (!usuario) {
        window.location.replace("login.html");
        return;
    }
    // Historial de lectura independiente
    configurarLecturasUsuario(usuario.uid);
    botonAdmin.hidden = usuario.uid !== UID_ADMIN;

    estado.textContent = "Buscando tus cartitas... 💌";

    try {



        const consulta = query(
            collection(db, "cartas"),
            where("publicada", "==", true),
            where(
                "fechaPublicacion",
                "<=",
                Timestamp.now()
            )
        );

        const resultado = await getDocs(consulta);
        const cartasOrdenadas = resultado.docs.sort((a, b) => {

    const fechaA = a.data().fechaPublicacion.toMillis();
    const fechaB = b.data().fechaPublicacion.toMillis();

    return fechaB - fechaA;
});
        const totalCartas = cartasOrdenadas.length;

const mensajeContador = totalCartas === 1
    ? "Tienes 1 cartita de amor 💌"
    : `Tienes ${totalCartas} cartitas de amor 💌`;



        lista.replaceChildren();

        if (resultado.empty) {

            estado.textContent =
                "Todavía no hay cartitas disponibles. ♡";

        } else {

            cartasOrdenadas.forEach((documento) => {

                const carta = documento.data();
                
                const idCarta = documento.id;
                const yaLeida = obtenerCartasLeidas().includes(idCarta);

                const etiquetaLectura = document.createElement("span");
                etiquetaLectura.className = "etiqueta-lectura";

                function actualizarEtiquetaLectura(leida) {
                etiquetaLectura.textContent = leida
                 ? "✓ Ya leída"
                : "♡ Nueva";

    etiquetaLectura.classList.toggle("leida", leida);
}

actualizarEtiquetaLectura(yaLeida);

                // ==================================
                // TARJETA DE CARTA
                // ==================================

                const tarjeta = document.createElement("article");
                tarjeta.className = "tarjeta-carta";

                const titulo = document.createElement("h4");
                titulo.textContent =
                    carta.titulo || "Una carta para ti";

                
                    const fechaVisible = document.createElement("p");
                    fechaVisible.className = "fecha-visible-carta";
                    fechaVisible.textContent = "♡ " + formatearFechaCarta(
                    carta.fechaPublicacion
                        );

                
                // ==================================
                // BOTÓN Y SOBRE ROMÁNTICO
                // ==================================

                const botonAbrir = document.createElement("button");
                botonAbrir.type = "button";
                botonAbrir.className = "boton-abrir-carta";

                const sobre = document.createElement("span");
                sobre.className = "sobre-romantico";
                sobre.setAttribute("aria-hidden", "true");

                const solapa = document.createElement("span");
                solapa.className = "solapa-sobre";

                const cuerpo = document.createElement("span");
                cuerpo.className = "cuerpo-sobre";

                const corazon = document.createElement("span");
                corazon.className = "corazon-sobre";
                corazon.textContent = "♥";

                // ==================================
                // PAPEL PEQUEÑO CON FECHA
                // ==================================

                const papelAnimado = document.createElement("span");
                papelAnimado.className = "papel-animado";
                papelAnimado.setAttribute("aria-hidden", "true");

                // Fecha individual de publicación
                papelAnimado.dataset.fecha = formatearFechaCarta(
                    carta.fechaPublicacion
                );

                const textoBoton = document.createElement("span");
                textoBoton.className = "texto-sobre";
                textoBoton.textContent = "Abrir carta";

                cuerpo.appendChild(corazon);
                sobre.append(solapa, papelAnimado, cuerpo);
                botonAbrir.append(sobre, textoBoton);

                botonAbrir.setAttribute("aria-expanded", "false");

                // Contenido original de la carta
                const contenido = document.createElement("p");
                contenido.className = "contenido-carta";
                contenido.textContent = carta.contenido || "";
                contenido.hidden = true;

                // ==================================
                // EVENTO: ABRIR CARTA
                // ==================================

                botonAbrir.addEventListener("click", async () => {

                    if (botonAbrir.disabled) {
                        return;
                    }

                    botonAbrir.disabled = true;

                    // Abrir el sobre
                    sobre.classList.add("animando");

                    // Lanzar corazones
                    lanzarCorazones(sobre);

                    const reducirMovimiento = window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                    ).matches;

                    // Esperar a que salga el papel
                    await new Promise(resolve => {
                        setTimeout(
                            resolve,
                            reducirMovimiento ? 0 : 1800
                        );
                    });

                    // Mostrar la carta grande
                    abrirModalCarta(carta, botonAbrir);
                    marcarCartaLeida(idCarta);
                    actualizarEtiquetaLectura(true);
                    // Restaurar el sobre
                    sobre.classList.remove("animando");

                    botonAbrir.disabled = false;
                });

                tarjeta.append(
                titulo,
                fechaVisible,
                etiquetaLectura,
                botonAbrir,
                contenido
                );

                lista.appendChild(tarjeta);
            });

            estado.textContent = mensajeContador;
        }

        seccion.hidden = false;
        botonSalir.hidden = false;

    } catch (error) {

        console.error("Error al consultar cartas:", error);

        if (error.code === "permission-denied") {

            estado.textContent =
                "No tienes permiso para consultar estas cartas.";

        } else if (error.code === "failed-precondition") {

            estado.textContent =
                "Firestore necesita un índice para esta consulta. Revisa la consola.";

        } else {

            estado.textContent =
                "No pudimos cargar las cartitas. Inténtalo de nuevo.";
        }

        botonSalir.hidden = false;
    }
});

// ==========================================
// CERRAR SESIÓN
// ==========================================

botonSalir.addEventListener("click", async () => {

    try {

        await signOut(auth);

        window.location.replace("login.html");

    } catch (error) {

        console.error("Error al cerrar sesión:", error);
    }
});

// ==========================================
// IR AL PANEL ADMINISTRADOR
// ==========================================

botonAdmin.addEventListener("click", () => {
    window.location.href = "admin.html";
});
