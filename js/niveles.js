/* ============================================================
   OBJETINOS CONTRARELOJ
   GENERADOR DE NIVELES
   V1.4.1
   ============================================================ */


/* ============================================================
   CONFIGURACIÓN DE PRUEBA
   ============================================================ */

/*
 * IMPORTANTE:
 *
 * Para esta fase vamos a trabajar SOLO con una capa.
 *
 * Primero dejamos perfecta la mecánica:
 *
 *       mover
 *       colocar
 *       formar trío
 *       eliminar
 *       liberar huecos
 *
 * Después añadiremos las capas.
 */

const NIVELES_PRUEBA = [

    {
        nivel: 1,
        estantes: 4,
        trios: 3,
        capas: 1,
        tiempo: 30
    },

    {
        nivel: 2,
        estantes: 5,
        trios: 4,
        capas: 1,
        tiempo: 35
    },

    {
        nivel: 3,
        estantes: 6,
        trios: 5,
        capas: 1,
        tiempo: 40
    },

    {
        nivel: 4,
        estantes: 7,
        trios: 6,
        capas: 1,
        tiempo: 45
    },

    {
        nivel: 5,
        estantes: 8,
        trios: 7,
        capas: 1,
        tiempo: 50
    }

];


/* ============================================================
   OBTENER CONFIGURACIÓN
   ============================================================ */

function getLevelConfig(
    nivel
) {

    return (
        NIVELES_PRUEBA.find(
            config =>
                config.nivel === nivel
        )
    ) || NIVELES_PRUEBA[0];

}


/* ============================================================
   OBTENER ESTANTES HTML
   ============================================================ */

function getShelfElements() {

    return Array.from(
        document.querySelectorAll(
            ".compartment"
        )
    );

}


/* ============================================================
   PREPARAR ESTANTES
   ============================================================ */

function prepareShelves(
    number
) {

    const elements =
        getShelfElements();


    elements.forEach(
        (element, index) => {

            element.style.display =
                index < number
                    ? ""
                    : "none";

            element.classList.remove(
                "lockedShelf"
            );

            /*
             * Elimina restos visuales
             * de niveles anteriores.
             */

            element
                .querySelectorAll(
                    ".obj"
                )
                .forEach(
                    obj =>
                        obj.remove()
                );

        }
    );


    return elements.slice(
        0,
        number
    );

}


/* ============================================================
   LIMPIAR MODELO
   ============================================================ */

function clearLevelModel() {

    GAME_MODEL.clear();

}


/* ============================================================
   CREAR ESTANTES DEL MODELO
   ============================================================ */

function createCompartments(
    elements
) {

    elements.forEach(
        element => {

            const compartment =
                new Compartment(
                    element
                );


            /*
             * Cada estante empieza
             * con una capa.
             */

            compartment.ensureLayer(0);


            GAME_MODEL.addCompartment(
                compartment
            );

        }
    );

}


/* ============================================================
   GENERADOR SOLUCIONABLE
   ============================================================

   EJEMPLO NIVEL 1:

   4 estantes
   3 tríos
   9 objetos

   Resultado posible:

   [🍎][🧀][🍞]
   [🧀][🍞][🍎]
   [🍞][🍎][🧀]
   [  ][  ][  ]

   Cada tipo aparece exactamente 3 veces.

   Ningún estante contiene un trío.

   Hay exactamente 3 huecos libres.

   ============================================================ */

function generateSolvableLevel(
    config
) {

    const shelves =
        GAME_MODEL.compartments;


    const shelfCount =
        shelves.length;


    const trioCount =
        config.trios;


    /*
     * Comprobación fundamental:
     *
     * necesitamos al menos un estante
     * adicional para tener espacio de maniobra.
     */

    if (
        shelfCount <= trioCount
    ) {

        throw new Error(
            "Nivel imposible: debe haber " +
            "más estantes que tríos."
        );

    }


    /*
     * Hay 3 objetos por trío.
     */

    const totalObjects =
        trioCount * 3;


    const totalCapacity =
        shelfCount * 3;


    const freeSlots =
        totalCapacity -
        totalObjects;


    /*
     * Los huecos libres deben ser
     * múltiplo de 3.
     */

    if (
        freeSlots % 3 !== 0
    ) {

        throw new Error(
            "Nivel inválido: los huecos " +
            "libres deben ser múltiplo de 3."
        );

    }


    /*
     * Usamos los primeros N tipos
     * de objetos.
     */

    const types =
        TIPOS_OBJETOS.slice(
            0,
            trioCount
        );


    if (
        types.length < trioCount
    ) {

        throw new Error(
            "No hay suficientes tipos de objetos."
        );

    }


    /*
     * Contador de posiciones ocupadas
     * en cada estante.
     */

    const shelfCounts =
        new Array(
            shelfCount
        ).fill(0);


    /*
     * Para cada trío:
     *
     * colocamos sus tres objetos
     * en tres estantes distintos.
     *
     * Usamos una distribución circular.
     */

    for (
        let trio = 0;
        trio < trioCount;
        trio++
    ) {

        const type =
            types[trio];


        for (
            let copy = 0;
            copy < 3;
            copy++
        ) {

            /*
             * Buscamos un estante
             * adecuado.
             */

            let shelfIndex =
                (trio + copy) %
                shelfCount;


            /*
             * Si por alguna combinación
             * el estante ya está lleno,
             * buscamos el siguiente libre.
             */

            let attempts = 0;


            while (
                shelfCounts[shelfIndex] >= 3 &&
                attempts < shelfCount
            ) {

                shelfIndex =
                    (
                        shelfIndex + 1
                    ) %
                    shelfCount;

                attempts++;

            }


            if (
                shelfCounts[shelfIndex] >= 3
            ) {

                throw new Error(
                    "No se ha podido construir " +
                    "el nivel."
                );

            }


            const compartment =
                shelves[shelfIndex];


            const layer =
                compartment.ensureLayer(0);


            const slot =
                layer.firstFreeSlot();


            if (
                slot === -1
            ) {

                throw new Error(
                    "Estante lleno durante " +
                    "la generación."
                );

            }


            const object =
                createGameObject(
                    type.id
                );


            if (!object) {

                throw new Error(
                    "No se pudo crear objeto."
                );

            }


            if (
                !placeObject(
                    object,
                    compartment,
                    0,
                    slot
                )
            ) {

                throw new Error(
                    "No se pudo colocar objeto."
                );

            }


            createObjectElement(
                object
            );


            shelfCounts[
                shelfIndex
            ]++;

        }

    }


    /*
     * VALIDACIÓN FINAL
     */

    validateGeneratedLevel(
        config
    );

}


/* ============================================================
   VALIDAR NIVEL
   ============================================================ */

function validateGeneratedLevel(
    config
) {

    const objects =
        GAME_MODEL.activeObjects();


    const expected =
        config.trios * 3;


    if (
        objects.length !== expected
    ) {

        throw new Error(
            "Número incorrecto de objetos."
        );

    }


    /*
     * Comprobar que cada tipo
     * aparece exactamente 3 veces.
     */

    const counts = {};


    objects.forEach(
        object => {

            counts[object.trioKey] =
                (
                    counts[object.trioKey] ||
                    0
                ) + 1;

        }
    );


    Object.keys(counts)
        .forEach(
            key => {

                if (
                    counts[key] !== 3
                ) {

                    throw new Error(
                        "El tipo " +
                        key +
                        " no aparece exactamente 3 veces."
                    );

                }

            }
        );


    /*
     * Comprobar que NINGÚN estante
     * empieza con un trío.
     */

    GAME_MODEL.compartments
        .forEach(
            compartment => {

                const layer =
                    compartment.activeLayer();


                if (
                    layer &&
                    layer.isTriple()
                ) {

                    throw new Error(
                        "ERROR GRAVE: se ha generado " +
                        "un trío completo en un estante."
                    );

                }

            }
        );


    /*
     * Comprobar que hay huecos libres.
     */

    const capacity =
        GAME_MODEL.compartments.length *
        3;


    const free =
        capacity -
        objects.length;


    if (
        free <= 0
    ) {

        throw new Error(
            "ERROR: el nivel no tiene huecos libres."
        );

    }


    if (
        free % 3 !== 0
    ) {

        throw new Error(
            "ERROR: número de huecos libres inválido."
        );

    }


    console.log(
        "Nivel válido:",
        {
            nivel: config.nivel,
            estantes:
                GAME_MODEL.compartments.length,
            objetos:
                objects.length,
            trios:
                config.trios,
            huecosLibres:
                free
        }
    );

}


/* ============================================================
   RENDERIZAR NIVEL
   ============================================================ */

function renderLevel() {

    GAME_MODEL.activeObjects()
        .forEach(
            object => {

                renderObject(
                    object
                );

            }
        );


    updateAllObjectStates();

}


/* ============================================================
   GENERAR NIVEL COMPLETO
   ============================================================ */

function generateLevel(
    nivel
) {

    const config =
        getLevelConfig(
            nivel
        );


    clearLevelModel();


    const shelfElements =
        prepareShelves(
            config.estantes
        );


    createCompartments(
        shelfElements
    );


    generateSolvableLevel(
        config
    );


    renderLevel();


    GAME_MODEL.level =
        config.nivel;


    GAME_MODEL.remainingTime =
        config.tiempo;


    return config;

}