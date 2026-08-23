/* ============================================================
   OBJETINOS CONTRARELOJ
   OBJETOS
   ============================================================ */


function getObjectType(typeId) {

    return TIPOS_OBJETOS.find(
        type =>
            type.id === typeId
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
            "Tipo de objeto inexistente:",
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
   OBJETO ALEATORIO
   ============================================================ */

function createRandomObject() {

    const index =
        Math.floor(
            Math.random() *
            TIPOS_OBJETOS.length
        );


    return createGameObject(
        TIPOS_OBJETOS[index].id
    );
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


    if (
        compartment.locked
    ) {

        return false;
    }


    const layer =
        compartment.ensureLayer(
            layerIndex
        );


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
   OBTENER OBJETO DESDE ELEMENTO
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


    return GAME_MODEL
        .activeObjects()
        .find(
            object =>
                object.id === id
        ) || null;
}


/* ============================================================
   CREAR ELEMENTO VISUAL
   ============================================================ */

function createObjectElement(
    object
) {

    const element =
        document.createElement(
            "div"
        );


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
   ¿ES OBJETO DE LA CAPA FRONTAL?
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
        isObjectFront(
            object
        );


    object.element.classList.toggle(
        "front",
        front
    );


    object.element.classList.toggle(
        "back",
        !front
    );


    if (
        front &&
        !object.compartment.locked
    ) {

        object.element.style.pointerEvents =
            "auto";
    }

    else {

        object.element.style.pointerEvents =
            "none";
    }
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
        object.slot === null
    ) {

        return;
    }


    const cells =
        object.compartment.element
            .querySelectorAll(
                ".cell"
            );


    const cell =
        cells[object.slot];


    if (!cell) {

        return;
    }


    if (
        object.element.parentElement !== cell
    ) {

        cell.appendChild(
            object.element
        );
    }


    const front =
        isObjectFront(
            object
        );


    const layerIndex =
        object.layer
            ? object.layer.index
            : 0;


    object.element.style.setProperty(
        "--z",
        front
            ? 50
            : 10 - layerIndex
    );


    object.element.style.setProperty(
        "--bottom",
        front
            ? "4px"
            : `${8 + layerIndex * 8}px`
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

    GAME_MODEL
        .activeObjects()
        .forEach(
            object =>
                renderObject(object)
        );
}


/* ============================================================
   CREAR Y COLOCAR
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


    if (
        !placeObject(
            object,
            compartment,
            layerIndex,
            slot
        )
    ) {

        object.removed = true;

        return null;
    }


    createObjectElement(
        object
    );


    renderObject(
        object
    );


    animateObjectSpawn(
        object
    );


    return object;
}


/* ============================================================
   ANIMACIÓN DE APARICIÓN
   ============================================================ */

function animateObjectSpawn(
    object
) {

    if (
        !object ||
        !object.element
    ) {

        return;
    }


    object.element.classList.remove(
        "spawn"
    );


    void object.element.offsetWidth;


    object.element.classList.add(
        "spawn"
    );


    setTimeout(
        () => {

            if (
                object.element
            ) {

                object.element.classList.remove(
                    "spawn"
                );
            }

        },
        CONFIG.DURACION_SPAWN
    );
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


    if (object.element) {

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

        },
        CONFIG.DURACION_ELIMINACION
    );
}


/* ============================================================
   OBJETOS DE LA CAPA FRONTAL
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