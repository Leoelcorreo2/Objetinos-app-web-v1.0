javascript
import assert from "node:assert/strict";

import GameController from "./GameController.js";
import GameState from "./GameState.js";
import GamePhase from "../state/GamePhase.js";
import GameStateMachine from "./GameStateMachine.js";
import GameCommands from "./commands/GameCommands.js";
import GameEvents from "./events/GameEvents.js";


let passed = 0;
let failed = 0;


function test(
    name,
    fn
) {

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
 * LevelState mínimo para probar exclusivamente
 * la coordinación del Controller.
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


        setPhase(
            phase
        ) {

            this.phase =
                phase;
        },


        getPhase() {

            return this.phase;
        }
    };
}


/**
 * Systems simulados.
 *
 * El Controller se prueba sin depender de las reglas internas
 * de los Systems reales.
 */
function createSystems({
    victory = false,
    blocked = false
} = {}) {

    const calls =
        [];


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

                    shelfId,

                    advancedLayerIds:
                        [],

                    topLayerId:
                        "layer-1"
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
                        "COLLAPSE_REJECTED",

                    shelfId,

                    structureId:
                        "structure-1",

                    layerIds:
                        []
                };
            }
        },


        victory: {

            execute() {

                calls.push([

                    "victory"
                ]);


                return {

                    valid:
                        true,

                    executed:
                        victory,

                    reason:
                        victory
                            ? "VICTORY"
                            : "NOT_VICTORY",

                    previousPhase:
                        GamePhase.PLAYING,

                    phase:
                        victory
                            ? GamePhase.WON
                            : GamePhase.PLAYING
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
                            : "NOT_BLOCKED"
                };
            }
        },


        timer: {

            start() {

                calls.push([
                    "timer-start"
                ]);


                return {

                    valid:
                        true,

                    executed:
                        true
                };
            },


            execute(deltaTime) {

                calls.push([

                    "timer",

                    deltaTime
                ]);


                return {

                    valid:
                        true,

                    executed:
                        true,

                    deltaTime
                };
            },


            pause() {

                calls.push([
                    "timer-pause"
                ]);


                return {

                    valid:
                        true,

                    executed:
                        true
                };
            },


            resume() {

                calls.push([
                    "timer-resume"
                ]);


                return {

                    valid:
                        true,

                    executed:
                        true
                };
            }
        },


        /*
         * StructureMovementSystem NO forma parte de la
         * transacción lógica MOVE_OBJECT.
         *
         * Se inyecta únicamente para comprobar que el Controller
         * conserva la dependencia sin ejecutarla.
         */
        structureMovement: {

            execute(payload) {

                calls.push([

                    "structureMovement",

                    payload
                ]);


                return {

                    valid:
                        true,

                    executed:
                        true
                };
            }
        }
    };
}


/**
 * Crea un Controller preparado para PLAYING.
 */
function createController({
    victory = false,
    blocked = false,
    stateMachine = null
} = {}) {

    const gameState =
        new GameState({

            currentLevel:
                1,

            activeLevel:
                1,

            gamePhase:
                GamePhase.PLAYING
        });


    const levelState =
        createLevelState();


    levelState.setPhase(
        GamePhase.PLAYING
    );


    const systems =
        createSystems({

            victory,

            blocked
        });


    const controller =
        new GameController({

            gameState,

            levelState,

            systems,

            stateMachine
        });


    return {

        controller,

        gameState,

        levelState,

        systems
    };
}


/*
 * ---------------------------------------------------------------------------
 * 1. Constructor
 * ---------------------------------------------------------------------------
 */

test(
    "crea el Controller con la máquina de estados en READY",
    () => {

        const {
            controller
        } =
            createController();


        assert.equal(

            controller
                .getStateMachine()
                .getState(),

            GameStateMachine.STATE.READY
        );
    }
);


/*
 * ---------------------------------------------------------------------------
 * 2. Command válido
 * ---------------------------------------------------------------------------
 */

test(
    "acepta un Command MOVE_OBJECT válido",
    () => {

        const {
            controller
        } =
            createController();


        const result =
            controller.dispatch(

                GameCommands.moveObject(

                    "object-1",

                    "destination-1"
                )
            );


        assert.equal(
            result.executed,
            true
        );


        assert.equal(

            result.command.type,

            GameCommands.TYPE.MOVE_OBJECT
        );
    }
);


/*
 * ---------------------------------------------------------------------------
 * 3. Command nulo
 * ---------------------------------------------------------------------------
 */

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


/*
 * ---------------------------------------------------------------------------
 * 4. Command desconocido
 * ---------------------------------------------------------------------------
 */

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


/*
 * ---------------------------------------------------------------------------
 * 5. Fase incorrecta
 * ---------------------------------------------------------------------------
 */

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
    }
);


/*
 * ---------------------------------------------------------------------------
 * 6. Movimiento rechazado
 * ---------------------------------------------------------------------------
 */

test(
    "un movimiento rechazado no ejecuta Systems posteriores",
    () => {

        const {
            controller,
            systems
        } =
            createController();


        systems.movement.execute =
            () => {

                systems.calls.push([
                    "movement"
                ]);


                return {

                    valid:
                        false,

                    executed:
                        false,

                    reason:
                        "MOVEMENT_REJECTED"
                };
            };


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

            systems.calls,

            [
                [
                    "movement"
                ]
            ]
        );


        assert.equal(

            controller
                .getStateMachine()
                .getState(),

            GameStateMachine.STATE.READY
        );
    }
);


/*
 * ---------------------------------------------------------------------------
 * 7. Orden de resolución
 * ---------------------------------------------------------------------------
 */

test(
    "coordina la resolución en el orden correcto",
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


/*
 * ---------------------------------------------------------------------------
 * 8. OBJECT_MOVED
 * ---------------------------------------------------------------------------
 */

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


/*
 * ---------------------------------------------------------------------------
 * 9. RESOLVING → READY
 * ---------------------------------------------------------------------------
 */

test(
    "una resolución normal termina en READY",
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

            result.flowState,

            GameStateMachine.STATE.READY
        );


        assert.equal(

            controller
                .getFlowState(),

            GameStateMachine.STATE.READY
        );


        assert.equal(

            result.stateTransition.transitioned,

            true
        );
    }
);


/*
 * ---------------------------------------------------------------------------
 * 10. Bloqueo durante resolución
 * ---------------------------------------------------------------------------
 */

test(
    "RESOLVING → BLOCKED cuando BlockDetectionSystem detecta bloqueo",
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

            result.flowState,

            GameStateMachine.STATE.BLOCKED
        );


        assert.equal(

            controller
                .getFlowState(),

            GameStateMachine.STATE.BLOCKED
        );
    }
);


/*
 * ---------------------------------------------------------------------------
 * 11. Victoria
 * ---------------------------------------------------------------------------
 */

test(
    "la victoria sincroniza GameState y termina en VICTORY",
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


        assert.equal(

            controller
                .getFlowState(),

            GameStateMachine.STATE.VICTORY
        );


        /*
         * VictorySystem simulado no modifica LevelState.
         *
         * El Controller no escribe directamente
         * LevelState.phase.
         */
        assert.equal(

            levelState.phase,

            GamePhase.PLAYING
        );


        assert.equal(

            result.events.at(-1).type,

            GameEvents.TYPE.LEVEL_COMPLETED
        );
    }
);


/*
 * ---------------------------------------------------------------------------
 * 12. Victory → no BlockDetection
 * ---------------------------------------------------------------------------
 */

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


/*
 * ---------------------------------------------------------------------------
 * 13. StructureMovementSystem no forma parte de MOVE_OBJECT
 * ---------------------------------------------------------------------------
 */

test(
    "StructureMovementSystem no se ejecuta durante MOVE_OBJECT",
    () => {

        const {
            controller,
            systems
        } =
            createController();


        controller.move({

            objectId:
                "object-1",

            destinationSlotId:
                "destination-1"
        });


        assert.equal(

            systems.calls.some(
                ([name]) =>
                    name === "structureMovement"
            ),

            false
        );
    }
);


/*
 * ---------------------------------------------------------------------------
 * 14. No se puede iniciar una resolución desde BLOCKED
 * ---------------------------------------------------------------------------
 */

test(
    "rechaza MOVE_OBJECT mientras la máquina está en BLOCKED",
    () => {

        const stateMachine =
            new GameStateMachine(
                GameStateMachine.STATE.BLOCKED
            );


        const {
            controller,
            systems
        } =
            createController({

                stateMachine
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

            GameController.REASON.RESOLUTION_ACTIVE
        );


        assert.deepEqual(

            systems.calls,

            []
        );


        assert.equal(

            controller
                .getFlowState(),

            GameStateMachine.STATE.BLOCKED
        );
    }
);


/*
 * ---------------------------------------------------------------------------
 * 15. No se puede iniciar una resolución desde VICTORY
 * ---------------------------------------------------------------------------
 */

test(
    "rechaza MOVE_OBJECT mientras la máquina está en VICTORY",
    () => {

        const stateMachine =
            new GameStateMachine(
                GameStateMachine.STATE.VICTORY
            );


        const {
            controller,
            systems
        } =
            createController({

                stateMachine
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

            GameController.REASON.GAME_NOT_PLAYING
        );


        assert.deepEqual(

            systems.calls,

            []
        );
    }
);


/*
 * ---------------------------------------------------------------------------
 * 16. La máquina vuelve a READY después de un movimiento
 * ---------------------------------------------------------------------------
 */

test(
    "permite un segundo MOVE_OBJECT después de finalizar la primera resolución",
    () => {

        const {
            controller,
            systems
        } =
            createController();


        const first =
            controller.move({

                objectId:
                    "object-1",

                destinationSlotId:
                    "destination-1"
            });


        const second =
            controller.move({

                objectId:
                    "object-2",

                destinationSlotId:
                    "destination-2"
            });


        assert.equal(
            first.executed,
            true
        );


        assert.equal(
            second.executed,
            true
        );


        assert.equal(

            systems.calls.filter(
                ([name]) =>
                    name === "movement"
            ).length,

            2
        );


        assert.equal(

            controller
                .getFlowState(),

            GameStateMachine.STATE.READY
        );
    }
);


/*
 * ---------------------------------------------------------------------------
 * Resultado
 * ---------------------------------------------------------------------------
 */

console.log("");

console.log(

    `GameController: ${passed}/${passed + failed} tests PASS`
);


if (
    failed > 0
) {

    process.exitCode = 1;
}

