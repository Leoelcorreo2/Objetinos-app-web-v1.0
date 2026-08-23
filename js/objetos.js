/* ============================================================
   OBJETINOS CONTRARELOJ
   OBJETOS
   ============================================================ */


/* ============================================================
   OBTENER TIPO DE OBJETO
   ============================================================ */

function getObjectType(typeId) {

    return TIPOS_OBJETOS.find(
        type =>
            type.id === typeId
    );

}


/* ============================================================
   CREAR GAME OBJECT
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
   CREAR OBJETO ALEATORIO
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
   COLOCAR OBJETO EN UNA CAPA
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
   QUITAR OBJETO DE SU POSICIÓN
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
   ENCONTRAR OBJETO
   ============================================================ */

function findObject(
    object
) {

    if (!object) {

        return null;

    }


    return GAME_MODEL
        .activeObjects()
        .find(
            item =>
                item === object ||
                item.id === object.id
        ) || null;

}


/* ============================================================
   OBTENER OBJETO DESDE ELEMENTO HTML
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

    if (!object) {

        return null;

    }


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

        <span>
            ${object.emoji}
        </span>

        <small>
            ${object.nombre}
        </small>

    `;


    object.element =
        element;


    return element;

}


/* ============================================================
   DETERMINAR SI UN OBJETO ES FRONTAL
   ============================================================ */

function isObjectFront(
    object
) {

    if (
        !object ||
        !object.compartment
    ) {

        return false;

    }


    const activeLayer =
        object.compartment
            .activeLayer();


    if (!activeLayer) {

        return false;

    }


    return (
        object.layer ===
        activeLayer
    );

}


/* ============================================================
   ACTUALIZAR CLASE VISUAL DEL OBJETO
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


    const element =
        object.element;


    element.classList.remove(
        "front",
        "back"
    );


    if (
        isObjectFront(object)
    ) {

        element.classList.add(
            "front"
        );

        element.style.pointerEvents =
            object.compartment.locked
                ? "none"
                : "auto";

    }

    else {

        element.classList.add(
            "back"
        );

        element.style.pointerEvents =
            "none";

    }

}


/* ============================================================
   ACTUALIZAR TODOS LOS OBJETOS
   ============================================================ */

function updateAllObjectStates() {

    GAME_MODEL
        .activeObjects()
        .forEach(
            object => {

                updateObjectVisualState(
                    object
                );

            }
        );

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
        !object.compartment
    ) {

        return;

    }


    const compartment =
        object.compartment;


    const element =
        object.element;


    const cells =
        compartment.element
            .querySelectorAll(
                ".cell"
            );


    if (
        !cells ||
        !cells[object.slot]
    ) {

        return;

    }


    const cell =
        cells[object.slot];


    if (
        element.parentElement !== cell
    ) {

        cell.appendChild(
            element
        );

    }


    /* --------------------------------------------------------
       CAPA
       -------------------------------------------------------- */

    const layerIndex =
        object.layer
            ? object.layer.index
            : 0;


    /* --------------------------------------------------------
       PROFUNDIDAD VISUAL
       -------------------------------------------------------- */

    const isFront =
        isObjectFront(
            object
        );


    element.style.setProperty(
        "--z",
        isFront
            ? 20
            : 10 - layerIndex
    );


    /* --------------------------------------------------------
       ALTURA
       --------------------------------------------------------

       Las capas posteriores se ven ligeramente
       por encima/por detrás.

       -------------------------------------------------------- */

    const bottom =
        isFront
            ? 4
            : 8 + (
                layerIndex * 8
            );


    element.style.setProperty(
        "--bottom",
        `${bottom}px`
    );


    /* --------------------------------------------------------
       ESCALA
       -------------------------------------------------------- */

    element.style.setProperty(
        "--scale",
        isFront
            ? 1
            : .88
    );


    updateObjectVisualState(
        object
    );

}


/* ============================================================
   RENDERIZAR TODOS LOS OBJETOS
   ============================================================ */

function renderAllObjects() {

    GAME_MODEL
        .activeObjects()
        .forEach(
            object => {

                renderObject(
                    object
                );

            }
        );

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


    object.element
        .classList
        .remove(
            "spawn"
        );


    // Forzar reflow para que la animación
    // se pueda repetir.

    void object.element.offsetWidth;


    object.element
        .classList
        .add(
            "spawn"
        );


    setTimeout(
        () => {

            if (
                object.element
            ) {

                object.element
                    .classList
                    .remove(
                        "spawn"
                    );

            }

        },

        CONFIG.DURACION_SPAWN
    );

}


/* ============================================================
   CREAR Y COLOCAR OBJETO
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

        object.removed =
            true;

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
   ELIMINAR OBJETO LÓGICAMENTE
   ============================================================ */

function markObjectRemoved(
    object
) {

    if (!object) {

        return;

    }


    object.removed =
        true;


    if (object.element) {

        object.element
            .classList
            .add(
                "removing"
            );

    }


    removeObjectFromBoard(
        object
    );

}


/* ============================================================
   ELIMINAR TRÍO LÓGICAMENTE
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
        object => {

            markObjectRemoved(
                object
            );

        }
    );


    setTimeout(
        () => {

            objects.forEach(
                object => {

                    if (
                        object.element
                    ) {

                        object.element
                            .remove();

                    }

                }
            );

        },

        CONFIG.DURACION_ELIMINACION
    );

}


/* ============================================================
   OBTENER LOS OBJETOS DE LA CAPA FRONTAL
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