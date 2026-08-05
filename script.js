/* =====================================================================
   METALÚRGICA BUSATTO — script.js
   ---------------------------------------------------------------
   Este archivo contiene TODAS las funciones que hacen que la
   página reaccione a acciones del usuario (clicks, scroll, envío
   de formulario, etc). Cada función está comentada pensando en
   alguien que ya sabe programar en C: vas a ver equivalencias
   conceptuales al lado de cada bloque.

   Estructura del archivo:
     1. Configuración / constantes
     2. Menú hamburguesa responsive
     3. Cambio de estilo del header al hacer scroll
     4. Scroll suave hacia las secciones
     5. Animaciones al hacer scroll (IntersectionObserver)
     6. Año automático en el footer
     7. Validación y envío del formulario de contacto
     8. Arranque del programa (equivalente a "main()")
===================================================================== */


/* =====================================================================
   1. CONFIGURACIÓN / CONSTANTES
   En C esto sería algo como:
     #define EMAIL_DESTINO "metalurgicabusatto@gmail.com"
   Al tenerlas todas juntas arriba, es fácil encontrarlas y
   cambiarlas sin tener que buscar en medio de las funciones.
===================================================================== */

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf0zV2BdhMcgiwsGEXy1jCDMzhzL36sEXzoKLkhcP7Nn745GA/formResponse";

/* Ancho de pantalla (en píxeles) a partir del cual consideramos
   que estamos en "modo mobile". Tiene que coincidir con el valor
   usado en la media query de style.css (768px) para que JS y CSS
   estén de acuerdo sobre cuándo cambia el comportamiento del menú. */
const ANCHO_MOBILE = 768;


/* =====================================================================
   2. MENÚ HAMBURGUESA RESPONSIVE
   ---------------------------------------------------------------
   Lógica en pseudocódigo tipo C:

     bool menu_abierto = false;

     al_tocar_boton_hamburguesa() {
         menu_abierto = !menu_abierto;   // invierte el estado
         if (menu_abierto) mostrar_menu();
         else               ocultar_menu();
     }

   En el navegador no guardamos una variable "menu_abierto" a mano:
   usamos la PROPIA clase CSS "is-open" como si fuera ese booleano.
   Si el <nav> TIENE la clase, el menú está abierto; si no la
   tiene, está cerrado. Así el estado "vive" en el HTML mismo.
===================================================================== */
function inicializarMenuHamburguesa() {
    // Buscamos los dos elementos que necesitamos, por su "id".
    // Es como recibir dos punteros a estructuras ya existentes.
    const boton = document.getElementById("hamburger");
    const menu = document.getElementById("nav");

    // Si por algún motivo no existen en el HTML, no seguimos
    // (evita errores en consola, como chequear un puntero NULL).
    if (!boton || !menu) return;

    // "addEventListener" registra una función que se va a ejecutar
    // cada vez que ocurra el evento indicado ("click"). Es parecido
    // a registrar un "callback" o un manejador de interrupción: no
    // se ejecuta ahora, se ejecuta cuando el evento realmente pasa.
    boton.addEventListener("click", function () {
        // toggle() es literalmente un "invertir booleano": si la
        // clase está, la saca; si no está, la pone. Devuelve el
        // nuevo estado (true = quedó abierta, false = quedó cerrada).
        const abierto = menu.classList.toggle("is-open");
        boton.classList.toggle("is-open", abierto);

        // Actualizamos los atributos de accesibilidad para que un
        // lector de pantalla anuncie correctamente si el menú está
        // expandido o no.
        boton.setAttribute("aria-expanded", abierto ? "true" : "false");
        boton.setAttribute(
            "aria-label",
            abierto ? "Cerrar menú de navegación" : "Abrir menú de navegación"
        );
    });

    // Si el usuario toca un link DENTRO del menú (por ejemplo,
    // "Servicios"), cerramos el menú automáticamente. Sin esto,
    // en mobile el menú quedaría abierto tapando la sección a la
    // que el usuario justo quiso ir.
    const links = menu.querySelectorAll(".nav__link, .nav__whatsapp");
    links.forEach(function (link) {
        link.addEventListener("click", function () {
            menu.classList.remove("is-open");
            boton.classList.remove("is-open");
            boton.setAttribute("aria-expanded", "false");
        });
    });
}


/* =====================================================================
   3. CAMBIO DE ESTILO DEL HEADER AL HACER SCROLL
   ---------------------------------------------------------------
   El evento "scroll" se dispara constantemente mientras la
   persona se desplaza por la página (muchas veces por segundo).
   Cada vez que se dispara, miramos "window.scrollY", que es la
   cantidad de píxeles que ya se scrolleó desde arriba (equivalente
   a una posición dentro de un archivo, como ftell() en C).

   Si esa posición supera un umbral chico (50px), le agregamos al
   header la clase "is-scrolled", que en CSS le da fondo más
   opaco y una sombra. Si volvemos arriba de ese umbral, se la
   sacamos.
===================================================================== */
function inicializarHeaderScroll() {
    const header = document.getElementById("header");
    if (!header) return;

    const UMBRAL_SCROLL = 50; // píxeles

    function actualizarEstiloHeader() {
        if (window.scrollY > UMBRAL_SCROLL) {
            header.classList.add("is-scrolled");
        } else {
            header.classList.remove("is-scrolled");
        }
    }

    // Ejecutamos una vez al cargar, por si la página ya arranca
    // scrolleada (por ejemplo, si el usuario recarga estando a
    // mitad de página).
    actualizarEstiloHeader();

    window.addEventListener("scroll", actualizarEstiloHeader);
}


/* =====================================================================
   4. SCROLL SUAVE HACIA LAS SECCIONES
   ---------------------------------------------------------------
   Aunque en style.css ya activamos "scroll-behavior: smooth" como
   respaldo general, acá lo hacemos manualmente con
   "scrollIntoView()" para poder RESTARLE la altura del header fijo.
   Si no hiciéramos este ajuste, el header (que siempre está
   flotando arriba) taparía el título de la sección de destino.

   Lógica:
     1. Detectar click en cualquier link que empiece con "#"
        (esos son los links "internos", que apuntan a una sección
        de esta misma página, no a otra página).
     2. Buscar el elemento con ese id.
     3. Calcular su posición real restando la altura del header.
     4. Scrollear ahí con animación.
===================================================================== */
function inicializarScrollSuave() {
    // Seleccionamos TODOS los links cuyo atributo href empiece con "#".
    // querySelectorAll es como recorrer un array de punteros a
    // todos los elementos que matchean ese "patrón" (selector CSS).
    const linksInternos = document.querySelectorAll('a[href^="#"]');

    linksInternos.forEach(function (link) {
        link.addEventListener("click", function (evento) {
            const destinoId = link.getAttribute("href");

            // Ignoramos el caso de un link vacío tipo href="#"
            if (destinoId === "#" || destinoId.length <= 1) return;

            const elementoDestino = document.querySelector(destinoId);
            if (!elementoDestino) return;

            // Cancelamos el salto instantáneo por defecto del navegador
            evento.preventDefault();

            // getBoundingClientRect() nos da la posición del elemento
            // relativa a la ventana actual (no al documento completo).
            const alturaHeader = document.getElementById("header").offsetHeight;
            const posicionDestino =
                elementoDestino.getBoundingClientRect().top +
                window.scrollY -
                alturaHeader;

            window.scrollTo({
                top: posicionDestino,
                behavior: "smooth",
            });
        });
    });
}


/* =====================================================================
   5. ANIMACIONES SUAVES AL HACER SCROLL (IntersectionObserver)
   ---------------------------------------------------------------
   IntersectionObserver es una herramienta del navegador que
   "vigila" uno o varios elementos y nos avisa (nos llama a una
   función) cada vez que un elemento ENTRA o SALE de la zona
   visible de la pantalla. Es mucho más eficiente que estar
   calculando posiciones a mano en cada evento de scroll.

   Pensalo como un watcher/callback asincrónico: en vez de
   "preguntar todo el tiempo ¿ya se ve?" (polling), el navegador
   directamente "nos avisa" cuando cambia la visibilidad
   (interrupción, no polling).

   Le agregamos la clase "reveal" (en CSS) a varios elementos del
   HTML mediante JavaScript, y cuando el observer detecta que un
   elemento con esa clase entró en pantalla, le sumamos la clase
   "is-visible", que dispara la transición de aparición.
===================================================================== */
function inicializarAnimacionesScroll() {
    // Elegimos qué elementos queremos animar: títulos de sección,
    // tarjetas de servicios, bloques de "por qué elegirnos", etc.
    const elementosAAnimar = document.querySelectorAll(
        ".section-title, .card, .why-us__item, .capabilities__item, .about__text, .gallery__item"
    );

    // Si el navegador es muy viejo y no soporta esta API, mostramos
    // todo directamente sin animación (mejor eso que romper la página).
    if (!("IntersectionObserver" in window)) {
        elementosAAnimar.forEach(function (el) {
            el.classList.add("is-visible");
        });
        return;
    }

    // Le agregamos la clase base "reveal" a cada elemento ANTES de
    // observarlo, para que arranque invisible/desplazado (según
    // define style.css) hasta que entre en pantalla.
    elementosAAnimar.forEach(function (el) {
        el.classList.add("reveal");
    });

    // Creamos el observer. La función que recibe se ejecuta cada
    // vez que cambia la visibilidad de alguno de los elementos
    // observados. "entradas" es un array con la info de cada uno.
    const observer = new IntersectionObserver(
        function (entradas) {
            entradas.forEach(function (entrada) {
                // "isIntersecting" es true cuando el elemento ya es
                // visible en pantalla (aunque sea parcialmente).
                if (entrada.isIntersecting) {
                    entrada.target.classList.add("is-visible");

                    // Dejamos de observar este elemento puntual:
                    // una vez que apareció, no necesitamos seguir
                    // "vigilándolo" (ahorra recursos, como hacer
                    // free() de algo que ya no necesitás rastrear).
                    observer.unobserve(entrada.target);
                }
            });
        },
        {
            // "threshold: 0.15" significa: avisame cuando al menos
            // el 15% del elemento ya sea visible, no hace falta que
            // esté 100% visible para empezar a animarlo.
            threshold: 0.15,
        }
    );

    // Le decimos al observer QUÉ elementos vigilar, uno por uno.
    elementosAAnimar.forEach(function (el) {
        observer.observe(el);
    });
}


/* =====================================================================
   6. AÑO AUTOMÁTICO EN EL FOOTER
   ---------------------------------------------------------------
   Reemplaza el "0000" que está escrito en el HTML por el año
   real del sistema, usando el objeto Date del navegador (similar
   a usar time() / localtime() en C para obtener la fecha actual).
===================================================================== */
function establecerAnioActual() {
    const elementoAnio = document.getElementById("year");
    if (!elementoAnio) return;

    /* Obtenemos el año actual del sistema */
    const anioActual = new Date().getFullYear();

    /* Lo insertamos en el elemento del footer */
    elementoAnio.textContent = anioActual;
}


/* =====================================================================
   7. VALIDACIÓN Y ENVÍO DEL FORMULARIO DE CONTACTO
   ---------------------------------------------------------------
   Como GitHub Pages NO tiene backend (no hay un servidor propio
   que reciba estos datos), el formulario arma un link "mailto:"
   con todos los campos ya redactados en el cuerpo del mensaje, y
   se lo pasa al navegador para que abra el programa de correo del
   usuario (Gmail, Outlook, Mail, etc). La persona solo tiene que
   apretar "Enviar" en su propio cliente de correo.

   Pasos:
     1. Evitar que el formulario se envíe "de la forma tradicional"
        (que recargaría la página, como hacía un <form action=...>
        clásico apuntando a un servidor).
     2. Leer el valor de cada campo (equivalente a leer variables
        que el usuario cargó, como leer varios scanf() seguidos).
     3. Validar que los campos obligatorios no estén vacíos.
     4. Si hay errores, mostrarlos y CORTAR la ejecución (return),
        sin intentar enviar nada.
     5. Si todo está bien, armar el link mailto: con los datos
        adentro y abrirlo.
===================================================================== */
function inicializarFormularioContacto() {
    const formulario = document.getElementById("contact-form");
    if (!formulario) return;

    const mensajeExito = document.getElementById("form-success");

    // Mapa de: id del campo -> mensaje de error a mostrar si está
    // vacío. Es como un array de structs { campo, mensaje } en C,
    // solo que acá usamos un objeto (clave -> valor).
    const CAMPOS_OBLIGATORIOS = {
        nombre: "Por favor, ingrese su nombre.",
        telefono: "Por favor, ingrese un teléfono de contacto.",
        email: "Por favor, ingrese un email válido.",
        servicio: "Por favor, seleccione un servicio.",
        descripcion: "Por favor, describa brevemente el trabajo.",
    };

    // Validación simple de formato de email con una expresión
    // regular (no es un validador perfecto de RFC 5322, pero
    // detecta el error más común: falta de "@" o de dominio).
    const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    formulario.addEventListener("submit", function (evento) {
        // PASO 1: evitamos el envío tradicional del formulario.
        evento.preventDefault();

        let hayErrores = false;

        // Antes de validar de nuevo, limpiamos errores previos
        // (por si el usuario ya había intentado enviar antes).
        limpiarErrores();

        // PASO 2 y 3: recorremos cada campo obligatorio, leemos su
        // valor y chequeamos que no esté vacío.
        for (const idCampo in CAMPOS_OBLIGATORIOS) {
            const campo = document.getElementById(idCampo);
            if (!campo) continue;

            const valor = campo.value.trim(); // trim() saca espacios de más

            if (valor === "") {
                mostrarError(idCampo, CAMPOS_OBLIGATORIOS[idCampo]);
                hayErrores = true;
            }
        }

        // Validación extra específica para el email: si el campo
        // no está vacío pero tiene un formato inválido, avisamos.
        const campoEmail = document.getElementById("email");
        if (campoEmail && campoEmail.value.trim() !== "") {
            if (!PATRON_EMAIL.test(campoEmail.value.trim())) {
                mostrarError("email", "Ingrese un email con formato válido (ejemplo@dominio.com).");
                hayErrores = true;
            }
        }

        // PASO 4: si hubo algún error, no seguimos.
        if (hayErrores) {
            if (mensajeExito) mensajeExito.classList.remove("is-visible");
            return;
        }

        enviarGoogleForm();

        if (mensajeExito) mensajeExito.classList.add("is-visible");
        formulario.reset();
    });

    /* Muestra el mensaje de error correspondiente a un campo y le
       agrega la clase visual "is-invalid" al input/select/textarea. */
    function mostrarError(idCampo, mensaje) {
        const campo = document.getElementById(idCampo);
        const spanError = document.getElementById("error-" + idCampo);

        if (campo) campo.classList.add("is-invalid");
        if (spanError) {
            spanError.textContent = mensaje;
            spanError.classList.add("is-visible");
        }
    }

    /* Limpia TODOS los mensajes de error y marcas visuales, para
       arrancar de cero en cada intento de envío. */
    function limpiarErrores() {
        const errores = formulario.querySelectorAll(".form__error");
        errores.forEach(function (span) {
            span.textContent = "";
            span.classList.remove("is-visible");
        });

        const invalidos = formulario.querySelectorAll(".is-invalid");
        invalidos.forEach(function (campo) {
            campo.classList.remove("is-invalid");
        });
    }

   function enviarGoogleForm() {

    const datos = new FormData();

    datos.append("entry.1840842532",
        document.getElementById("nombre").value.trim()
    );

    datos.append("entry.1690080680",
        document.getElementById("empresa").value.trim()
    );

    datos.append("entry.1531838907",
        document.getElementById("telefono").value.trim()
    );

    datos.append("entry.147194797",
        document.getElementById("email").value.trim()
    );

    datos.append("entry.782103267",
        document.getElementById("servicio").value.trim()
    );

    datos.append("entry.338712765",
        document.getElementById("descripcion").value.trim()
    );


    fetch(GOOGLE_FORM_URL, {
        method: "POST",
        mode: "no-cors",
        body: datos
    });

}
}


/*BOTONES DE LINEA DE TIEMPO */
const botones = document.querySelectorAll(".timeline-btn");

const proyectos = document.querySelectorAll(".timeline-project");


botones.forEach(boton => {

    boton.addEventListener("click", ()=>{


        botones.forEach(b=>{
            b.classList.remove("active");
        });


        proyectos.forEach(p=>{
            p.classList.remove("active");
        });



        boton.classList.add("active");


        document
        .getElementById(boton.dataset.target)
        .classList.add("active");


    });

});
/* FIN BOTONES */


/* =====================================================================
   8. ARRANQUE DEL PROGRAMA
   ---------------------------------------------------------------
   "DOMContentLoaded" es el momento en que el navegador terminó de
   construir toda la estructura HTML (aunque las imágenes todavía
   puedan estar cargando). Es el equivalente a esperar a que
   termine de ejecutarse todo el "setup" antes de arrancar el
   "loop" principal — como el main() de un programa en C, que
   arranca después de que el sistema operativo terminó de cargar
   el binario en memoria.

   Acá llamamos, en orden, a cada función "inicializar..." que
   definimos arriba.
===================================================================== */
document.addEventListener("DOMContentLoaded", function () {
    inicializarMenuHamburguesa();
    inicializarHeaderScroll();
    inicializarScrollSuave();
    inicializarAnimacionesScroll();
    establecerAnioActual();
    inicializarFormularioContacto();
});
