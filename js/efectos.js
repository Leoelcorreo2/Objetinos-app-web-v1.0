/* ============================================================
   OBJETINOS CONTRARELOJ
   EFECTOS VISUALES
   ============================================================ */


/* ============================================================
   UTILIDADES
   ============================================================ */

/**
 * Obtiene la posición central de un elemento respecto
 * a la ventana del navegador.
 */
function getElementCenter(element) {

    if (!element) {
        return {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
    }

    const rect =
        element.getBoundingClientRect();

    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}


/**
 * Obtiene la posición central de un objeto del juego.
 */
function getObjectCenter(object) {

    if (
        !object ||
        !object.element
    ) {
        return {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
    }

    return getElementCenter(
        object.element
    );
}


/* ============================================================
   TOAST
   ============================================================ */

let toastTimeout = null;


function showToast(
    message,
    duration = 1800
) {

    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    if (toastTimeout) {

        clearTimeout(
            toastTimeout
        );

    }


    toastTimeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            duration
        );

}


/* ============================================================
   PARTÍCULAS
   ============================================================ */

function createParticle(
    x,
    y,
    options = {}
) {

    const container =
        document.getElementById(
            "particles"
        );

    if (!container) {
        return;
    }


    const particle =
        document.createElement(
            "div"
        );


    particle.className =
        "particle";


    particle.textContent =
        options.symbol ||
        "✨";


    const dx =
        options.dx ??
        (
            Math.random() * 180 - 90
        );


    const dy =
        options.dy ??
        (
            Math.random() * -160 - 20
        );


    const duration =
        options.duration ??
        (
            450 +
            Math.random() * 450
        );


    const rotation =
        options.rotation ??
        (
            Math.random() * 360 - 180
        );


    particle.style.left =
        `${x}px`;


    particle.style.top =
        `${y}px`;


    particle.style.setProperty(
        "--dx",
        `${dx}px`
    );


    particle.style.setProperty(
        "--dy",
        `${dy}px`
    );


    particle.style.setProperty(
        "--dur",
        `${duration}ms`
    );


    particle.style.setProperty(
        "--rot",
        `${rotation}deg`
    );


    container.appendChild(
        particle
    );


    setTimeout(
        () => {

            particle.remove();

        },
        duration + 100
    );

}


/* ============================================================
   EXPLOSIÓN DE PARTÍCULAS
   ============================================================ */

function spawnParticles(
    x,
    y,
    count = CONFIG.PARTICULAS_TRIO,
    symbol = "✨"
) {

    const container =
        document.getElementById(
            "particles"
        );

    if (!container) {
        return;
    }


    /*
     * Evitamos que una sucesión rápida
     * de tríos llene el DOM de partículas.
     */

    const current =
        container.children.length;


    const available =
        Math.max(
            0,
            CONFIG.PARTICULAS_MAXIMAS -
            current
        );


    count =
        Math.min(
            count,
            available
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        createParticle(
            x,
            y,
            {
                symbol: symbol
            }
        );

    }

}


/* ============================================================
   PARTÍCULAS AL ELIMINAR UN TRÍO
   ============================================================ */

function tripleParticles(
    objects
) {

    if (
        !objects ||
        objects.length === 0
    ) {
        return;
    }


    let totalX = 0;
    let totalY = 0;
    let valid = 0;


    objects.forEach(
        object => {

            if (
                !object ||
                !object.element
            ) {
                return;
            }


            const pos =
                getObjectCenter(
                    object
                );


            totalX += pos.x;
            totalY += pos.y;

            valid++;

        }
    );


    if (!valid) {
        return;
    }


    const x =
        totalX / valid;


    const y =
        totalY / valid;


    spawnParticles(
        x,
        y,
        CONFIG.PARTICULAS_TRIO,
        "✨"
    );


    /*
     * Segunda pequeña ráfaga.
     */

    setTimeout(
        () => {

            spawnParticles(
                x,
                y,
                Math.floor(
                    CONFIG.PARTICULAS_TRIO / 2
                ),
                "⭐"
            );

        },
        100
    );

}


/* ============================================================
   EFECTO DE COMBO
   ============================================================ */

let comboTimeout = null;


function showCombo(
    combo,
    reward = 0
) {

    const badge =
        document.getElementById(
            "comboBadge"
        );


    const text =
        document.getElementById(
            "comboText"
        );


    const rewardElement =
        document.getElementById(
            "comboReward"
        );


    if (
        !badge ||
        !text ||
        !rewardElement
    ) {
        return;
    }


    if (combo < 2) {

        badge.classList.remove(
            "show"
        );

        return;

    }


    text.textContent =
        `COMBO x${combo}`;


    rewardElement.textContent =
        `+${reward} 🪙`;


    badge.classList.remove(
        "show"
    );


    /*
     * Forzar reflow para poder
     * repetir la animación.
     */

    void badge.offsetWidth;


    badge.classList.add(
        "show"
    );


    if (comboTimeout) {

        clearTimeout(
            comboTimeout
        );

    }


    comboTimeout =
        setTimeout(
            () => {

                badge.classList.remove(
                    "show"
                );

            },
            1300
        );

}


/* ============================================================
   ANIMACIÓN DE TRÍO
   ============================================================ */

function animateTripleRemoval(
    objects
) {

    if (
        !objects ||
        objects.length === 0
    ) {
        return;
    }


    objects.forEach(
        object => {

            if (
                !object ||
                !object.element
            ) {
                return;
            }


            object.element
                .classList
                .remove(
                    "removing"
                );


            void object.element.offsetWidth;


            object.element
                .classList
                .add(
                    "removing"
                );

        }
    );


    tripleParticles(
        objects
    );

}


/* ============================================================
   EFECTO DE CAÍDA DE CAPA
   ============================================================ */

function animateLayerAdvance(
    compartment
) {

    if (
        !compartment ||
        !compartment.element
    ) {
        return;
    }


    const objects =
        getFrontObjects(
            compartment
        );


    objects.forEach(
        object => {

            if (
                !object ||
                !object.element
            ) {
                return;
            }


            object.element.style.setProperty(
                "--drag-y",
                "-25px"
            );


            setTimeout(
                () => {

                    if (
                        object.element
                    ) {

                        object.element.style.setProperty(
                            "--drag-y",
                            "0px"
                        );

                    }

                },
                40
            );

        }
    );

}


/* ============================================================
   EFECTO DE DESBLOQUEO
   ============================================================ */

function animateUnlock(
    compartment
) {

    if (
        !compartment ||
        !compartment.element
    ) {
        return;
    }


    const element =
        compartment.element;


    element.classList.add(
        "unlocking"
    );


    /*
     * Si existe candado visual,
     * lo eliminamos.
     */

    const badge =
        element.querySelector(
            ".lockBadge"
        );


    if (badge) {

        badge.textContent =
            "🔓";

    }


    spawnShelfParticles(
        element
    );


    setTimeout(
        () => {

            element.classList.remove(
                "unlocking"
            );


            if (badge) {

                badge.remove();

            }

        },
        650
    );

}


/* ============================================================
   PARTÍCULAS SOBRE UN ESTANTE
   ============================================================ */

function spawnShelfParticles(
    element
) {

    const pos =
        getElementCenter(
            element
        );


    spawnParticles(
        pos.x,
        pos.y,
        14,
        "✨"
    );


    setTimeout(
        () => {

            spawnParticles(
                pos.x,
                pos.y,
                8,
                "🔓"
            );

        },
        120
    );

}


/* ============================================================
   EFECTO DE VICTORIA
   ============================================================ */

function victoryEffect() {

    const centerX =
        window.innerWidth / 2;


    const centerY =
        window.innerHeight * .35;


    /*
     * Primera explosión.
     */

    spawnParticles(
        centerX,
        centerY,
        24,
        "🎉"
    );


    /*
     * Segunda explosión.
     */

    setTimeout(
        () => {

            spawnParticles(
                centerX,
                centerY,
                20,
                "⭐"
            );

        },
        180
    );


    /*
     * Tercera explosión.

     */

    setTimeout(
        () => {

            spawnParticles(
                centerX,
                centerY,
                18,
                "✨"
            );

        },
        360
    );

}


/* ============================================================
   EFECTO DE ERROR / MOVIMIENTO NO VÁLIDO
   ============================================================ */

function shakeElement(
    element
) {

    if (!element) {
        return;
    }


    element.classList.remove(
        "shake"
    );


    void element.offsetWidth;


    element.classList.add(
        "shake"
    );


    setTimeout(
        () => {

            element.classList.remove(
                "shake"
            );

        },
        300
    );

}


/* ============================================================
   EFECTO AL INTENTAR USAR ESTANTE BLOQUEADO
   ============================================================ */

function showLockedFeedback(
    compartment
) {

    if (
        !compartment ||
        !compartment.element
    ) {
        return;
    }


    shakeElement(
        compartment.element
    );


    showToast(
        "🔒 Este estante está bloqueado",
        1300
    );


    const pos =
        getElementCenter(
            compartment.element
        );


    spawnParticles(
        pos.x,
        pos.y,
        5,
        "🔒"
    );

}


/* ============================================================
   LIMPIAR PARTÍCULAS
   ============================================================ */

function clearParticles() {

    const container =
        document.getElementById(
            "particles"
        );


    if (container) {

        container.innerHTML =
            "";

    }

}