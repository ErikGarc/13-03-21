
import { auth } from "./firebase-config.js";


import { crearClienteSupabase } from "./supabase-config.js";

const supabase = crearClienteSupabase(auth);


window.probarSupabase = async function () {
    
const token = await auth.currentUser.getIdToken(true);
const datosToken = JSON.parse(atob(token.split(".")[1]));

console.log("ROL FIREBASE:", datosToken.role);

    const { data, error } = await supabase.storage
        .from("fotos-cartas")
        .list("", { limit: 1 });

    if (error) {
        console.error("ERROR SUPABASE:", error.message);
        return;
    }

    console.log("SUPABASE CONECTADO CORRECTAMENTE");
};


window.probarSubidaSupabase = async function () {
    // Imagen PNG de prueba de 1 píxel
    const pngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=";

    const bytes = Uint8Array.from(
        atob(pngBase64),
        caracter => caracter.charCodeAt(0)
    );

    const archivo = new Blob(
        [bytes],
        { type: "image/png" }
    );

    const nombreArchivo = `pruebas/prueba-${crypto.randomUUID()}.png`;

    const { error } = await supabase.storage
        .from("fotos-cartas")
        .upload(nombreArchivo, archivo, {
            contentType: "image/png",
            upsert: false
        });

    if (error) {
        console.error("ERROR DE SUBIDA:", error.message);
        return;
    }

    console.log("PERMISO DE SUBIDA CONFIRMADO");
};







import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
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


async function limpiarFotosFallidas(rutasFotos) {
    if (rutasFotos.length === 0) {
        return;
    }

    const { error } = await supabase.storage
        .from("fotos-cartas")
        .remove(rutasFotos);

    if (error) {
        console.error(
            "No se pudieron limpiar las fotografías:",
            error.message
        );

        return;
    }

    console.log(
        "Fotografías de subida fallida eliminadas."
    );
}


async function subirFotosSupabase(archivos, rutasFotos = []) {


    for (const archivo of archivos) {
        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!tiposPermitidos.includes(archivo.type)) {
            throw new Error(
                "Solo se permiten imágenes JPG, PNG o WebP."
            );
        }

        if (archivo.size > 5 * 1024 * 1024) {
            throw new Error(
                "Cada fotografía debe pesar máximo 5 MB."
            );
        }

        const extension = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
        }[archivo.type];

        const ruta = `cartas/${crypto.randomUUID()}.${extension}`;

        const { error } = await supabase.storage
            .from("fotos-cartas")
            .upload(ruta, archivo, {
                contentType: archivo.type,
                upsert: false
            });

        if (error) {
            throw new Error(
                "No se pudo subir una fotografía: " +
                error.message
            );
        }

        rutasFotos.push(ruta);
    }

    return rutasFotos;
}


const panel = document.querySelector(".panel-admin");
const enlaceVolver = document.querySelector(".volver-buzon");

const formulario = document.getElementById("formCarta");
const titulo = document.getElementById("tituloCarta");
const contenido = document.getElementById("contenidoCarta");
const fecha = document.getElementById("fechaCarta");
const musica = document.getElementById("musicaCarta");
const tituloCancion = document.getElementById("tituloCancion");
const artistaCancion = document.getElementById("artistaCancion");

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
    const tituloCancionTexto = tituloCancion.value.trim();
    const artistaCancionTexto = artistaCancion.value.trim();
    const plantillaTexto =
    document.getElementById("plantillaCarta").value;

    
    const fotosSeleccionadas = [
    document.getElementById("fotoCarta1")?.files[0],
    document.getElementById("fotoCarta2")?.files[0],
    document.getElementById("fotoCarta3")?.files[0]
    ].filter(Boolean);



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

    
    mensaje.textContent =
    "Preparando tu carta para guardarla... 💌";


   
let rutasFotos = [];

let cartaGuardadaEnFirestore = false;


try {
    
    mensaje.textContent =
        "Guardando tu carta y sus fotografías... 📸💗";

      const fotosGuardadas = cartaEnEdicion !== null
    ? (await getDoc(
        doc(db, "cartas", cartaEnEdicion)
      )).data()?.fotos || []
    : [];

    const cantidadFotosGuardadas = fotosGuardadas.length;


    if (
    cantidadFotosGuardadas +
    fotosSeleccionadas.length > 3
    ) {
    throw new Error(
        "Esta carta puede tener máximo 3 fotografías."
    );
    }

    
    
    rutasFotos = await subirFotosSupabase(
    fotosSeleccionadas,
    rutasFotos
    );



    const fotosFinales = [
    ...fotosGuardadas,
    ...rutasFotos
    ];
    
    if (fotosFinales.length > 3) {
    throw new Error(
        "Cada carta puede tener máximo 3 fotografías."
    );
    }


    
    const datosCarta = {
    titulo: tituloTexto,
    contenido: contenidoTexto,
    musica: musicaTexto,
    tituloCancion: tituloCancionTexto,
    artistaCancion: artistaCancionTexto,

    // Diseño seleccionado para esta carta
    plantilla: plantillaTexto,
    fotos: fotosFinales,

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

    
    cartaGuardadaEnFirestore = true;

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
        
        
    
    if (!cartaGuardadaEnFirestore && rutasFotos.length > 0) {
    try {
        await limpiarFotosFallidas(rutasFotos);
    } catch (errorLimpieza) {
        console.error(
            "Error durante la limpieza de fotografías:",
            errorLimpieza
        );
    }
    }




        if (error.code === "permission-denied") {
            mensaje.textContent =
                "Firebase rechazó el guardado. Revisa los permisos.";
        
        } else {
        mensaje.textContent =
        error.message ||
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
    tituloCancion.value = carta.tituloCancion || "";
    artistaCancion.value = carta.artistaCancion || "";
    
    // ==========================================
    // RECUPERAR LA PLANTILLA DE LA CARTA
    // ==========================================

    // Si es una carta antigua, usar la clásica
    const plantillaGuardada = carta.plantilla || "clasica";

    // Seleccionar el diseño guardado
    selectorPlantilla.value = plantillaGuardada;

    // Actualizar el diseño de la vista previa
    actualizarPlantillaVistaPrevia();

    // Ocultar la vista previa anterior
    contenedorVistaPrevia.hidden = true;



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

/* ==========================================
   ETAPA 15 - VISTA PREVIA DE CARTAS
========================================== */

const botonVistaPrevia =
    document.getElementById("botonVistaPrevia");
    
// ==========================================
// SELECTOR DE PLANTILLAS ROMÁNTICAS
// ==========================================

const selectorPlantilla =
    document.getElementById("plantillaCarta");

const papelVistaPrevia =
    document.getElementById("papelVistaPrevia");

const decoracionPapel =
    papelVistaPrevia.querySelector(".decoracion-papel");

const decoracionesPlantilla = {
    clasica: "♡ ✿ ♡",
    corazones: "♥ ♡ ♥",
    recuerdos: "📸 ♡ 📸",
    estrellas: "☾ ✦ ☆",
    vintage: "❀ ✉ ❀",
    minimalista: "♡"
};

function actualizarPlantillaVistaPrevia() {

    const plantillaSeleccionada =
        selectorPlantilla.value;

    // Quitar el diseño anterior
    papelVistaPrevia.classList.remove(
        "plantilla-clasica",
        "plantilla-corazones",
        "plantilla-recuerdos",
        "plantilla-estrellas",
        "plantilla-vintage",
        "plantilla-minimalista"
    );

    // Aplicar el nuevo diseño
    papelVistaPrevia.classList.add(
        "plantilla-" + plantillaSeleccionada
    );

    // Cambiar la decoración superior
    decoracionPapel.textContent =
        decoracionesPlantilla[plantillaSeleccionada]
        || "♡ ✿ ♡";

        
// ==========================================
// MOSTRAR GALERÍA SOLO EN RECUERDOS
// ==========================================

const galeriaPolaroid =
    document.getElementById("galeriaPolaroid");

if (plantillaSeleccionada === "recuerdos") {

    // Mostrar nuestras tres fotografías
    galeriaPolaroid.hidden = false;

} else {

    // Ocultarlas en las demás plantillas
    galeriaPolaroid.hidden = true;

}

}

// Actualizar al cambiar de plantilla
selectorPlantilla.addEventListener(
    "change",
    actualizarPlantillaVistaPrevia
);

// Aplicar el diseño seleccionado al iniciar
actualizarPlantillaVistaPrevia();


const contenedorVistaPrevia =
    document.getElementById("contenedorVistaPrevia");

const tituloVistaPrevia =
    document.getElementById("tituloVistaPrevia");

const contenidoVistaPrevia =
    document.getElementById("contenidoVistaPrevia");

botonVistaPrevia.addEventListener("click", () => {

    // Obtener los datos escritos en el formulario
    const tituloEscrito = titulo.value.trim();
    const contenidoEscrito = contenido.value.trim();

    // Comprobar que la carta tenga contenido
    if (!tituloEscrito || !contenidoEscrito) {
        mensaje.textContent =
            "💗 Escribe un título y el contenido de tu carta para verla.";

        return;
    }

    // Colocar el texto dentro de la plantilla
    tituloVistaPrevia.textContent = tituloEscrito;
    contenidoVistaPrevia.textContent = contenidoEscrito;

    // Mostrar la carta
    contenedorVistaPrevia.hidden = false;

    // Desplazarnos suavemente a la vista previa
    contenedorVistaPrevia.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

});


/* ==========================================
   ETAPA 15 - VISTA PREVIA DE FOTOGRAFÍAS
========================================== */

const camposFotos = [
    document.getElementById("fotoCarta1"),
    document.getElementById("fotoCarta2"),
    document.getElementById("fotoCarta3")
];

const espaciosPolaroid =
    document.querySelectorAll(
        "#galeriaPolaroid .imagen-polaroid"
    );

// Guardar temporalmente las URLs de vista previa
const urlsFotosTemporales = [null, null, null];

camposFotos.forEach((campo, indice) => {

    campo.addEventListener("change", () => {

        const archivo = campo.files[0];
        const espacio = espaciosPolaroid[indice];

        // Liberar la vista previa anterior
        if (urlsFotosTemporales[indice]) {
            URL.revokeObjectURL(urlsFotosTemporales[indice]);
            urlsFotosTemporales[indice] = null;
        }

        // Si no se seleccionó una foto, restaurar el espacio
        if (!archivo) {
            espacio.replaceChildren();

            const icono = document.createElement("span");
            icono.textContent = "📷";

            const texto = document.createElement("p");
            texto.textContent = "Selecciona un recuerdo";

            espacio.append(icono, texto);
            return;
        }

        // Comprobar que sea una imagen admitida
        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!tiposPermitidos.includes(archivo.type)) {
            alert("Selecciona una imagen JPG, PNG o WebP.");
            campo.value = "";
            return;
        }

        // Crear una URL temporal para la imagen
        const urlTemporal = URL.createObjectURL(archivo);
        urlsFotosTemporales[indice] = urlTemporal;

        // Crear la imagen dentro de la Polaroid
        const imagen = document.createElement("img");

        imagen.src = urlTemporal;
        imagen.alt = "Nuestro recuerdo " + (indice + 1);

        imagen.style.width = "100%";
        imagen.style.height = "100%";
        imagen.style.objectFit = "cover";
        imagen.style.display = "block";

        espacio.replaceChildren(imagen);

        // Mostrar automáticamente la plantilla de recuerdos
        selectorPlantilla.value = "recuerdos";
        actualizarPlantillaVistaPrevia();

    });

});
