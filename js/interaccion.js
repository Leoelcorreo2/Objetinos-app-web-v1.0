/* ============================================================
   OBJETINOS CONTRARELOJ
   INTERACCIÓN
   ============================================================ */

let draggedObject = null;

let dragStartX = 0;

let dragStartY = 0;


/* ============================================================
   INICIALIZAR
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

function handlePointerDown(
    event
) {

    if (
        !GAME_MODEL.running
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
     * Solo podemos mover objetos
     * de la capa frontal.
     */

    if (
        !isObjectFront(
            object
        )
    ) {

        return;
    }


    if (
        object.compartment.locked
    ) {

        return;
    }


    draggedObject =
        object;


    dragStartX =
        event.clientX;


    dragStartY =
        event.clientY;


    object.dragging =
        true;


    element.classList.add(
        "dragging"
    );


    try {

        element.setPointerCapture(
            event.pointerId
        );

    }

    catch (error) {
        /* Algunos navegadores pueden no permitirlo */
    }


    event.preventDefault();
}


/* ============================================================
   POINTER MOVE
   ============================================================ */

function handlePointerMove(
    event
) {

    if (
        !draggedObject ||
        !draggedObject.element
    ) {

        return;
    }


    const dx =
        event.clientX -
        dragStartX;


    const dy =
        event.clientY -
        dragStartY;


    draggedObject.element.style.setProperty(
        "--dx",
        `${dx}px`
    );


    draggedObject.element.style.setProperty(
        "--drag-y",
        `${dy}px`
    );


    event.preventDefault();
}


/* ============================================================
   POINTER UP
   ============================================================ */

function handlePointerUp(
    event
) {

    if (
        !draggedObject
    ) {

        return;
    }


    const object =
        draggedObject;


    draggedObject =
        null;


    object.dragging =
        false;


    if (
        object.element
    ) {

        object.element.classList.remove(
            "dragging"
        );

        object.element.style.removeProperty(
            "--dx"
        );

        object.element.style.removeProperty(
            "--drag-y"
        );
    }


    /*
     * Buscar el hueco bajo el puntero.
     */

    const target =
        document.elementFromPoint(
            event.clientX,
            event.clientY
        );


    const cell =
        target
            ? target.closest(
                ".cell"
            )
            : null;


    if (!cell) {

        animateReturn(
            object
        );

        return;
    }


    const result =
        findCellData(
            cell
        );


    if (!result) {

        animateReturn(
            object
        );

        return;
    }


    moveObjectToCell(
        object,
        result.compartment,
        result.slot
    );
}


/* ============================================================
   DATOS DE HUECO
   ============================================================ */

function findCellData(
    cell
) {

    const compartmentElement =
        cell.closest(
            ".compartment"
        );


    if (
        !compartmentElement
    ) {

        return null;
    }


    const compartment =
        GAME_MODEL
            .compartments
            .find(
                item =>
                    item.element ===
                    compartmentElement
            );


    if (!compartment) {

        return null;
    }


    const cells =
        [
            ...compartmentElement
                .querySelectorAll(
                    ".cell"
                )
        ];


    const slot =
        cells.indexOf(
            cell
        );


    if (
        slot < 0
    ) {

        return null;
    }


    return {
        compartment,
        slot
    };
}


/* ============================================================
   MOVER OBJETO
   ============================================================ */

function moveObjectToCell(
    object,
    targetCompartment,
    targetSlot
) {

    if (
        !object ||
        !targetCompartment
    ) {

        return false;
    }


    if (
        targetCompartment.locked
    ) {

        animateReturn(
            object
        );

        return false;
    }


    /*
     * No permitimos colocar en un hueco ocupado.
     */

    const targetLayer =
        targetCompartment
            .activeLayer()
        ||
        targetCompartment
            .ensureLayer(0);


    if (
        targetLayer.hasObjectAt(
            targetSlot
        )
    ) {

        animateReturn(
            object
        );

        return false;
    }


    /*
     * Guardamos la posición antigua.
     */

    const oldCompartment =
        object.compartment;


    const oldLayer =
        object.layer;


    const oldSlot =
        object.slot;


    /*
     * Si el movimiento es dentro del mismo
     * estante, no permitimos cambiar de
     * hueco si la lógica pudiera generar
     * situaciones extrañas.
     */

    if (
        oldCompartment ===
            targetCompartment
    ) {

        animateReturn(
            object
        );

        return false;
    }


    /*
     * Quitar de la posición antigua.
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
     * Colocar en destino.
     */

    if (
        !targetLayer.addTo(
            targetSlot,
            object
        )
    ) {

        /*
         * Restaurar si falla.
         */

        if (
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


    object.compartment =
        targetCompartment;


    object.layer =
        targetLayer;


    object.slot =
        targetSlot;


    GAME_MODEL.moves++;


    renderAllObjects();


    /*
     * NO emitimos sonido por mover.
     */


    checkForTriple(
        targetCompartment
    );


    return true;
}


/* ============================================================
   COMPROBAR TRÍO
   ============================================================ */

function checkForTriple(
    compartment
) {

    if (!compartment) {

        return;
    }


    const layer =
        compartment.activeLayer();


    if (!layer) {

        return;
    }


    if (
        !layer.isTriple()
    ) {

        return;
    }


    const triple =
        layer.getTriple();


    processTriple(
        compartment,
        triple
    );
}


/* ============================================================
   PROCESAR TRÍO
   ============================================================ */

function processTriple(
    compartment,
    triple
) {

    if (
        !triple ||
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
     * Puntuación.
     */

    const multiplier =
        CONFIG.MULTIPLICADOR_COMBO
            ? Math.max(
                1,
                combo
            )
            : 1;


    GAME_MODEL.score +=
        CONFIG.PUNTOS_TRIO *
        multiplier;


    GAME_MODEL.coins +=
        CONFIG.MONEDAS_TRIO *
        multiplier;


    /*
     * Efectos.
     */

    showTripleEffect(
        triple
    );


    if (
        combo > 1
    ) {

        showCombo(
            combo
        );

        playComboSound(
            combo
        );

    }

    else {

        playTripleSound();
    }


    /*
     * Eliminar.
     */

    removeTripleObjects(
        triple
    );


    /*
     * La capa queda vacía.
     *
     * NO eliminamos la capa del modelo.
     *
     * Simplemente renderizamos de nuevo
     * para que la siguiente capa pueda
     * pasar a ser frontal.
     */

    setTimeout(
        () => {

            renderAllObjects();

            updateInterface();


            /*
             * Comprobar victoria.
             */

            if (
                !GAME_MODEL.hasObjects()
            ) {

                winLevel();
            }

        },
        CONFIG.DURACION_ELIMINACION + 20
    );
}


/* ============================================================
   VOLVER A LA POSICIÓN
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


    object.element.classList.add(
        "returning"
    );


    setTimeout(
        () => {

            if (
                object.element
            ) {

                object.element.classList.remove(
                    "returning"
                );
            }

        },
        CONFIG.DURACION_REGRESO
    );
}