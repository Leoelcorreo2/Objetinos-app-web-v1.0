/* ============================================================
   OBJETINOS CONTRARELOJ
   INTERACCIÓN Y ARRASTRE DE OBJETOS
   ============================================================ */


/* ============================================================
   ESTADO DEL ARRASTRE
   ============================================================ */

const DRAG_STATE = {

    active: false,

    object: null,

    pointerId: null,

    startX: 0,

    startY: 0,

    currentX: 0,

    currentY: 0,

    originalCompartment: null,

    originalLayer: null,

    originalSlot: null,

    originalParent: null

};


/* ============================================================
   INICIALIZAR INTERACCIÓN
   ============================================================ */

function initInteraction() {

    /*
     * Delegación de eventos.
     *
     * Esto es importante porque los objetos se crean
     * dinámicamente durante el juego.
     */

    document.addEventListener(
        "pointerdown",
        handlePointerDown,
        {
            passive: false
        }
    );


    document.addEventListener(
        "pointermove",
        handlePointerMove,
        {
            passive: false
        }
    );


    document.addEventListener(
        "pointerup",
        handlePointerUp,
        {
            passive: false
        }
    );


    document.addEventListener(
        "pointercancel",
        handlePointerCancel,
        {
            passive: false
        }
    );

}


/* ============================================================
   POINTER DOWN
   ============================================================ */

function handlePointerDown(
    event
) {

    if (
        DRAG_STATE.active
    ) {
        return;
    }


    /*
     * Solo botón principal del ratón.
     */

    if (
        event.pointerType === "mouse" &&
        event.button !== 0
    ) {
        return;
    }


    const element =
        event.target.closest(
            ".obj"
        );


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
     * Solo se pueden tocar objetos
     * de la capa frontal.
     */

    if (
        !isObjectFront(
            object
        )
    ) {

        event.preventDefault();

        return;

    }


    /*
     * No permitir interacción
     * con estante bloqueado.
     */

    if (
        object.compartment &&
        object.compartment.locked
    ) {

        event.preventDefault();

        showLockedFeedback(
            object.compartment
        );

        playErrorSound();

        return;

    }


    event.preventDefault();


    resumeSound();


    beginDrag(
        object,
        event
    );

}


/* ============================================================
   COMENZAR ARRASTRE
   ============================================================ */

function beginDrag(
    object,
    event
) {

    if (
        !object ||
        !object.element
    ) {
        return;
    }


    DRAG_STATE.active =
        true;


    DRAG_STATE.object =
        object;


    DRAG_STATE.pointerId =
        event.pointerId;


    DRAG_STATE.startX =
        event.clientX;


    DRAG_STATE.startY =
        event.clientY;


    DRAG_STATE.currentX =
        event.clientX;


    DRAG_STATE.currentY =
        event.clientY;


    DRAG_STATE.originalCompartment =
        object.compartment;


    DRAG_STATE.originalLayer =
        object.layer;


    DRAG_STATE.originalSlot =
        object.slot;


    DRAG_STATE.originalParent =
        object.element.parentElement;


    object.dragging =
        true;


    object.selected =
        true;


    object.element.classList.add(
        "selected",
        "dragging"
    );


    /*
     * Capturamos el puntero para que el arrastre
     * no se pierda al salir del objeto.
     */

    try {

        object.element.setPointerCapture(
            event.pointerId
        );

    }

    catch (error) {

        /*
         * Algunos navegadores pueden no
         * soportarlo. No es crítico.
         */

    }


    /*
     * Sacamos visualmente el objeto
     * por encima del resto.
     */

    object.element.style.zIndex =
        "400";


    /*
     * Mientras arrastramos no debe responder
     * a eventos secundarios.
     */

    object.element.style.pointerEvents =
        "none";

}


/* ============================================================
   POINTER MOVE
   ============================================================ */

function handlePointerMove(
    event
) {

    if (
        !DRAG_STATE.active
    ) {
        return;
    }


    if (
        event.pointerId !==
        DRAG_STATE.pointerId
    ) {
        return;
    }


    event.preventDefault();


    const object =
        DRAG_STATE.object;


    if (
        !object ||
        !object.element
    ) {
        return;
    }


    DRAG_STATE.currentX =
        event.clientX;


    DRAG_STATE.currentY =
        event.clientY;


    const dx =
        event.clientX -
        DRAG_STATE.startX;


    const dy =
        event.clientY -
        DRAG_STATE.startY;


    /*
     * El objeto sigue al dedo/cursor.
     */

    object.element.style.setProperty(
        "--dx",
        `${dx}px`
    );


    object.element.style.setProperty(
        "--drag-y",
        `${dy}px`
    );


    /*
     * Marcamos visualmente el posible
     * hueco de destino.
     */

    highlightDropTarget(
        event.clientX,
        event.clientY
    );

}


/* ============================================================
   POINTER UP
   ============================================================ */

function handlePointerUp(
    event
) {

    if (
        !DRAG_STATE.active
    ) {
        return;
    }


    if (
        event.pointerId !==
        DRAG_STATE.pointerId
    ) {
        return;
    }


    event.preventDefault();


    const object =
        DRAG_STATE.object;


    if (!object) {

        cancelDrag();

        return;

    }


    /*
     * Buscamos el hueco donde se ha soltado.
     */

    const target =
        findDropTarget(
            event.clientX,
            event.clientY,
            object
        );


    if (
        target &&
        canDropObject(
            object,
            target
        )
    ) {

        completeDrop(
            object,
            target
        );

    }

    else {

        returnObjectToOrigin(
            object
        );

    }


    clearDropHighlight();

}


/* ============================================================
   POINTER CANCEL
   ============================================================ */

function handlePointerCancel(
    event
) {

    if (
        !DRAG_STATE.active
    ) {
        return;
    }


    const object =
        DRAG_STATE.object;


    if (object) {

        returnObjectToOrigin(
            object
        );

    }


    clearDropHighlight();

}


/* ============================================================
   CANCELAR ARRASTRE
   ============================================================ */

function cancelDrag() {

    const object =
        DRAG_STATE.object;


    if (object) {

        object.dragging =
            false;

        object.selected =
            false;

        object.element.classList.remove(
            "dragging",
            "selected"
        );

        resetObjectTransform(
            object
        );

    }


    clearDragState();

}


/* ============================================================
   LIMPIAR ESTADO
   ============================================================ */

function clearDragState() {

    DRAG_STATE.active =
        false;

    DRAG_STATE.object =
        null;

    DRAG_STATE.pointerId =
        null;

    DRAG_STATE.originalCompartment =
        null;

    DRAG_STATE.originalLayer =
        null;

    DRAG_STATE.originalSlot =
        null;

    DRAG_STATE.originalParent =
        null;

}


/* ============================================================
   BUSCAR HUECO DE DESTINO
   ============================================================ */

function findDropTarget(
    x,
    y,
    object
) {

    if (!object) {
        return null;
    }


    let bestTarget =
        null;


    let bestDistance =
        Infinity;


    GAME_MODEL.compartments
        .forEach(
            compartment => {

                /*
                 * Un estante bloqueado no puede
                 * recibir objetos.
                 */

                if (
                    compartment.locked
                ) {
                    return;
                }


                /*
                 * Solo trabajamos con la capa
                 * frontal del estante.
                 */

                const layer =
                    compartment.activeLayer();


                /*
                 * Si el estante no tiene capa,
                 * todavía no es un destino válido.
                 */

                if (!layer) {
                    return;
                }


                const cells =
                    compartment.element
                        .querySelectorAll(
                            ".cell"
                        );


                cells.forEach(
                    (
                        cell,
                        slot
                    ) => {

                        /*
                         * Un hueco ocupado no es destino.
                         *
                         * EXCEPCIÓN:
                         * si es el mismo hueco de origen,
                         * se ignora.
                         */

                        const occupied =
                            layer.get(
                                slot
                            );


                        if (
                            occupied &&
                            occupied !== object
                        ) {

                            return;

                        }


                        const rect =
                            cell.getBoundingClientRect();


                        const centerX =
                            rect.left +
                            rect.width / 2;


                        const centerY =
                            rect.top +
                            rect.height / 2;


                        const dx =
                            x -
                            centerX;


                        const dy =
                            y -
                            centerY;


                        const distance =
                            Math.sqrt(
                                dx * dx +
                                dy * dy
                            );


                        /*
                         * Radio de aceptación.
                         *
                         * Se basa en el tamaño del hueco.
                         */

                        const radius =
                            Math.min(
                                rect.width,
                                rect.height
                            ) *
                            CONFIG.TOLERANCIA_DROP;


                        if (
                            distance <= radius &&
                            distance < bestDistance
                        ) {

                            bestDistance =
                                distance;


                            bestTarget = {

                                compartment:
                                    compartment,

                                layer:
                                    layer,

                                slot:
                                    slot,

                                cell:
                                    cell,

                                distance:
                                    distance

                            };

                        }

                    }
                );

            }
        );


    return bestTarget;

}


/* ============================================================
   COMPROBAR SI SE PUEDE COLOCAR
   ============================================================ */

function canDropObject(
    object,
    target
) {

    if (
        !object ||
        !target
    ) {
        return false;
    }


    const compartment =
        target.compartment;


    const layer =
        target.layer;


    /*
     * Estante bloqueado.
     */

    if (
        compartment.locked
    ) {
        return false;
    }


    /*
     * Solo capa frontal.
     */

    if (
        compartment.activeLayer() !==
        layer
    ) {
        return false;
    }


    /*
     * El hueco debe estar libre.
     */

    const current =
        layer.get(
            target.slot
        );


    if (
        current &&
        current !== object
    ) {
        return false;
    }


    return true;

}


/* ============================================================
   COMPLETAR DROP
   ============================================================ */

function completeDrop(
    object,
    target
) {

    const oldCompartment =
        DRAG_STATE.originalCompartment;


    const oldLayer =
        DRAG_STATE.originalLayer;


    const oldSlot =
        DRAG_STATE.originalSlot;


    /*
     * Si realmente no hemos cambiado de posición,
     * simplemente volvemos a colocar visualmente
     * el objeto.
     */

    if (
        oldCompartment ===
            target.compartment &&
        oldLayer ===
            target.layer &&
        oldSlot ===
            target.slot
    ) {

        finishDragVisual(
            object
        );

        clearDragState();

        return;

    }


    /*
     * Quitamos el objeto de su posición lógica.
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
     * Lo colocamos en el nuevo hueco.
     */

    const success =
        target.layer.addTo(
            target.slot,
            object
        );


    if (!success) {

        /*
         * Si algo falla, restauramos
         * la posición original.
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


        returnObjectToOrigin(
            object
        );

        return;

    }


    /*
     * Actualizamos la posición lógica.
     */

    object.compartment =
        target.compartment;


    object.layer =
        target.layer;


    object.slot =
        target.slot;


    /*
     * Renderizamos en el nuevo hueco.
     */

    renderObject(
        object
    );


    finishDragVisual(
        object
    );


    clearDragState();


    /*
     * IMPORTANTE:
     * Mover un objeto NO produce sonido.
     */


    /*
     * Comprobamos si acabamos de formar
     * un trío.
     */

    checkForTriple(
        target.compartment,
        target.layer
    );


    /*
     * Actualizamos visualmente las capas.
     */

    refreshBoardUI();

}


/* ============================================================
   FINALIZAR PARTE VISUAL DEL ARRASTRE
   ============================================================ */

function finishDragVisual(
    object
) {

    if (
        !object ||
        !object.element
    ) {
        return;
    }


    object.dragging =
        false;


    object.selected =
        false;


    object.element.classList.remove(
        "dragging",
        "selected"
    );


    object.element.style.pointerEvents =
        "";


    resetObjectTransform(
        object
    );

}


/* ============================================================
   DEVOLVER OBJETO A SU ORIGEN
   ============================================================ */

function returnObjectToOrigin(
    object
) {

    if (
        !object ||
        !object.element
    ) {
        clearDragState();

        return;

    }


    object.element.classList.remove(
        "dragging"
    );


    object.element.classList.add(
        "returning"
    );


    object.element.style.pointerEvents =
        "none";


    resetObjectTransform(
        object
    );


    setTimeout(
        () => {

            if (
                object.element
            ) {

                object.element.classList.remove(
                    "returning",
                    "selected"
                );


                object.element.style.pointerEvents =
                    "";

            }

        },
        CONFIG.DURACION_REGRESO
    );


    object.dragging =
        false;


    object.selected =
        false;


    clearDragState();

}


/* ============================================================
   RESET TRANSFORM
   ============================================================ */

function resetObjectTransform(
    object
) {

    if (
        !object ||
        !object.element
    ) {
        return;
    }


    object.element.style.setProperty(
        "--dx",
        "0px"
    );


    object.element.style.setProperty(
        "--drag-y",
        "0px"
    );


    object.element.style.zIndex =
        "";


}


/* ============================================================
   DESTACAR POSIBLE DESTINO
   ============================================================ */

let currentDropCell =
    null;


function highlightDropTarget(
    x,
    y
) {

    const object =
        DRAG_STATE.object;


    if (!object) {
        return;
    }


    const target =
        findDropTarget(
            x,
            y,
            object
        );


    clearDropHighlight();


    if (
        !target
    ) {
        return;
    }


    currentDropCell =
        target.cell;


    currentDropCell.classList.add(
        "dropTarget"
    );

}


/* ============================================================
   QUITAR DESTACADO
   ============================================================ */

function clearDropHighlight() {

    if (
        currentDropCell
    ) {

        currentDropCell.classList.remove(
            "dropTarget"
        );

    }


    currentDropCell =
        null;

}


/* ============================================================
   COMPROBAR TRÍO
   ============================================================ */

function checkForTriple(
    compartment,
    layer
) {

    if (
        !compartment ||
        !layer
    ) {
        return false;
    }


    /*
     * Si la capa ya no es frontal,
     * no puede formar un trío.
     */

    if (
        compartment.activeLayer() !==
        layer
    ) {
        return false;
    }


    if (
        !layer.isTriple()
    ) {
        return false;
    }


    const triple =
        layer.getTriple();


    if (
        triple.length !== 3
    ) {
        return false;
    }


    /*
     * Registrar el trío antes de eliminarlo.
     */

    const combo =
        GAME_MODEL.registerTriple();


    /*
     * Registrar progreso de desbloqueo
     * en los estantes.
     */

    GAME_MODEL.compartments
        .forEach(
            shelf => {

                if (
                    shelf.locked
                ) {

                    const unlocked =
                        shelf.registerTriple();


                    if (
                        unlocked
                    ) {

                        animateUnlock(
                            shelf
                        );

                        playUnlockSound();

                    }

                }

            }
        );


    /*
     * Recompensa.
     */

    const multiplier =
        CONFIG.MULTIPLICADOR_COMBO
            ? Math.max(
                1,
                combo
            )
            : 1;


    const reward =
        CONFIG.MONEDAS_TRIO *
        multiplier;


    const points =
        CONFIG.PUNTOS_TRIO *
        multiplier;


    GAME_MODEL.coins +=
        reward;


    GAME_MODEL.score +=
        points;


    /*
     * Efectos.
     */

    animateTripleRemoval(
        triple
    );


    if (
        combo >= 2
    ) {

        playComboSound(
            combo
        );

    }

    else {

        playTripleSound();

    }


    updateAfterTriple(
        combo,
        reward
    );


    /*
     * Eliminamos los objetos.
     */

    removeTripleObjects(
        triple
    );


    /*
     * Esperamos a que termine la animación
     * antes de avanzar la capa.
     */

    setTimeout(
        () => {

            advanceAfterTriple(
                compartment
            );

        },
        CONFIG.DURACION_ELIMINACION
    );


    return true;

}


/* ============================================================
   AVANZAR CAPA DESPUÉS DE UN TRÍO
   ============================================================ */

function advanceAfterTriple(
    compartment
) {

    if (!compartment) {
        return;
    }


    /*
     * activeLayer() elimina las capas vacías
     * de la parte frontal.
     */

    const previousLayer =
        compartment.layers[0];


    /*
     * Eliminar visualmente objetos que
     * ya no forman parte del modelo.
     */

    GAME_MODEL
        .activeObjects()
        .forEach(
            object => {

                if (
                    object.compartment ===
                    compartment
                ) {

                    renderObject(
                        object
                    );

                }

            }
        );


    /*
     * Provocar avance lógico.
     */

    compartment.activeLayer();


    /*
     * Animación de aparición de la
     * nueva capa frontal.
     */

    animateLayerAdvance(
        compartment
    );


    /*
     * Actualizar todos los objetos.
     */

    refreshBoardUI();


    /*
     * Comprobar si el estante ha quedado vacío.
     */

    if (
        compartment.isEmpty()
    ) {

        handleEmptyCompartment(
            compartment
        );

    }


    /*
     * Comprobar victoria.
     */

    if (
        !GAME_MODEL.hasObjects()
    ) {

        if (
            typeof winLevel ===
            "function"
        ) {

            winLevel();

        }

    }

}


/* ============================================================
   ESTANTE VACÍO
   ============================================================ */

function handleEmptyCompartment(
    compartment
) {

    if (
        !compartment ||
        !compartment.element
    ) {
        return;
    }


    /*
     * Pequeño efecto visual.
     */

    compartment.element.classList.add(
        "emptyShelf"
    );


    setTimeout(
        () => {

            if (
                compartment.element
            ) {

                compartment.element.classList.remove(
                    "emptyShelf"
                );

            }

        },
        300
    );

}


/* ============================================================
   BLOQUEAR SCROLL DURANTE ARRASTRE
   ============================================================ */

function preventScrollDuringDrag(
    event
) {

    if (
        DRAG_STATE.active
    ) {

        event.preventDefault();

    }

}


/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initInteraction();

    }
);