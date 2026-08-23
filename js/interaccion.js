/* ============================================================
   OBJETINOS CONTRARELOJ
   INTERACCIÓN
   V1.4.1
   ============================================================ */


let draggedObject = null;

let dragStartX = 0;
let dragStartY = 0;

let dragPointerId = null;


/* ============================================================
   INICIALIZAR INTERACCIÓN
   ============================================================ */

function initInteraction() {

    document.addEventListener(
        "pointerdown",
        handlePointerDown
    );

    document.addEventListener(
        "pointermove",
        handlePointerMove
    );

    document.addEventListener(
        "pointerup",
        handlePointerUp
    );

    document.addEventListener(
        "pointercancel",
        handlePointerUp
    );

}


/* ============================================================
   POINTER DOWN
   ============================================================ */

function handlePointerDown(event) {

    const element =
        event.target.closest(".obj");


    if (!element) {

        return;

    }


    const object =
        objectFromElement(
            element
        );


    if (!object) {

        return;

    }


    /*
     * Solo se puede mover
     * la capa frontal.
     */

    if (
        !isObjectFront(object)
    ) {

        return;

    }


    if (
        object.compartment.locked
    ) {

        return;

    }


    event.preventDefault();


    draggedObject =
        object;


    dragPointerId =
        event.pointerId;


    dragStartX =
        event.clientX;


    dragStartY =
        event.clientY;


    object.dragging =
        true;


    object.element
        .classList
        .add("dragging");


    try {

        object.element.setPointerCapture(
            event.pointerId
        );

    } catch (e) {}

}


/* ============================================================
   POINTER MOVE
   ============================================================ */

function handlePointerMove(event) {

    if (
        !draggedObject
    ) {

        return;

    }


    if (
        dragPointerId !==
        event.pointerId
    ) {

        return;

    }


    event.preventDefault();


    const dx =
        event.clientX -
        dragStartX;


    const dy =
        event.clientY -
        dragStartY;


    draggedObject.element
        .style
        .setProperty(
            "--drag-x",
            `${dx}px`
        );


    draggedObject.element
        .style
        .setProperty(
            "--drag-y",
            `${dy}px`
        );

}


/* ============================================================
   POINTER UP
   ============================================================ */

function handlePointerUp(event) {

    if (
        !draggedObject
    ) {

        return;

    }


    if (
        dragPointerId !==
        event.pointerId
    ) {

        return;

    }


    event.preventDefault();


    const object =
        draggedObject;


    const element =
        object.element;


    /*
     * Quitamos el desplazamiento visual.
     */

    element.style.removeProperty(
        "--drag-x"
    );

    element.style.removeProperty(
        "--drag-y"
    );


    object.dragging =
        false;


    element.classList.remove(
        "dragging"
    );


    draggedObject = null;

    dragPointerId = null;


    /*
     * Buscamos el hueco sobre el
     * que se ha soltado.
     */

    const destination =
        findDropTarget(
            event.clientX,
            event.clientY,
            object
        );


    if (!destination) {

        animateReturn(
            object
        );

        return;

    }


    moveObjectToTarget(
        object,
        destination
    );

}


/* ============================================================
   BUSCAR DESTINO
   ============================================================ */

function findDropTarget(
    x,
    y,
    object
) {

    const cells =
        Array.from(
            document.querySelectorAll(
                ".cell"
            )
        );


    let best = null;

    let bestDistance =
        Infinity;


    cells.forEach(
        cell => {

            const rect =
                cell.getBoundingClientRect();


            /*
             * Distancia al centro del hueco.
             */

            const centerX =
                rect.left +
                rect.width / 2;


            const centerY =
                rect.top +
                rect.height / 2;


            const distance =
                Math.hypot(
                    x - centerX,
                    y - centerY
                );


            /*
             * Solo consideramos el hueco
             * si el dedo/cursor está dentro
             * de él o muy cerca.
             */

            const tolerance =
                Math.max(
                    rect.width,
                    rect.height
                ) * 0.65;


            if (
                distance >
                tolerance
            ) {

                return;

            }


            /*
             * Obtener estante.
             */

            const compartmentElement =
                cell.closest(
                    ".compartment"
                );


            if (
                !compartmentElement
            ) {

                return;

            }


            const compartmentIndex =
                Array.from(
                    document.querySelectorAll(
                        ".compartment"
                    )
                ).indexOf(
                    compartmentElement
                );


            const compartment =
                GAME_MODEL
                    .compartments[
                        compartmentIndex
                    ];


            if (!compartment) {

                return;

            }


            /*
             * Estante bloqueado.
             */

            if (
                compartment.locked
            ) {

                return;

            }


            /*
             * Averiguar el número de hueco.
             *
             * Esto es MUY IMPORTANTE.
             */

            const slot =
                Array.from(
                    compartmentElement
                        .querySelectorAll(
                            ".cell"
                        )
                ).indexOf(
                    cell
                );


            if (
                slot < 0 ||
                slot > 2
            ) {

                return;

            }


            /*
             * La capa frontal es la única
             * que puede recibir objetos.
             */

            const layer =
                compartment.activeLayer();


            if (!layer) {

                /*
                 * Estante completamente vacío:
                 * creamos la primera capa.
                 */

                const newLayer =
                    compartment.ensureLayer(
                        0
                    );


                if (
                    newLayer.hasObjectAt(
                        slot
                    )
                ) {

                    return;

                }

            }

            else {

                /*
                 * Si existe capa frontal,
                 * comprobamos el hueco concreto.
                 */

                if (
                    layer.hasObjectAt(
                        slot
                    )
                ) {

                    return;

                }

            }


            /*
             * No permitimos soltar el objeto
             * exactamente sobre sí mismo.
             */

            if (
                object.compartment ===
                    compartment &&
                object.slot === slot
            ) {

                return;

            }


            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;


                best = {

                    compartment:
                        compartment,

                    slot:
                        slot,

                    cell:
                        cell

                };

            }

        }
    );


    return best;

}


/* ============================================================
   MOVER OBJETO
   ============================================================ */

function moveObjectToTarget(
    object,
    target
) {

    if (
        !object ||
        !target
    ) {

        return false;

    }


    const oldCompartment =
        object.compartment;


    const oldLayer =
        object.layer;


    const oldSlot =
        object.slot;


    /*
     * Si el destino es el mismo,
     * no hacemos nada.
     */

    if (
        oldCompartment ===
            target.compartment &&
        oldSlot ===
            target.slot
    ) {

        animateReturn(
            object
        );

        return false;

    }


    /*
     * Capa frontal del destino.
     */

    const destinationLayer =
        target.compartment.activeLayer()
        ||
        target.compartment.ensureLayer(0);


    /*
     * Comprobar que el hueco
     * sigue libre.
     */

    if (
        destinationLayer.hasObjectAt(
            target.slot
        )
    ) {

        animateReturn(
            object
        );

        return false;

    }


    /*
     * QUITAMOS primero el objeto
     * de su posición anterior.
     */

    if (
        oldLayer &&
        oldSlot !== null
    ) {

        oldLayer.removeFrom(
            oldSlot
        );

    }


    /*
     * Colocamos en el hueco exacto.
     */

    const placed =
        destinationLayer.addTo(
            target.slot,
            object
        );


    if (!placed) {

        /*
         * Si algo falla,
         * lo devolvemos a su posición.
         */

        if (
            oldCompartment &&
            oldLayer &&
            oldSlot !== null
        ) {

            oldLayer.addTo(
                oldSlot,
                object
            );

            object.compartment =
                oldCompartment;

            object.layer =
                oldLayer;

            object.slot =
                oldSlot;

        }


        animateReturn(
            object
        );

        return false;

    }


    /*
     * Actualizamos referencias.
     */

    object.compartment =
        target.compartment;

    object.layer =
        destinationLayer;

    object.slot =
        target.slot;


    /*
     * Render.
     */

    renderObject(
        object
    );


    updateAllObjectStates();


    /*
     * Ahora comprobamos si se ha formado
     * un trío.
     */

    checkForTriple(
        destinationLayer,
        target.compartment
    );


    return true;

}


/* ============================================================
   COMPROBAR TRÍO
   ============================================================ */

function checkForTriple(
    layer,
    compartment
) {

    if (
        !layer ||
        !compartment
    ) {

        return;

    }


    if (
        !layer.isTriple()
    ) {

        return;

    }


    const triple =
        layer.getTriple();


    if (
        triple.length !== 3
    ) {

        return;

    }


    /*
     * Registrar combo.
     */

    const combo =
        GAME_MODEL.registerTriple();


    /*
     * Registrar trío en el estante
     * por si algún día está bloqueado.
     */

    compartment.registerTriple();


    /*
     * Puntuación.
     */

    GAME_MODEL.score +=
        CONFIG.PUNTOS_TRIO *
        Math.max(
            1,
            combo
        );


    GAME_MODEL.coins +=
        CONFIG.MONEDAS_TRIO *
        Math.max(
            1,
            combo
        );


    /*
     * Efectos.
     */

    if (
        typeof showTripleEffect ===
        "function"
    ) {

        showTripleEffect(
            triple,
            combo
        );

    }


    if (
        combo > 1 &&
        typeof showCombo ===
        "function"
    ) {

        showCombo(
            combo
        );

    }


    /*
     * Sonido SOLO al formar trío.
     */

    if (
        typeof playTripleSound ===
        "function"
    ) {

        playTripleSound();

    }


    /*
     * Eliminación.
     */

    removeTripleObjects(
        triple
    );


    /*
     * Actualizar interfaz.

     */

    if (
        typeof updateInterface ===
        "function"
    ) {

        updateInterface();

    }


    /*
     * Comprobar victoria después
     * de la animación.
     */

    setTimeout(
        () => {

            updateAllObjectStates();

            renderAllObjects();


            if (
                !GAME_MODEL.hasObjects()
            ) {

                if (
                    typeof levelCompleted ===
                    "function"
                ) {

                    levelCompleted();

                }

            }

        },

        CONFIG.DURACION_ELIMINACION + 30
    );

}


/* ============================================================
   ANIMAR REGRESO
   ============================================================ */

function animateReturn(
    object
) {

    if (
        !object ||
        !object.element
    ) {

        return;

    }


    object.element
        .classList
        .add("returning");


    setTimeout(
        () => {

            if (
                object.element
            ) {

                object.element
                    .classList
                    .remove(
                        "returning"
                    );

            }

        },

        CONFIG.DURACION_REGRESO
    );

}