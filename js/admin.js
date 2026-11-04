
import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";



// ==========================================
// ADMINISTRADOR - 13-03-21
// ==========================================

// Coloca aquí tu UID de administrador
const UID_ADMIN = "mcAB5fSljFaIdT6N7miwIUhLKj82";

const db = getFirestore();

const panel = document.querySelector(".panel-admin");
const enlaceVolver = document.querySelector(".volver-buzon");

const formulario = document.getElementById("formCarta");
const titulo = document.getElementById("tituloCarta");
const contenido = document.getElementById("contenidoCarta");
const fecha = document.getElementById("fechaCarta");
const musica = document.getElementById("musicaCarta");

const botonBorrador = document.getElementById("guardarBorrador");
const botonPublicar = document.getElementById("publicarCarta");
const botonCancelar = document.getElementById("cancelarEdicion");
const mensaje = document.getElementById("mensajeAdmin");
const listaAdmin = document.getElementById("listaAdminCartas");
const estadoListado = document.getElementById("estadoListado");
// Ocultar hasta comprobar el acceso
panel.hidden = true;
enlaceVolver.hidden = true;

let administradorAutorizado = false;
let cartaEnEdicion = null;

// ==========================================
// VERIFICAR SESIÓN
// ==========================================

onAuthStateChanged(auth, (usuario) => {

    administradorAutorizado = false;

    if (!usuario) {
        window.location.replace("login.html");
        return;
    }

    if (usuario.uid !== UID_ADMIN) {
        window.location.replace("buzon.html");
        return;
    }

    administradorAutorizado = true;

    panel.hidden = false;
    enlaceVolver.hidden = false;

    mensaje.textContent =
        "Ya puedes escribir tus cartitas. 💌";
        cargarCartasAdmin();
});

// ==========================================
// GUARDAR CARTA
// ==========================================

async function guardarCarta(publicar) {

    if (!administradorAutorizado ||
        auth.currentUser?.uid !== UID_ADMIN) {

        mensaje.textContent =
            "No tienes permiso para guardar cartas.";

        return;
    }

    const tituloTexto = titulo.value.trim();
    const contenidoTexto = contenido.value.trim();
    const fechaTexto = fecha.value;
    const musicaTexto = musica.value.trim();

    if (!tituloTexto || !contenidoTexto) {
        mensaje.textContent =
            "Escribe el título y el contenido de tu carta. 💗";
        return;
    }

    if (!fechaTexto) {
        mensaje.textContent =
            "Selecciona una fecha de publicación. 📅";
        return;
    }

    // Convertir fecha local a Timestamp de Firebase
    const fechaSeleccionada = new Date(fechaTexto);

    if (Number.isNaN(fechaSeleccionada.getTime())) {
        mensaje.textContent =
            "La fecha seleccionada no es válida.";
        return;
    }

    if (publicar && fechaSeleccionada <= new Date()) {
        // Se permiten fechas actuales o pasadas
        // para publicar inmediatamente.
        console.log("La carta podrá verse inmediatamente.");
    }

    botonBorrador.disabled = true;
    botonPublicar.disabled = true;

    mensaje.textContent = cartaEnEdicion !== null
    ? "¡Los cambios de tu carta se guardaron correctamente! 💗"
    : publicar
        ? "¡Carta guardada y programada con amor! 💌"
        : "¡Borrador guardado correctamente! 💗";

   
try {

    const datosCarta = {
    titulo: tituloTexto,
    contenido: contenidoTexto,
    musica: musicaTexto,
    publicada: publicar,
    fechaPublicacion:
    Timestamp.fromDate(fechaSeleccionada)
    };

    if (cartaEnEdicion !== null) {

        // ACTUALIZAR CARTA EXISTENTE
        const referenciaCarta =
            doc(db, "cartas", cartaEnEdicion);

        await updateDoc(referenciaCarta, {
            ...datosCarta,
            fechaModificacion: serverTimestamp()
        });

        console.log(
            "Carta actualizada:", cartaEnEdicion
        );

    } else {

        // CREAR CARTA NUEVA
        await addDoc(collection(db, "cartas"), {
            ...datosCarta,
            fechaCreacion: serverTimestamp()
        });

        console.log("Nueva carta creada");
    }


        mensaje.textContent = publicar
            ? "¡Carta guardada y programada con amor! 💌"
            : "¡Borrador guardado correctamente! 💗";

       formulario.reset();

            // Volver al modo de creación
         cartaEnEdicion = null;
        botonCancelar.hidden = true;
            // Actualizar listado
        await cargarCartasAdmin();

        console.log("Carta guardada correctamente.");

    } catch (error) {

        console.error("Error al guardar carta:", error);

        if (error.code === "permission-denied") {
            mensaje.textContent =
                "Firebase rechazó el guardado. Revisa los permisos.";
        } else {
            mensaje.textContent =
                "No se pudo guardar la carta. Inténtalo nuevamente.";
        }

    } finally {

        botonBorrador.disabled = false;
        botonPublicar.disabled = false;
    }
}
function editarCarta(carta) {

    // Guardar el ID de la carta seleccionada
    cartaEnEdicion = carta.id;
    botonCancelar.hidden = false;

    // Recuperar título y contenido
    titulo.value = carta.titulo || "";
    contenido.value = carta.contenido || "";
    musica.value = carta.musica || "";

    // Recuperar fecha para datetime-local
    if (carta.fechaPublicacion?.toDate) {

        const fechaOriginal =
            carta.fechaPublicacion.toDate();

        // Convertir a fecha y hora local
        const anio = fechaOriginal.getFullYear();

        const mes = String(
            fechaOriginal.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
            fechaOriginal.getDate()
        ).padStart(2, "0");

        const hora = String(
            fechaOriginal.getHours()
        ).padStart(2, "0");

        const minutos = String(
            fechaOriginal.getMinutes()
        ).padStart(2, "0");

        fecha.value =
            `${anio}-${mes}-${dia}T${hora}:${minutos}`;

    } else {
        fecha.value = "";
    }

    // Mostrar mensaje informativo
    mensaje.textContent =
        "✏️ Estás editando: " + carta.titulo;

    // Subir al formulario
    formulario.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    console.log("Carta seleccionada:", cartaEnEdicion);
}
async function cargarCartasAdmin() {

    estadoListado.textContent = "Cargando tus cartas...";
    listaAdmin.replaceChildren();

    try {
        const resultado = await getDocs(
            collection(db, "cartas")
        );

        if (resultado.empty) {
            estadoListado.textContent =
                "Todavía no has creado cartas.";
            return;
        }

        const cartas = resultado.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Ordenar de la más reciente a la más antigua
        cartas.sort((a, b) => {
            const fechaA = a.fechaCreacion?.toMillis?.() || 0;
            const fechaB = b.fechaCreacion?.toMillis?.() || 0;
            return fechaB - fechaA;
        });

        cartas.forEach(carta => {

            const tarjeta = document.createElement("article");
            tarjeta.className = "carta-admin";

            const titulo = document.createElement("h3");
            titulo.textContent = carta.titulo || "Sin título";

            const fecha = document.createElement("p");

            const fechaPublicacion =
                carta.fechaPublicacion?.toDate?.();

            fecha.textContent = fechaPublicacion
                ? "📅 " + fechaPublicacion.toLocaleString("es-MX")
                : "Sin fecha de publicación";

            const estado = document.createElement("span");
            estado.classList.add("estado-carta");

            if (!carta.publicada) {
                estado.textContent = "Borrador";
                estado.classList.add("estado-borrador");

            } else if (
                fechaPublicacion &&
                fechaPublicacion > new Date()
            ) {
                estado.textContent = "Programada";
                estado.classList.add("estado-programada");

            } else {
                estado.textContent = "Publicada";
                estado.classList.add("estado-publicada");
            }

            const botonEditar = document.createElement("button");

botonEditar.type = "button";
botonEditar.className = "boton-editar";
botonEditar.textContent = "✏️ Editar carta";


botonEditar.addEventListener("click", () => {
    editarCarta(carta);
});

// ==========================================
// BOTÓN ELIMINAR CARTA
// ==========================================

const botonEliminar = document.createElement("button");

botonEliminar.type = "button";
botonEliminar.className = "boton-eliminar";
botonEliminar.textContent = "🗑️ Eliminar carta";

botonEliminar.addEventListener("click", () => {
    eliminarCarta(carta);
});

tarjeta.append(
    titulo,
    fecha,
    estado,
    botonEditar,
    botonEliminar
);

listaAdmin.appendChild(tarjeta);

        });

        estadoListado.textContent =
            `Tienes ${cartas.length} carta(s) guardada(s).`;

    } catch (error) {

        console.error("Error al cargar cartas:", error);

        estadoListado.textContent =
            "No se pudieron cargar tus cartas.";
    }
}

function cancelarEdicion() {

    // Salir del modo edición
    cartaEnEdicion = null;

    // Limpiar el formulario
    formulario.reset();

    // Ocultar el botón de cancelar
    botonCancelar.hidden = true;

    // Mostrar mensaje
    mensaje.textContent =
        "💗 Edición cancelada. Puedes escribir una nueva carta.";

    // Regresar al formulario
    formulario.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function eliminarCarta(carta) {

    // Comprobar que seguimos siendo administrador
    if (
        !administradorAutorizado ||
        auth.currentUser?.uid !== UID_ADMIN
    ) {
        alert("No tienes permiso para eliminar cartas.");
        return;
    }

    // Confirmación antes de eliminar
    const confirmar = confirm(
        "💌 ¿Estás seguro de que quieres eliminar esta carta?\n\n" +
        carta.titulo +
        "\n\n⚠️ Esta acción no se puede deshacer."
    );

    if (!confirmar) {
        return;
    }

    try {

        // Referencia a la carta seleccionada
        const referenciaCarta = doc(
            db,
            "cartas",
            carta.id
        );

        // Eliminar documento de Firebase
        await deleteDoc(referenciaCarta);

        // Si estábamos editando esta misma carta,
        // salir del modo edición
        if (cartaEnEdicion === carta.id) {
            cancelarEdicion();
        }

        mensaje.textContent =
            "🗑️ Carta eliminada correctamente.";

        // Actualizar el listado
        await cargarCartasAdmin();

        console.log(
            "Carta eliminada:", carta.id
        );

    } catch (error) {

        console.error(
            "Error al eliminar carta:", error
        );

        mensaje.textContent =
            "No se pudo eliminar la carta.";

        alert(
            "Ocurrió un error al eliminar la carta. " +
            "Revisa la consola."
        );
    }
}

// ==========================================
// BOTONES
// ==========================================

botonBorrador.addEventListener("click", () => {
    guardarCarta(false);
});

botonPublicar.addEventListener("click", () => {
    guardarCarta(true);
});
botonCancelar.addEventListener("click", () => {
    cancelarEdicion();
});