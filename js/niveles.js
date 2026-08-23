/* ============================================================
   OBJETINOS CONTRARELOJ
   GENERADOR DE NIVELES
   ============================================================ */


/* ============================================================
   ESTADO DEL GENERADOR
   ============================================================ */

const LEVEL_STATE = {

    currentConfig: null,

    scenario: "supermarket"

};


/* ============================================================
   OBTENER CONFIGURACIÓN DEL NIVEL
   ============================================================ */

function getLevelConfig(
    level
) {

    /*
     * Si existe una configuración explícita,
     * la utilizamos.
     */

    const exact =
        CONFIG_NIVELES.find(
            config =>
                config.nivel === level
        );


    if (exact) {

        return {
            ...exact
        };

    }


    /*
     * Para niveles superiores generamos
     * una configuración progresiva.
     */

    const extra =
        Math.max(
            0,
            level - 7
        );


    return {

        nivel: level,

        capas:
            Math.min(
                5,
                3 +
                Math.floor(
                    extra / 3
                )
            ),

        estantes:
            Math.min(
                12,
                10 +
                Math.floor(
                    extra / 2
                )
            ),

        estantesBloqueados:
            Math.min(
                4,
                Math.floor(
                    extra / 3
                )
            ),

        desbloqueoTrio:
            Math.min(
                6,
                4 +
                Math.floor(
                    extra / 3
                )
            ),

        tiempo:
            Math.min(
                90,
                45 +
                Math.floor(
                    extra / 2
                )
            )

    };

}


/* ============================================================
   ELEGIR ESCENARIO
   ============================================================ */

function chooseScenario(
    level
) {

    const index =
        (
            level - 1
        ) %
        CONFIG.ESCENARIOS.length;


    return CONFIG.ESCENARIOS[
        index
    ];

}


/* ============================================================
   PREPARAR TABLERO HTML
   ============================================================ */

function prepareBoardElements(
    numberOfCompartments
) {

    const cabinets =
        document.getElementById(
            "cabinets"
        );


    if (!cabinets) {
        return [];
    }


    cabinets.innerHTML =
        "";


    /*
     * Tres columnas visuales.
     */

    const columns = [

        document.createElement(
            "section"
        ),

        document.createElement(
            "section"
        ),

        document.createElement(
            "section"
        )

    ];


    columns.forEach(
        (
            column,
            index
        ) => {

            column.className =
                "cabinet";


            if (
                index === 0
            ) {

                column.classList.add(
                    "left"
                );

            }


            if (
                index === 1
            ) {

                column.classList.add(
                    "center"
                );

            }


            if (
                index === 2
            ) {

                column.classList.add(
                    "right"
                );

            }


            cabinets.appendChild(
                column
            );

        }
    );


    /*
     * Distribuimos los estantes entre
     * las tres columnas.
     */

    const elements = [];


    for (
        let i = 0;
        i < numberOfCompartments;
        i++
    ) {

        const columnIndex =
            i % 3;


        const compartment =
            createCompartmentElement();


        columns[
            columnIndex
        ].appendChild(
            compartment
        );


        elements.push(
            compartment
        );

    }


    return elements;

}


/* ============================================================
   CREAR ELEMENTO DE ESTANTE
   ============================================================ */

function createCompartmentElement() {

    const compartment =
        document.createElement(
            "div"
        );


    compartment.className =
        "compartment";


    const slotgrid =
        document.createElement(
            "div"
        );


    slotgrid.className =
        "slotgrid";


    for (
        let i = 0;
        i < CONFIG.HUECOS_POR_ESTANTE;
        i++
    ) {

        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "cell";


        cell.dataset.pos =
            i;


        slotgrid.appendChild(
            cell
        );

    }


    compartment.appendChild(
        slotgrid
    );


    return compartment;

}


/* ============================================================
   CREAR COMPARTMENTS DEL MODELO
   ============================================================ */

function createCompartments(
    elements,
    levelConfig
) {

    const compartments = [];


    elements.forEach(
        (
            element,
            index
        ) => {

            const compartment =
                new Compartment(
                    element
                );


            /*
             * Crear las capas.
             */

            for (
                let layerIndex = 0;
                layerIndex <
                levelConfig.capas;
                layerIndex++
            ) {

                compartment.addLayer();

            }


            /*
             * Bloqueos.
             */

            if (
                index <
                levelConfig.estantesBloqueados
            ) {

                compartment.lock(
                    levelConfig.desbloqueoTrio ||
                    2
                );

            }


            GAME_MODEL.addCompartment(
                compartment
            );


            compartments.push(
                compartment
            );


            compartment.updateLockedVisual();

        }
    );


    return compartments;

}


/* ============================================================
   GENERAR TIPOS DE OBJETOS
   ============================================================ */

/**
 * Crea una distribución solucionable.
 *
 * La regla fundamental es:
 *
 *     cada tipo aparece en grupos de 3
 *
 * evitando que un mismo objeto pertenezca
 * a varios tríos simultáneamente.
 */

function generateObjectTypes(
    totalObjects
) {

    const types = [];


    /*
     * El número total debe ser múltiplo de 3.
     */

    const groups =
        Math.floor(
            totalObjects / 3
        );


    /*
     * Generamos una lista de tipos.
     *
     * Cada grupo representa exactamente
     * un trío.
     */

    for (
        let i = 0;
        i < groups;
        i++
    ) {

        const type =
            TIPOS_OBJETOS[
                i %
                TIPOS_OBJETOS.length
            ];


        types.push(
            type.id,
            type.id,
            type.id
        );

    }


    /*
     * Mezcla Fisher-Yates.
     */

    shuffleArray(
        types
    );


    return types;

}


/* ============================================================
   SHUFFLE
   ============================================================ */

function shuffleArray(
    array
) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];

    }


    return array;

}


/* ============================================================
   CONTAR HUECOS
   ============================================================ */

function countAvailableSlots(
    compartments
) {

    let total = 0;


    compartments.forEach(
        compartment => {

            /*
             * El estante bloqueado inicialmente
             * no recibe objetos.
             */

            if (
                compartment.locked
            ) {
                return;
            }


            total +=
                compartment.layers.length *
                CONFIG.HUECOS_POR_ESTANTE;

        }
    );


    return total;

}


/* ============================================================
   CREAR OBJETOS DEL NIVEL
   ============================================================ */

function populateLevel(
    compartments,
    levelConfig
) {

    /*
     * Determinamos cuántos huecos están
     * realmente disponibles.
     */

    const availableSlots =
        countAvailableSlots(
            compartments
        );


    /*
     * Siempre trabajamos con múltiplos
     * de tres para garantizar tríos.
     */

    const usableSlots =
        Math.floor(
            availableSlots / 3
        ) * 3;


    if (
        usableSlots <= 0
    ) {

        return;

    }


    const types =
        generateObjectTypes(
            usableSlots
        );


    let typeIndex = 0;


    /*
     * Recorremos los estantes.
     */

    compartments.forEach(
        compartment => {

            /*
             * Los bloqueados empiezan vacíos.
             */

            if (
                compartment.locked
            ) {

                return;

            }


            /*
             * Cada capa.

             */

            compartment.layers
                .forEach(
                    layer => {

                        for (
                            let slot = 0;
                            slot <
                            CONFIG.HUECOS_POR_ESTANTE;
                            slot++
                        ) {

                            if (
                                typeIndex >=
                                types.length
                            ) {

                                return;

                            }


                            const object =
                                createAndPlaceObject(
                                    types[
                                        typeIndex
                                    ],
                                    compartment,
                                    layer.index,
                                    slot
                                );


                            if (object) {

                                typeIndex++;

                            }

                        }

                    }
                );

        }
    );


    /*
     * Actualizamos estado visual.
     */

    updateAllObjectStates();

    renderAllObjects();

}


/* ============================================================
   CREAR NIVEL COMPLETO
   ============================================================ */

function generateLevel(
    level
) {

    const levelConfig =
        getLevelConfig(
            level
        );


    LEVEL_STATE.currentConfig =
        levelConfig;


    LEVEL_STATE.scenario =
        levelConfig.escenario ||
        chooseScenario(
            level
        );


    /*
     * Limpiar modelo.
     */

    GAME_MODEL.clear();


    /*
     * Preparar configuración del nivel.
     */

    const elements =
        prepareBoardElements(
            levelConfig.estantes
        );


    /*
     * Crear estantes.
     */

    const compartments =
        createCompartments(
            elements,
            levelConfig
        );


    /*
     * Crear objetos.

     */

    populateLevel(
        compartments,
        levelConfig
    );


    /*
     * Aplicar escenario.

     */

    applyScenario(
        LEVEL_STATE.scenario
    );


    /*
     * Refrescar UI.

     */

    refreshBoardUI();


    return levelConfig;

}


/* ============================================================
   PREPARAR NIVEL
   ============================================================ */

function prepareLevel(
    level
) {

    const config =
        generateLevel(
            level
        );


    GAME_MODEL.level =
        level;


    GAME_MODEL.remainingTime =
        config.tiempo;


    GAME_MODEL.running =
        false;


    GAME_MODEL.gameOver =
        false;


    updateUI();


    return config;

}