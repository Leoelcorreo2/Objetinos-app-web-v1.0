/* ============================================================
   OBJETINOS CONTRARELOJ
   OBJETOS
   ============================================================ */


/* ============================================================
   OBTENER TIPO
   ============================================================ */

function getObjectType(typeId) {

    return TIPOS_OBJETOS.find(
        tipo =>
            tipo.id === typeId
    );

}


/* ============================================================
   CREAR OBJETO
   ============================================================ */

function createGameObject(typeId) {

    const tipo =
        getObjectType(typeId);


    if (!tipo) {

        console.error(
            "Tipo de objeto no encontrado:",
            typeId
        );

        return null;

    }


    const object =
        new GameObject(tipo);


    GAME_MODEL.addObject(
        object
    );


    return object;

}


/* ============================================================
   COLOCAR OBJETO
   ============================================================ */

function placeObject(
    object,
    compartment,
    layerIndex,
    slot
) {

    if (
        !object ||
        !compartment
    ) {

        return false;

    }


    /*
     * Un estante bloqueado no admite objetos.
     */

    if (
        compartment.locked
    ) {

        return false;

    }


    const layer =
        compartment.ensureLayer(
            layerIndex
        );


    /*
     * IMPORTANTE:
     * el slot debe estar libre.
     */

    if (
        !layer.addTo(
            slot,
            object
        )
    ) {

        return false;

    }


    object.compartment =
        compartment;

    object.layer =
        layer;

    object.slot =
        slot;


    return true;

}


/* ============================================================
   COLOCAR EN PRIMER HUECO LIBRE
   ============================================================ */

function placeObjectFirstFree(
    object,
    compartment,
    layerIndex = 0
) {

    if (
        !object ||
        !compartment
    ) {

        return false;

    }


    if (
        compartment.locked
    ) {

        return false;

    }


    const layer =
        compartment.ensureLayer(
            layerIndex
        );


    const slot =
        layer.firstFreeSlot();


    if (
        slot === -1
    ) {

        return false;

    }


    return placeObject(
        object,
        compartment,
        layerIndex,
        slot
    );

}


/* ============================================================
   QUITAR OBJETO
   ============================================================ */

function removeObjectFromBoard(
    object
) {

    if (!object) {

        return null;

    }


    if (
        object.layer &&
        object.slot !== null
    ) {

        object.layer.removeFrom(
            object.slot
        );

    }


    object.compartment = null;

    object.layer = null;

    object.slot = null;


    return object;

}


/* ============================================================
   ELEMENTO HTML
   ============================================================ */

function createObjectElement(
    object
) {

    if (!object) {

        return null;

    }


    const element =
        document.createElement("div");


    element.className =
        "obj";


    element.dataset.objectId =
        object.id;


    element.dataset.type =
        object.type;


    element.innerHTML = `
        <span>${object.emoji}</span>
        <small>${object.nombre}</small>
    `;


    object.element =
        element;


    return element;

}


/* ============================================================
   OBJETO DESDE HTML
   ============================================================ */

function objectFromElement(
    element
) {

    if (!element) {

        return null;

    }


    const id =
        element.dataset.objectId;


    if (!id) {

        return null;

    }


    return GAME_MODEL.objects.find(
        object =>
            object.id === id &&
            !object.removed
    ) || null;

}


/* ============================================================
   ¿ES CAPA FRONTAL?
   ============================================================ */

function isObjectFront(
    object
) {

    if (
        !object ||
        !object.compartment ||
        !object.layer
    ) {

        return false;

    }


    return (
        object.compartment
            .activeLayer() ===
        object.layer
    );

}


/* ============================================================
   ACTUALIZAR ESTADO VISUAL
   ============================================================ */

function updateObjectVisualState(
    object
) {

    if (
        !object ||
        !object.element
    ) {

        return;

    }


    const front =
        isObjectFront(object);


    object.element.classList.toggle(
        "back",
        !front
    );


    object.element.style.pointerEvents =
        front &&
        !object.compartment.locked
            ? "auto"
            : "none";

}


/* ============================================================
   RENDERIZAR OBJETO
   ============================================================ */

function renderObject(
    object
) {

    if (
        !object ||
        !object.element ||
        !object.compartment ||
        !object.layer
    ) {

        return;

    }


    const cells =
        object.compartment.element
            .querySelectorAll(".cell");


    if (
        cells.length < 3
    ) {

        console.error(
            "El estante no tiene 3 huecos."
        );

        return;

    }


    /*
     * MUY IMPORTANTE:
     *
     * object.slot es SIEMPRE 0, 1 o 2.
     *
     * No utilizamos una posición global.
     */

    const cell =
        cells[object.slot];


    if (!cell) {

        return;

    }


    /*
     * El objeto debe estar dentro
     * del hueco correspondiente.
     */

    if (
        object.element.parentElement !== cell
    ) {

        cell.appendChild(
            object.element
        );

    }


    const front =
        isObjectFront(object);


    object.element.style.setProperty(
        "--z",
        front ? 30 : 10
    );


    object.element.style.setProperty(
        "--bottom",
        front
            ? "4px"
            : "12px"
    );


    object.element.style.setProperty(
        "--scale",
        front
            ? "1"
            : ".88"
    );


    updateObjectVisualState(
        object
    );

}


/* ============================================================
   RENDERIZAR TODO
   ============================================================ */

function renderAllObjects() {

    GAME_MODEL.activeObjects()
        .forEach(
            object =>
                renderObject(object)
        );

}


/* ============================================================
   ACTUALIZAR CAPAS
   ============================================================ */

function updateAllObjectStates() {

    GAME_MODEL.activeObjects()
        .forEach(
            object =>
                updateObjectVisualState(
                    object
                )
        );

}


/* ============================================================
   CREAR + COLOCAR
   ============================================================ */

function createAndPlaceObject(
    typeId,
    compartment,
    layerIndex,
    slot
) {

    const object =
        createGameObject(
            typeId
        );


    if (!object) {

        return null;

    }


    const placed =
        placeObject(
            object,
            compartment,
            layerIndex,
            slot
        );


    if (!placed) {

        object.removed = true;

        return null;

    }


    createObjectElement(
        object
    );


    renderObject(
        object
    );


    if (
        typeof animateObjectSpawn ===
        "function"
    ) {

        animateObjectSpawn(
            object
        );

    }


    return object;

}


/* ============================================================
   ELIMINAR OBJETO
   ============================================================ */

function markObjectRemoved(
    object
) {

    if (!object) {

        return;

    }


    object.removed = true;


    if (
        object.element
    ) {

        object.element.classList.add(
            "removing"
        );

    }


    removeObjectFromBoard(
        object
    );

}


/* ============================================================
   ELIMINAR TRÍO
   ============================================================ */

function removeTripleObjects(
    objects
) {

    if (
        !objects ||
        objects.length !== 3
    ) {

        return;

    }


    objects.forEach(
        object =>
            markObjectRemoved(object)
    );


    setTimeout(
        () => {

            objects.forEach(
                object => {

                    if (
                        object.element
                    ) {

                        object.element.remove();

                    }

                }
            );


            /*
             * Al desaparecer objetos,
             * las capas posteriores pasan
             * automáticamente a ser frontales.
             */

            updateAllObjectStates();

            renderAllObjects();

        },

        CONFIG.DURACION_ELIMINACION
    );

}


/* ============================================================
   OBJETOS FRONTALES
   ============================================================ */

function getFrontObjects(
    compartment
) {

    if (!compartment) {

        return [];

    }


    const layer =
        compartment.activeLayer();


    if (!layer) {

        return [];

    }


    return layer.objects();

}