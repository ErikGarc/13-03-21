

// =====================================
// CORAZONES Y DESTELLOS DEL FONDO
// =====================================

const contenedor = document.getElementById("corazones");

const cantidadElementos = 30;

const simbolos = ["♡", "♥", "ღ", "✧", "✦"];

const colores = [
    "#E8A1BA",
    "#D98BA7",
    "#F2B6C9",
    "#C97998",
    "#F5C5D5",
    "#FFFFFF"
];

for (let i = 0; i < cantidadElementos; i++) {

    const elemento = document.createElement("span");

    elemento.classList.add("corazon-flotante");

    const simbolo = Math.floor(
        Math.random() * simbolos.length
    );

    elemento.textContent = simbolos[simbolo];

    const color = Math.floor(
        Math.random() * colores.length
    );

    elemento.style.color = colores[color];

    elemento.style.left = Math.random() * 100 + "%";

    elemento.style.fontSize =
        (12 + Math.random() * 30) + "px";

    elemento.style.animationDuration =
        (9 + Math.random() * 16) + "s";

    elemento.style.animationDelay =
        (Math.random() * 15) + "s";

    elemento.style.setProperty(
        "--opacidad",
        (0.25 + Math.random() * 0.45)
    );

    contenedor.appendChild(elemento);
}


// =====================================
// PRESENTACION DE KITTY
// =====================================

const kitty = document.getElementById("gatita");
const imagenKitty = document.getElementById("imagenKitty");

const dialogo = document.getElementById("dialogo");
const boton = document.getElementById("continuar");

// Fotogramas de caminata
const fotogramas = [
    "assets/imagenes/kitty-paso-1.png",
    "assets/imagenes/kitty-paso-2.png",
    "assets/imagenes/kitty-paso-3.png",
    "assets/imagenes/kitty-paso-4.png"
];

// Precargar las imágenes
fotogramas.forEach(ruta => {
    const imagen = new Image();
    imagen.src = ruta;
});

// Control de la animación
let pasoActual = 0;

// Cambiar los pies cada 180 milisegundos
const caminata = setInterval(() => {

    imagenKitty.src = fotogramas[pasoActual];

    pasoActual = (pasoActual + 1) % fotogramas.length;

}, 180);


// Kitty llega al buzón después de 5 segundos
setTimeout(() => {

    // Detener cambio de fotogramas
    clearInterval(caminata);

    // Detener desplazamiento
    kitty.classList.add("detenida");

    // Dejarla con los pies juntos
    imagenKitty.src = fotogramas[3];

    // Mostrar mensaje
    dialogo.classList.add("visible");

}, 5000);


// Mostrar botón de continuar




// Entrar a la pantalla de acceso

boton.addEventListener("click", () => {

    window.location.href = "login.html";

});


// ==================================
// ENTREGA DE LA CARTA AL BUZÓN
// ==================================

const cartaVoladora =
    document.getElementById("cartaVoladora");

const buzonKawaii =
    document.getElementById("buzon");

const imagenBuzon =
    buzonKawaii.querySelector(".imagen-buzon");

// Calcula el recorrido según la posición
// real de Kitty y del buzón.
function prepararEntrega() {

    const escenario =
        document.querySelector(".escenario");

    const rectEscenario =
        escenario.getBoundingClientRect();

    const rectKitty =
        kitty.getBoundingClientRect();

    const rectBuzon =
        imagenBuzon.getBoundingClientRect();

    // Punto aproximado donde Kitty lleva la carta
    const inicioX =
        rectKitty.left - rectEscenario.left
        + rectKitty.width * 0.75;

    const inicioY =
        rectKitty.top - rectEscenario.top
        + rectKitty.height * 0.45;

    // Ranura del buzón kawaii
    const finalX =
        rectBuzon.left - rectEscenario.left
        + rectBuzon.width * 0.53;

    const finalY =
        rectBuzon.top - rectEscenario.top
        + rectBuzon.height * 0.39;

    cartaVoladora.style.setProperty(
        "--inicio-x", `${inicioX}px`
    );

    cartaVoladora.style.setProperty(
        "--inicio-y", `${inicioY}px`
    );

    cartaVoladora.style.setProperty(
        "--medio-x", `${(inicioX + finalX) / 2}px`
    );

    cartaVoladora.style.setProperty(
        "--medio-y", `${Math.min(inicioY, finalY) - 35}px`
    );

    cartaVoladora.style.setProperty(
        "--final-x", `${finalX}px`
    );

    cartaVoladora.style.setProperty(
        "--final-y", `${finalY}px`
    );

    cartaVoladora.classList.add("entregando");
}

// Kitty entrega la carta al detenerse
setTimeout(() => {

    prepararEntrega();

}, 5500);

// ==================================
// EFECTOS MÁGICOS AL RECIBIR LA CARTA
// ==================================

const magiaBuzon =
    document.getElementById("magiaBuzon");

// La entrega comienza a los 5.5 segundos
// y dura 1.5 segundos.
//
// Activamos los efectos cuando termina.

setTimeout(() => {

    buzonKawaii.classList.add("recibiendo-amor");
    buzonKawaii.classList.add("brillo-amor");

    magiaBuzon.classList.add("activa");

}, 7000);


// Quitamos el resplandor y la sacudida
// cuando termina la celebración.

setTimeout(() => {

    buzonKawaii.classList.remove("recibiendo-amor");
    buzonKawaii.classList.remove("brillo-amor");

}, 9000);

// ==================================
// BIENVENIDA DESPUÉS DE LA ENTREGA
// ==================================

// Kitty termina de entregar su carta
// y aparece el mensaje romántico.

setTimeout(() => {

    dialogo.classList.add("visible");

}, 9300);


// Después aparece el botón.

setTimeout(() => {

    boton.classList.add("visible");

}, 10500);