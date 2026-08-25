/* ============================================================
   OBJETINOS CONTRARELOJ
   INTERACCIÓN
   V1.4.1 CORREGIDO
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


    /*
     * Un estante bloqueado
     * no permite mover objetos.
     */

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


    /*
     * Guardamos la posición inicial
     * del puntero.
     */

    dragStartX =
        event.clientX;


    dragStartY =
        event.clientY;


    object.dragging =
        true;


    /*
     * Marcamos visualmente el objeto
     * como arrastrado.
     */

    object.element
        .classList
        .add("dragging");


    /*
     * Capturamos el puntero.
     *
     * Esto es especialmente importante
     * en móviles para que el movimiento
     * siga funcionando aunque el dedo
     * salga ligeramente del objeto.
     */

    try {

        object.element.setPointerCapture(
            event.pointerId
        );

    }

    catch (e) {}

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


    /*
     * DESPLAZAMIENTO HORIZONTAL
     * desde el punto donde comenzamos.
     */

    const dx =
        event.clientX -
        dragStartX;


    /*
     * DESPLAZAMIENTO VERTICAL.
     */

    const dy =
        event.clientY -
        dragStartY;


    /*
     * ========================================================
     * CORRECCIÓN PRINCIPAL
     * ========================================================
     *
     * El CSS utiliza:
     *
     *     --dx
     *
     * para el desplazamiento horizontal.
     *
     * Antes aquí se utilizaba:
     *
     *     --drag-x
     *
     * que el CSS NO utilizaba.
     *
     * Por eso el objeto solo respondía
     * correctamente en vertical.
     */

    draggedObject.element.style.setProperty(
        "--dx",
        `${dx}px`
    );


    draggedObject.element.style.setProperty(
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
     * Guardamos la posición de liberación
     * ANTES de eliminar las variables
     * visuales del arrastre.
     */

    const dropX =
        event.clientX;


    const dropY =
        event.clientY;


    /*
     * Quitamos el desplazamiento visual.
     */

    element.style.removeProperty(
        "--dx"
    );

    element.style.removeProperty(
        "--drag-y"
    );


    object.dragging =
        false;


    element.classList.remove(
        "dragging"
    );


    /*
     * Liberamos el pointer capture.
     */

    try {

        if (
            element.hasPointerCapture(
                event.pointerId
            )
        ) {

            element.releasePointerCapture(
                event.pointerId
            );

        }

    }

    catch (e) {}


    draggedObject = null;

    dragPointerId = null;


    /*
     * Buscamos el hueco sobre el
     * que se ha soltado.
     */

    const destination =
        findDropTarget(
            dropX,
            dropY,
            object
        );


    /*
     * No hay hueco válido.
     *
     * El objeto vuelve a su posición.
     */

    if (!destination) {

        animateReturn(
            object
        );

        return;

    }


    /*
     * Movimiento definitivo.
     */

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
             * Centro del hueco.
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
             * Tolerancia de colocación.
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


            /*
             * Encontramos el índice
             * del estante dentro del DOM.
             */

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
             * Número de hueco:
             *
             * 0
             * 1
             * 2
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
             * que recibe objetos.
             */

            const layer =
                compartment.activeLayer();


            if (!layer) {

                /*
                 * Estante completamente vacío.
                 *
                 * Creamos su primera capa.
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
                 * Comprobamos el hueco
                 * concreto de la capa frontal.
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
             * exactamente donde ya estaba.
             */

            if (
                object.compartment ===
                    compartment &&
                object.slot === slot
            ) {

                return;

            }


            /*
             * Elegimos el hueco más cercano.
             */

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
     * Mismo hueco.
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
        target.compartment.ensureLayer(
            0
        );


    /*
     * El hueco debe seguir libre.
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
     * Quitamos primero el objeto
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
     * Colocamos en el nuevo hueco.
     */

    const placed =
        destinationLayer.addTo(
            target.slot,
            object
        );


    /*
     * Si falla, restauramos.
     */

    if (!placed) {

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
     * Renderizamos.
     */

    renderObject(
        object
    );


    updateAllObjectStates();


    /*
     * Comprobar trío.
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
     * Registrar trío en el estante.
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
     * Efectos visuales.
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
     * Eliminar.
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
     * Comprobar victoria.
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


    /*
     * Nos aseguramos de eliminar
     * cualquier desplazamiento residual.
     */

    object.element.style.removeProperty(
        "--dx"
    );


    object.element.style.removeProperty(
        "--drag-y"
    );


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