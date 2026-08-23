/* ============================================================
   OBJETINOS CONTRARELOJ
   GENERADOR DE NIVELES
   ============================================================ */


/* ============================================================
   OBTENER CONFIGURACIÓN DEL NIVEL
   ============================================================ */

function getLevelConfig(levelNumber) {

    return (
        CONFIG_NIVELES.find(
            config =>
                config.nivel === levelNumber
        )
        ||
        CONFIG_NIVELES[
            CONFIG_NIVELES.length - 1
        ]
    );
}


/* ============================================================
   GENERAR LISTA DE OBJETOS
   ============================================================ */

function generateTripleList(
    numberOfTriples
) {

    const availableTypes = [
        ...TIPOS_OBJETOS
    ];


    /*
     * Mezclamos los tipos.
     */

    shuffleArray(
        availableTypes
    );


    const result = [];


    for (
        let i = 0;
        i < numberOfTriples;
        i++
    ) {

        const type =
            availableTypes[
                i % availableTypes.length
            ];


        /*
         * Cada tipo aparece EXACTAMENTE
         * tres veces.
         */

        result.push(
            type.id,
            type.id,
            type.id
        );
    }


    return result;
}


/* ============================================================
   MEZCLAR ARRAY
   ============================================================ */

function shuffleArray(array) {

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
        ] =
        [
            array[j],
            array[i]
        ];
    }


    return array;
}


/* ============================================================
   CALCULAR POSICIONES
   ============================================================ */

function calculateBoardCapacity(
    numberOfShelves
) {

    return (
        numberOfShelves *
        CONFIG.HUECOS_POR_ESTANTE
    );
}


/* ============================================================
   VALIDAR CONFIGURACIÓN MATEMÁTICA
   ============================================================ */

function validateLevelNumbers(
    config
) {

    const positions =
        calculateBoardCapacity(
            config.estantes
        );


    const objects =
        config.trios * 3;


    const freeSlots =
        positions - objects;


    console.log(
        `Nivel ${config.nivel}:`,
        {
            estantes: config.estantes,
            posiciones: positions,
            trios: config.trios,
            objetos: objects,
            huecosLibres: freeSlots
        }
    );


    /*
     * No puede haber más objetos
     * que posiciones.
     */

    if (
        objects > positions
    ) {

        return false;
    }


    /*
     * Necesitamos huecos libres.
     */

    if (
        freeSlots <
        CONFIG.MIN_HUECOS_LIBRES_INICIALES
    ) {

        return false;
    }


    /*
     * El número de objetos debe
     * ser múltiplo de 3.
     */

    if (
        objects % 3 !== 0
    ) {

        return false;
    }


    return true;
}


/* ============================================================
   COLOCAR TRÍOS DE FORMA SEGURA
   ============================================================

   La estrategia de esta primera versión es deliberadamente
   conservadora.

   Cada trío se coloca en dos posiciones de un estante
   y una posición de otro.

   Así siempre existe al menos un movimiento inicial que
   permite completar un trío.

   ============================================================ */

function buildSolvableArrangement(
    config
) {

    const positions =
        [];


    /*
     * Crear todas las posiciones.
     */

    for (
        let shelf = 0;
        shelf < config.estantes;
        shelf++
    ) {

        for (
            let slot = 0;
            slot < CONFIG.HUECOS_POR_ESTANTE;
            slot++
        ) {

            positions.push({

                shelf,
                slot,

                object: null
            });
        }
    }


    /*
     * Generamos los tipos.
     */

    const triples =
        generateTripleList(
            config.trios
        );


    /*
     * Para garantizar que el puzzle sea
     * solucionable, primero creamos parejas.
     *
     * Ejemplo:
     *
     * Estante 0:
     * [A][A][B]
     *
     * Estante 1:
     * [A][B][B]
     *
     * Así A y B pueden eliminarse.
     */


    let positionIndex = 0;


    for (
        let i = 0;
        i < triples.length;
        i += 3
    ) {

        const type =
            triples[i];


        /*
         * Buscar un estante con dos posiciones
         * libres consecutivas.
         */

        let pairPositions =
            findTwoFreePositions(
                positions
            );


        if (
            !pairPositions
        ) {

            return null;
        }


        pairPositions[0].object =
            type;

        pairPositions[1].object =
            type;


        /*
         * El tercer objeto se coloca
         * en otra posición libre.
         */

        const third =
            findOneFreePosition(
                positions,
                pairPositions
            );


        if (
            !third
        ) {

            return null;
        }


        third.object =
            type;
    }


    /*
     * Ahora mezclamos físicamente las posiciones.
     *
     * Los huecos permanecen huecos.
     */

    const occupied =
        positions.filter(
            position =>
                position.object !== null
        );


    shuffleArray(
        occupied
    );


    const shuffledObjects =
        occupied.map(
            position =>
                position.object
        );


    for (
        let i = 0;
        i < occupied.length;
        i++
    ) {

        occupied[i].object =
            shuffledObjects[i];
    }


    return positions;
}


/* ============================================================
   BUSCAR DOS POSICIONES LIBRES
   ============================================================ */

function findTwoFreePositions(
    positions
) {

    /*
     * Preferimos dos huecos del mismo estante.
     */

    for (
        let shelf = 0;
        shelf < 100;
        shelf++
    ) {

        const free =
            positions.filter(
                position =>
                    position.shelf === shelf &&
                    position.object === null
            );


        if (
            free.length >= 2
        ) {

            return [
                free[0],
                free[1]
            ];
        }


        /*
         * Si ya no quedan estantes,
         * terminamos.
         */

        if (
            !positions.some(
                position =>
                    position.shelf === shelf
            )
        ) {

            break;
        }
    }


    /*
     * Como alternativa, cualquier dos
     * posiciones libres.
     */

    const free =
        positions.filter(
            position =>
                position.object === null
        );


    if (
        free.length >= 2
    ) {

        return [
            free[0],
            free[1]
        ];
    }


    return null;
}


/* ============================================================
   BUSCAR UNA POSICIÓN LIBRE
   ============================================================ */

function findOneFreePosition(
    positions,
    excluded
) {

    return positions.find(
        position =>
            position.object === null &&
            !excluded.includes(position)
    ) || null;
}


/* ============================================================
   VALIDACIÓN DEL TABLERO
   ============================================================ */

function validateGeneratedBoard(
    positions
) {

    if (!positions) {

        return false;
    }


    const objects =
        positions.filter(
            position =>
                position.object !== null
        );


    const empty =
        positions.filter(
            position =>
                position.object === null
        );


    /*
     * Debe haber huecos.
     */

    if (
        empty.length <
        CONFIG.MIN_HUECOS_LIBRES_INICIALES
    ) {

        return false;
    }


    /*
     * Cada tipo debe aparecer tres veces.
     */

    const counts = {};


    objects.forEach(
        position => {

            const type =
                position.object;


            counts[type] =
                (counts[type] || 0) + 1;
        }
    );


    for (
        const type in counts
    ) {

        if (
            counts[type] % 3 !== 0
        ) {

            return false;
        }
    }


    /*
     * Debe existir al menos una pareja
     * que permita iniciar una eliminación.
     */

    const hasPair =
        positions.some(
            position => {

                if (
                    position.object === null
                ) {

                    return false;
                }


                const shelf =
                    position.shelf;


                const same =
                    positions.filter(
                        other =>
                            other.shelf === shelf &&
                            other.object ===
                                position.object
                    );


                return same.length >= 2;
            }
        );


    if (!hasPair) {

        return false;
    }


    return true;
}


/* ============================================================
   CREAR ESTANTES HTML
   ============================================================ */

function createCompartments(
    number
) {

    const cabinets =
        document.querySelectorAll(
            ".cabinet"
        );


    const allCompartments =
        [];


    cabinets.forEach(
        cabinet => {

            cabinet
                .querySelectorAll(
                    ".compartment"
                )
                .forEach(
                    compartment => {

                        allCompartments.push(
                            compartment
                        );
                    }
                );
        }
    );


    /*
     * Ocultamos todos inicialmente.
     */

    allCompartments.forEach(
        element => {

            element.style.display =
                "none";

            element.innerHTML = `
                <div class="slotgrid">
                    <div class="cell"></div>
                    <div class="cell"></div>
                    <div class="cell"></div>
                </div>
            `;
        }
    );


    const selected =
        allCompartments.slice(
            0,
            number
        );


    selected.forEach(
        element => {

            element.style.display =
                "block";
        }
    );


    return selected;
}


/* ============================================================
   CREAR NIVEL
   ============================================================ */

function generateLevel(
    levelNumber
) {

    const config =
        getLevelConfig(
            levelNumber
        );


    console.log(
        "Generando nivel:",
        config
    );


    if (
        !validateLevelNumbers(
            config
        )
    ) {

        console.error(
            "Configuración de nivel imposible:",
            config
        );

        return false;
    }


    const arrangement =
        buildSolvableArrangement(
            config
        );


    if (
        !validateGeneratedBoard(
            arrangement
        )
    ) {

        console.error(
            "El generador produjo un tablero inválido."
        );

        return false;
    }


    GAME_MODEL.clear();


    GAME_MODEL.level =
        config.nivel;


    GAME_MODEL.remainingTime =
        config.tiempo;


    /*
     * Crear estantes.
     */

    const elements =
        createCompartments(
            config.estantes
        );


    elements.forEach(
        element => {

            const compartment =
                new Compartment(
                    element
                );


            GAME_MODEL.addCompartment(
                compartment
            );


            /*
             * Primera capa.
             */

            compartment.ensureLayer(
                0
            );
        }
    );


    /*
     * Colocar objetos.
     */

    arrangement.forEach(
        position => {

            if (
                position.object === null
            ) {

                return;
            }


            const compartment =
                GAME_MODEL
                    .compartments[
                        position.shelf
                    ];


            createAndPlaceObject(
                position.object,
                compartment,
                0,
                position.slot
            );
        }
    );


    /*
     * Actualizar visualización.
     */

    renderAllObjects();


    /*
     * Tema.
     */

    const scenarioIndex =
        (
            config.nivel - 1
        ) %
        CONFIG.ESCENARIOS.length;


    document.body.dataset.theme =
        CONFIG.ESCENARIOS[
            scenarioIndex
        ];


    console.log(
        "Nivel generado correctamente."
    );


    return true;
}