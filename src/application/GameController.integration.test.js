import assert from "node:assert/strict";

import GameController from "./GameController.js";
import GameState from "./GameState.js";
import GamePhase from "../state/GamePhase.js";
import GameCommands from "./commands/GameCommands.js";
import GameEvents from "./events/GameEvents.js";


let passed = 0;
let failed = 0;


function test(name, fn) {

    try {

        fn();

        console.log(
            `✓ ${name}`
        );

        passed += 1;

    } catch (error) {

        console.error(
            `✗ ${name}`
        );

        console.error(
            error
        );

        failed += 1;
    }
}


/**
 * Crea un LevelState mínimo para probar
 * exclusivamente la coordinación del Controller.
 *
 * No utilizamos aquí las implementaciones reales
 * de los Systems porque estas pruebas deben aislar
 * el contrato Controller → Command → Systems → Events.
 */
function createLevelState() {

    return {

        phase:
            GamePhase.READY,

        timer:
            null,

        board: {

            structures: [

                {

                    id:
                        "structure-1",

                    shelves: [

                        {

                            id:
                                "shelf-1",

                            layers: [

                                {

                                    id:
                                        "layer-1",

                                    slots: [

                                        {
                                            id:
                                                "source-1"
                                        },

                                        {
                                            id:
                                                "destination-1"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },


        setPhase(phase) {

            this.phase =
                phase;
        },


        getPhase() {

            return this.phase;
        }
    };
}


/**
 * Crea Systems simulados.
 *
 * Cada System registra su ejecución para poder comprobar
 * que el Controller respeta el orden de coordinación.
 */
function createSystems({
    victory = false,
    blocked = false
} = {}) {

    const calls = [];


    return {

        calls,


        movement: {

            execute(payload) {

                calls.push([
                    "movement",
                    payload
                ]);


                return {

                    valid:
                        true,

                    executed:
                        true,

                    reason:
                        "MOVEMENT_EXECUTED",

                    objectId:
                        payload.objectId,

                    sourceSlotId:
                        "source-1",

                    destinationSlotId:
                        payload.destinationSlotId
                };
            }
        },


        trio: {

            execute(payload) {

                calls.push([
                    "trio",
                    payload
                ]);


                return {

                    valid:
                        true,

                    executed:
                        false,

                    reason:
                        "TRIO_REJECTED",

                    objectIds:
                        []
                };
            }
        },


        layer: {

            execute(shelfId) {

                calls.push([
                    "layer",
                    shelfId
                ]);


                return {

                    valid:
                        true,

                    executed:
                        false,

                    reason:
                        "LAYER_REJECTED",

                    shelfId
                };
            }
        },


        collapse: {

            execute(shelfId) {

                calls.push([
                    "collapse",
                    shelfId
                ]);


                return {

                    valid:
                        true,

                    executed:
                        false,

                    reason:
                        "SHELF_NOT_COLLAPSED",

                    shelfId
                };
            }
        },


        victory: {

            execute() {

                calls.push([
                    "victory"
                ]);


                if (victory) {

                    return {

                        valid:
                            true,

                        executed:
                            true,

                        reason:
                            "VICTORY_EXECUTED",

                        totalObjects:
                            0,

                        previousPhase:
                            GamePhase.PLAYING,

                        phase:
                            GamePhase.WON
                    };
                }


                return {

                    valid:
                        false,

                    executed:
                        false,

                    reason:
                        "VICTORY_REJECTED",

                    phase:
                        GamePhase.PLAYING
                };
            }
        },


        blocked: {

            execute() {

                calls.push([
                    "blocked"
                ]);


                return {

                    valid:
                        true,

                    executed:
                        true,

                    blocked,

                    reason:
                        blocked
                            ? "BLOCKED"
                            : "NO_BLOCK"
                };
            }
        }
    };
}


/**
 * Crea un Controller listo para ejecutar
 * comandos durante PLAYING.
 */
function createController(options = {}) {

    const gameState =
        new GameState({

            activeLevel:
                1,

            gamePhase:
                GamePhase.PLAYING
        });


    const levelState =
        createLevelState();


    const systems =
        createSystems(
            options
        );


    const controller =
        new GameController({

            gameState,

            levelState,

            systems
        });


    return {

        controller,

        gameState,

        levelState,

        systems
    };
}


// -----------------------------------------------------------------------------
// 1. dispatch()
// -----------------------------------------------------------------------------

test(
    "dispatch acepta MOVE_OBJECT y ejecuta el flujo",
    () => {

        const {
            controller,
            systems
        } =
            createController();


        const command =
            GameCommands.moveObject(
                "object-1",
                "destination-1"
            );


        const result =
            controller.dispatch(
                command
            );


        assert.equal(
            result.executed,
            true
        );


        assert.equal(
            result.reason,
            GameController.REASON.MOVEMENT_RESOLVED
        );


        assert.equal(
            result.command,
            command
        );


        assert.deepEqual(

            systems.calls.map(
                ([name]) => name
            ),

            [
                "movement",
                "trio",
                "layer",
                "collapse",
                "victory",
                "blocked"
            ]
        );
    }
);


// -----------------------------------------------------------------------------
// 2. move() → Command → dispatch()
// -----------------------------------------------------------------------------

test(
    "move() crea el Command y delega en dispatch",
    () => {

        const {
            controller,
            systems
        } =
            createController();


        const result =
            controller.move({

                objectId:
                    "object-1",

                destinationSlotId:
                    "destination-1"
            });


        assert.equal(
            result.executed,
            true
        );


        assert.equal(
            result.command.type,
            GameCommands.TYPE.MOVE_OBJECT
        );


        assert.deepEqual(

            result.command.payload,

            {
                objectId:
                    "object-1",

                destinationSlotId:
                    "destination-1"
            }
        );


        assert.equal(
            systems.calls[0][0],
            "movement"
        );
    }
);


// -----------------------------------------------------------------------------
// 3. Command nulo
// -----------------------------------------------------------------------------

test(
    "rechaza un Command nulo",
    () => {

        const {
            controller
        } =
            createController();


        const result =
            controller.dispatch(
                null
            );


        assert.equal(
            result.valid,
            false
        );


        assert.equal(
            result.executed,
            false
        );


        assert.equal(
            result.reason,
            GameController.REASON.COMMAND_REJECTED
        );
    }
);


// -----------------------------------------------------------------------------
// 4. Command desconocido
// -----------------------------------------------------------------------------

test(
    "rechaza un tipo de Command desconocido",
    () => {

        const {
            controller
        } =
            createController();


        const result =
            controller.dispatch({

                type:
                    "UNKNOWN_COMMAND",

                payload:
                    {}
            });


        assert.equal(
            result.valid,
            false
        );


        assert.equal(
            result.executed,
            false
        );


        assert.equal(
            result.reason,
            GameController.REASON.COMMAND_REJECTED
        );
    }
);


// -----------------------------------------------------------------------------
// 5. Fase incorrecta
// -----------------------------------------------------------------------------

test(
    "rechaza MOVE_OBJECT cuando la partida no está en PLAYING",
    () => {

        const {
            controller,
            gameState,
            systems
        } =
            createController();


        gameState.setGamePhase(
            GamePhase.READY
        );


        const result =
            controller.dispatch(

                GameCommands.moveObject(

                    "object-1",

                    "destination-1"
                )
            );


        assert.equal(
            result.valid,
            false
        );


        assert.equal(
            result.executed,
            false
        );


        assert.equal(
            result.reason,
            GameController.REASON.GAME_NOT_PLAYING
        );


        assert.deepEqual(
            systems.calls,
            []
        );


        assert.deepEqual(
            result.events,
            []
        );
    }
);


// -----------------------------------------------------------------------------
// 6. Movimiento rechazado
// -----------------------------------------------------------------------------

test(
    "un movimiento rechazado no genera Events",
    () => {

        const {
            controller,
            systems
        } =
            createController();


        systems.movement.execute =
            () => ({

                valid:
                    false,

                executed:
                    false,

                reason:
                    "MOVEMENT_REJECTED"
            });


        const result =
            controller.move({

                objectId:
                    "object-1",

                destinationSlotId:
                    "destination-1"
            });


        assert.equal(
            result.valid,
            false
        );


        assert.equal(
            result.executed,
            false
        );


        assert.equal(
            result.reason,
            GameController.REASON.MOVEMENT_REJECTED
        );


        assert.deepEqual(
            result.events,
            []
        );
    }
);


// -----------------------------------------------------------------------------
// 7. OBJECT_MOVED
// -----------------------------------------------------------------------------

test(
    "un movimiento ejecutado produce OBJECT_MOVED",
    () => {

        const {
            controller
        } =
            createController();


        const result =
            controller.move({

                objectId:
                    "object-1",

                destinationSlotId:
                    "destination-1"
            });


        assert.equal(
            result.events.length,
            1
        );


        assert.equal(

            result.events[0].type,

            GameEvents.TYPE.OBJECT_MOVED
        );


        assert.deepEqual(

            result.events[0].data,

            {

                objectId:
                    "object-1",

                sourceSlot:
                    "source-1",

                destinationSlot:
                    "destination-1"
            }
        );
    }
);


// -----------------------------------------------------------------------------
// 8. Victoria
// -----------------------------------------------------------------------------

test(
    "la victoria sincroniza GameState pero no vuelve a escribir LevelState desde el Controller",
    () => {

        const {
            controller,
            gameState,
            levelState
        } =
            createController({

                victory:
                    true
            });


        const result =
            controller.move({

                objectId:
                    "object-1",

                destinationSlotId:
                    "destination-1"
            });


        assert.equal(
            result.reason,
            GameController.REASON.VICTORY
        );


        assert.equal(
            gameState.gamePhase,
            GamePhase.WON
        );


        /*
         * El fake VictorySystem no modifica LevelState.
         *
         * Por tanto, este valor permanece READY y demuestra
         * que el Controller ya no escribe directamente
         * LevelState.phase durante la victoria.
         */
        assert.equal(
            levelState.phase,
            GamePhase.READY
        );


        assert.equal(

            result.events.at(-1).type,

            GameEvents.TYPE.LEVEL_COMPLETED
        );
    }
);


// -----------------------------------------------------------------------------
// 9. Victory → no BlockDetection
// -----------------------------------------------------------------------------

test(
    "una victoria no ejecuta BlockDetectionSystem",
    () => {

        const {
            controller,
            systems
        } =
            createController({

                victory:
                    true
            });


        controller.move({

            objectId:
                "object-1",

            destinationSlotId:
                "destination-1"
        });


        assert.equal(

            systems.calls.some(
                ([name]) =>
                    name === "blocked"
            ),

            false
        );
    }
);


// -----------------------------------------------------------------------------
// 10. Bloqueo
// -----------------------------------------------------------------------------

test(
    "un movimiento resuelto y bloqueado conserva el resultado del BlockDetectionSystem",
    () => {

        const {
            controller
        } =
            createController({

                blocked:
                    true
            });


        const result =
            controller.move({

                objectId:
                    "object-1",

                destinationSlotId:
                    "destination-1"
            });


        assert.equal(
            result.reason,
            GameController.REASON.BLOCKED
        );


        assert.equal(
            result.blocked.blocked,
            true
        );


        assert.equal(

            result.events[0].type,

            GameEvents.TYPE.OBJECT_MOVED
        );
    }
);


// -----------------------------------------------------------------------------
// Resultado
// -----------------------------------------------------------------------------

console.log("");

console.log(
    `GameController: ${passed}/${passed + failed} tests PASS`
);


if (failed > 0) {

    process.exitCode = 1;
}