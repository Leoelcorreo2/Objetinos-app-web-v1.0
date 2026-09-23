javascript
import GamePhase from "../state/GamePhase.js";
import GameStateMachine from "./GameStateMachine.js";

import GameCommands from "./commands/GameCommands.js";
import GameEvents from "./events/GameEvents.js";

import MovementSystem from "../systems/movement/MovementSystem.js";
import TrioSystem from "../systems/trio/TrioSystem.js";
import LayerSystem from "../systems/layer/LayerSystem.js";
import CollapseSystem from "../systems/collapse/CollapseSystem.js";
import VictorySystem from "../systems/victory/VictorySystem.js";
import BlockDetectionSystem from "../systems/blocked/BlockDetectionSystem.js";
import TimerSystem from "../systems/timer/TimerSystem.js";
import StructureMovementSystem from "../systems/structure/StructureMovementSystem.js";

/**
 * GameController
 *
 * Coordinador de alto nivel de la partida.
 *
 * Responsabilidades:
 *
 * - recibir Commands;
 * - comprobar que la acción puede ejecutarse;
 * - coordinar los Systems;
 * - coordinar la transacción completa de MOVE_OBJECT;
 * - generar Events a partir de hechos ejecutados;
 * - sincronizar GameState;
 * - coordinar el final de la resolución.
 *
 * GameController NO contiene las reglas internas del juego.
 *
 * Las reglas pertenecen a:
 *
 *     Rules
 *       ↓
 *     Systems
 *
 * GameController únicamente coordina.
 *
 *
 * ESTADO DE APLICACIÓN
 * --------------------
 *
 * GameState.gamePhase continúa representando:
 *
 *     READY
 *     PLAYING
 *     WON
 *     LOST
 *
 * GameStateMachine representa el flujo operacional:
 *
 *     READY
 *       ↓
 *   RESOLVING
 *       ↓
 *     READY
 *
 * o:
 *
 *     RESOLVING → BLOCKED
 *     RESOLVING → VICTORY
 *
 * De esta forma no se introduce un estado PLAYING
 * que no pertenece al modelo de GameStateMachine.
 */
export default class GameController {

    static REASON = Object.freeze({

        COMMAND_EXECUTED:
            "COMMAND_EXECUTED",

        COMMAND_REJECTED:
            "COMMAND_REJECTED",

        GAME_NOT_PLAYING:
            "GAME_NOT_PLAYING",

        LEVEL_NOT_AVAILABLE:
            "LEVEL_NOT_AVAILABLE",

        MOVEMENT_REJECTED:
            "MOVEMENT_REJECTED",

        MOVEMENT_RESOLVED:
            "MOVEMENT_RESOLVED",

        TIME_EXPIRED:
            "TIME_EXPIRED",

        VICTORY:
            "VICTORY",

        BLOCKED:
            "BLOCKED",

        NO_BLOCK:
            "NO_BLOCK",

        RESOLUTION_ACTIVE:
            "RESOLUTION_ACTIVE",

        STATE_TRANSITION_REJECTED:
            "STATE_TRANSITION_REJECTED"
    });


    /**
     * @param {Object} params
     * @param {GameState} params.gameState
     * @param {LevelState|null} params.levelState
     * @param {Object} params.systems
     * @param {GameStateMachine|null} params.stateMachine
     */
    constructor({
        gameState,
        levelState,
        systems = {},
        stateMachine = null
    } = {}) {

        if (!gameState) {

            throw new Error(
                "GameController: gameState es obligatorio."
            );
        }

        this.gameState =
            gameState;

        this.levelState =
            levelState ?? null;


        /*
         * La máquina de estados es una dependencia explícita.
         *
         * Para compatibilidad con el Controller actual:
         *
         *   READY / PLAYING → máquina en READY
         *   WON            → máquina en VICTORY
         *   LOST           → máquina en LIFE_LOST
         *
         * No se fuerza PLAYING porque GameStateMachine no
         * contiene ese estado.
         */
        this.stateMachine =
            stateMachine ??
            this.#createInitialStateMachine();


        /*
         * Los Systems solamente se crean cuando existe
         * un LevelState.
         */
        if (this.levelState) {

            this.#createSystems(
                systems
            );

        } else {

            this.#clearSystems(
                systems
            );
        }
    }


    /**
     * Crea la máquina inicial a partir del GameState actual.
     *
     * GamePhase y GameStateMachine son dos representaciones
     * diferentes del estado:
     *
     * GamePhase:
     *     estado persistente de partida.
     *
     * GameStateMachine:
     *     estado operacional del flujo.
     */
    #createInitialStateMachine() {

        let initialState =
            GameStateMachine.STATE.READY;


        if (
            this.gameState.gamePhase ===
            GamePhase.WON
        ) {

            initialState =
                GameStateMachine.STATE.VICTORY;

        } else if (
            this.gameState.gamePhase ===
            GamePhase.LOST
        ) {

            initialState =
                GameStateMachine.STATE.LIFE_LOST;
        }


        return new GameStateMachine(
            initialState
        );
    }


    /**
     * Crea todos los Systems sobre el LevelState actual.
     */
    #createSystems(
        systems = {}
    ) {

        this.movementSystem =
            systems.movement ??
            new MovementSystem(
                this.levelState
            );

        this.trioSystem =
            systems.trio ??
            new TrioSystem(
                this.levelState
            );

        this.layerSystem =
            systems.layer ??
            new LayerSystem(
                this.levelState
            );

        this.collapseSystem =
            systems.collapse ??
            new CollapseSystem(
                this.levelState
            );

        this.victorySystem =
            systems.victory ??
            new VictorySystem(
                this.levelState
            );

        this.blockDetectionSystem =
            systems.blocked ??
            new BlockDetectionSystem(
                this.levelState
            );

        this.timerSystem =
            systems.timer ??
            new TimerSystem(
                this.levelState
            );

        this.structureMovementSystem =
            systems.structureMovement ??
            new StructureMovementSystem(
                this.levelState
            );
    }


    /**
     * Limpia Systems cuando todavía no existe un LevelState.
     *
     * Las dependencias inyectadas se conservan si existen.
     */
    #clearSystems(
        systems = {}
    ) {

        this.movementSystem =
            systems.movement ?? null;

        this.trioSystem =
            systems.trio ?? null;

        this.layerSystem =
            systems.layer ?? null;

        this.collapseSystem =
            systems.collapse ?? null;

        this.victorySystem =
            systems.victory ?? null;

        this.blockDetectionSystem =
            systems.blocked ?? null;

        this.timerSystem =
            systems.timer ?? null;

        this.structureMovementSystem =
            systems.structureMovement ?? null;
    }


    /**
     * Asocia un LevelState al Controller.
     *
     * Los Systems se reconstruyen sobre el nuevo LevelState.
     *
     * La máquina de estados vuelve a READY porque el nivel
     * todavía no está en resolución.
     */
    setLevelState(
        levelState
    ) {

        if (!levelState) {

            throw new Error(
                "GameController: levelState es obligatorio."
            );
        }

        this.levelState =
            levelState;


        this.#createSystems();


        /*
         * El nivel recién cargado queda preparado para jugar.
         *
         * La máquina debe encontrarse en READY.
         */
        if (
            !this.stateMachine.is(
                GameStateMachine.STATE.READY
            )
        ) {

            const transition =
                this.#forceState(
                    GameStateMachine.STATE.READY
                );

            if (!transition.transitioned) {

                throw new Error(
                    "GameController: no se pudo preparar la máquina de estados en READY."
                );
            }
        }


        return this.levelState;
    }


    /**
     * Devuelve el LevelState activo.
     */
    getLevelState() {

        return this.levelState;
    }


    /**
     * Devuelve el GameState global.
     */
    getGameState() {

        return this.gameState;
    }


    /**
     * Devuelve la máquina de estados.
     */
    getStateMachine() {

        return this.stateMachine;
    }


    /**
     * Devuelve el estado operacional actual.
     */
    getFlowState() {

        return this.stateMachine.getState();
    }


    /**
     * Inicia el nivel actualmente cargado.
     *
     * GameState:
     *
     *     READY → PLAYING
     *
     * GameStateMachine:
     *
     *     READY
     *
     * El estado READY de la máquina significa que la partida
     * está preparada para aceptar una interacción.
     */
    start() {

        if (!this.levelState) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    GameController.REASON.LEVEL_NOT_AVAILABLE
            };
        }


        /*
         * Si la máquina estaba en un estado terminal,
         * no forzamos una transición arbitraria.
         */
        if (
            !this.stateMachine.is(
                GameStateMachine.STATE.READY
            )
        ) {

            const transition =
                this.#forceState(
                    GameStateMachine.STATE.READY
                );

            if (!transition.transitioned) {

                return {

                    valid:
                        false,

                    executed:
                        false,

                    reason:
                        GameController.REASON.STATE_TRANSITION_REJECTED,

                    transition
                };
            }
        }


        this.gameState.setGamePhase(
            GamePhase.PLAYING
        );

        this.levelState.setPhase(
            GamePhase.PLAYING
        );


        let timerResult =
            null;


        if (
            this.levelState.timer !== null
        ) {

            timerResult =
                this.timerSystem.start();
        }


        return {

            valid:
                true,

            executed:
                true,

            reason:
                GameController.REASON.COMMAND_EXECUTED,

            phase:
                GamePhase.PLAYING,

            flowState:
                this.stateMachine.getState(),

            timer:
                timerResult
        };
    }


    /**
     * Punto único de entrada para Commands.
     */
    dispatch(
        command
    ) {

        if (
            !command ||
            typeof command !== "object"
        ) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    GameController.REASON.COMMAND_REJECTED
            };
        }


        if (
            !GameCommands.isValidType(
                command.type
            )
        ) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    GameController.REASON.COMMAND_REJECTED,

                command
            };
        }


        switch (
            command.type
        ) {

            case GameCommands.TYPE.MOVE_OBJECT:

                return this.#executeMoveCommand(
                    command
                );


            default:

                return {

                    valid:
                        false,

                    executed:
                        false,

                    reason:
                        GameController.REASON.COMMAND_REJECTED,

                    command
                };
        }
    }


    /**
     * Adapta MOVE_OBJECT al flujo transaccional.
     */
    #executeMoveCommand(
        command
    ) {

        const {
            objectId,
            destinationSlotId
        } =
            command.payload ?? {};


        return this.#executeMoveTransaction({

            objectId,

            destinationSlotId,

            command
        });
    }


    /**
     * Fachada de compatibilidad para move().
     */
    move({
        objectId,
        destinationSlotId
    } = {}) {

        const command =
            GameCommands.moveObject(
                objectId,
                destinationSlotId
            );


        return this.dispatch(
            command
        );
    }


    /**
     * Ejecuta la transacción completa de MOVE_OBJECT.
     *
     * Secuencia:
     *
     *     READY
     *       ↓
     *   RESOLVING
     *       ↓
     *   MovementSystem
     *       ↓
     *   TrioSystem
     *       ↓
     *   LayerSystem
     *       ↓
     *   CollapseSystem
     *       ↓
     *   VictorySystem
     *       ↓
     *   BlockDetectionSystem
     *       ↓
     *   READY / BLOCKED / VICTORY
     *
     * IMPORTANTE:
     *
     * StructureMovementSystem NO se ejecuta aquí.
     *
     * Ese System representa movimiento físico continuo de una
     * Structure y requiere deltaTime + structureId.
     *
     * Su actualización pertenece al ciclo físico correspondiente,
     * no a la transacción lógica MOVE_OBJECT.
     */
    #executeMoveTransaction({
        objectId,
        destinationSlotId,
        command = null
    } = {}) {

        if (
            !this.levelState ||
            !this.movementSystem
        ) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    GameController.REASON.LEVEL_NOT_AVAILABLE,

                command,

                events: []
            };
        }


        /*
         * MOVE_OBJECT solamente se acepta durante PLAYING.
         */
        if (
            this.gameState.gamePhase !==
            GamePhase.PLAYING
        ) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    GameController.REASON.GAME_NOT_PLAYING,

                phase:
                    this.gameState.gamePhase,

                command,

                events: []
            };
        }


        /*
         * La máquina debe estar READY para comenzar
         * una nueva resolución.
         *
         * Esto impide comenzar un nuevo movimiento mientras
         * la resolución anterior está activa.
         */
        if (
            !this.stateMachine.is(
                GameStateMachine.STATE.READY
            )
        ) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    GameController.REASON.RESOLUTION_ACTIVE,

                flowState:
                    this.stateMachine.getState(),

                command,

                events: []
            };
        }


        /*
         * ---------------------------------------------------
         * 0. READY → RESOLVING
         * ---------------------------------------------------
         */
        const resolvingTransition =
            this.stateMachine.transitionTo(
                GameStateMachine.STATE.RESOLVING
            );


        if (
            !resolvingTransition.transitioned
        ) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    GameController.REASON.STATE_TRANSITION_REJECTED,

                transition:
                    resolvingTransition,

                command,

                events: []
            };
        }


        /*
         * A partir de aquí estamos dentro de una resolución.
         *
         * El estado se libera solamente al finalizar
         * correctamente la transacción.
         */
        try {

            return this.#resolveMove({

                objectId,

                destinationSlotId,

                command
            });

        } catch (error) {

            /*
             * ------------------------------------------------
             * FALLO DURANTE RESOLUCIÓN
             * ------------------------------------------------
             *
             * Todavía no disponemos de snapshots/rollback
             * del LevelState.
             *
             * Por tanto NO fingimos atomicidad física.
             *
             * Sí garantizamos, sin embargo, que la máquina
             * no queda atrapada en RESOLVING.
             */
            this.#restoreReadyAfterResolutionError();

            throw error;
        }
    }


    /**
     * Ejecuta el cuerpo de la resolución.
     *
     * Esta separación permite mantener claramente delimitado
     * el tramo RESOLVING.
     */
    #resolveMove({
        objectId,
        destinationSlotId,
        command
    }) {

        /*
         * ---------------------------------------------------
         * 1. MOVIMIENTO
         * ---------------------------------------------------
         */
        const movement =
            this.movementSystem.execute({

                objectId,

                destinationSlotId
            });


        /*
         * Si MovementSystem rechaza:
         *
         * - no continúa la transacción;
         * - no se ejecutan Systems posteriores;
         * - no se generan Events;
         * - volvemos a READY.
         */
        if (
            !movement.executed
        ) {

            this.#transitionFromResolving(
                GameStateMachine.STATE.READY
            );


            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    GameController.REASON.MOVEMENT_REJECTED,

                command,

                events: [],

                movement,

                flowState:
                    this.stateMachine.getState()
            };
        }


        /*
         * OBJECT_MOVED representa un hecho ya ejecutado.
         */
        const events = [

            GameEvents.objectMoved(

                movement.objectId,

                movement.sourceSlotId,

                movement.destinationSlotId
            )
        ];


        /*
         * ---------------------------------------------------
         * 2. TRÍO
         * ---------------------------------------------------
         */
        const trio =
            this.trioSystem.execute({

                destinationSlotId
            });


        if (
            trio.executed
        ) {

            events.push(

                GameEvents.trioCompleted({

                    objectIds:
                        trio.objectIds
                })
            );
        }


        /*
         * ---------------------------------------------------
         * 3. SHELVES AFECTADAS
         * ---------------------------------------------------
         *
         * Se obtienen después del movimiento/trío para que
         * la navegación represente el estado actual.
         */
        const affectedShelfIds =
            this.#getAffectedShelfIds(
                movement
            );


        /*
         * ---------------------------------------------------
         * 4. CAPAS
         * ---------------------------------------------------
         */
        const layerResults =
            [];


        for (
            const shelfId
            of affectedShelfIds
        ) {

            const layerResult =
                this.layerSystem.execute(
                    shelfId
                );


            layerResults.push(
                layerResult
            );


            if (
                layerResult.executed
            ) {

                events.push(

                    GameEvents.layerAdvanced(

                        layerResult.shelfId,

                        layerResult.advancedLayerIds,

                        {

                            topLayerId:
                                layerResult.topLayerId
                        }
                    )
                );
            }
        }


        /*
         * ---------------------------------------------------
         * 5. COLAPSOS
         * ---------------------------------------------------
         */
        const collapseResults =
            [];


        for (
            const shelfId
            of affectedShelfIds
        ) {

            const collapseResult =
                this.collapseSystem.execute(
                    shelfId
                );


            collapseResults.push(
                collapseResult
            );


            if (
                collapseResult.executed
            ) {

                events.push(

                    GameEvents.shelfCollapsed(

                        collapseResult.shelfId,

                        {

                            structureId:
                                collapseResult.structureId,

                            layerIds:
                                collapseResult.layerIds
                        }
                    )
                );
            }
        }


        /*
         * ---------------------------------------------------
         * 6. VICTORIA
         * ---------------------------------------------------
         */
        const victory =
            this.victorySystem.execute();


        if (
            victory.executed
        ) {

            /*
             * VictorySystem es la autoridad sobre LevelState.
             *
             * GameController solamente sincroniza GameState.
             */
            this.gameState.setGamePhase(
                GamePhase.WON
            );


            events.push(

                GameEvents.levelCompleted(

                    this.gameState.activeLevel,

                    {

                        previousPhase:
                            victory.previousPhase,

                        phase:
                            victory.phase
                    }
                )
            );


            const transition =
                this.#transitionFromResolving(
                    GameStateMachine.STATE.VICTORY
                );


            return {

                valid:
                    true,

                executed:
                    true,

                reason:
                    GameController.REASON.VICTORY,

                command,

                events,

                movement,

                trio,

                layerResults,

                collapseResults,

                victory,

                blocked:
                    null,

                flowState:
                    transition.state,

                stateTransition:
                    transition
            };
        }


        /*
         * ---------------------------------------------------
         * 7. BLOQUEO
         * ---------------------------------------------------
         */
        const blocked =
            this.blockDetectionSystem.execute();


        if (
            blocked.blocked === true
        ) {

            const transition =
                this.#transitionFromResolving(
                    GameStateMachine.STATE.BLOCKED
                );


            return {

                valid:
                    true,

                executed:
                    true,

                reason:
                    GameController.REASON.BLOCKED,

                command,

                events,

                movement,

                trio,

                layerResults,

                collapseResults,

                victory,

                blocked,

                flowState:
                    transition.state,

                stateTransition:
                    transition
            };
        }


        /*
         * ---------------------------------------------------
         * 8. FIN DE RESOLUCIÓN
         * ---------------------------------------------------
         *
         * La partida continúa en PLAYING y la máquina vuelve
         * a READY para permitir el siguiente MOVE_OBJECT.
         */
        const transition =
            this.#transitionFromResolving(
                GameStateMachine.STATE.READY
            );


        return {

            valid:
                true,

            executed:
                true,

            reason:
                GameController.REASON.MOVEMENT_RESOLVED,

            command,

            events,

            movement,

            trio,

            layerResults,

            collapseResults,

            victory,

            blocked,

            flowState:
                transition.state,

            stateTransition:
                transition
        };
    }


    /**
     * Transición de salida desde RESOLVING.
     */
    #transitionFromResolving(
        nextState
    ) {

        const transition =
            this.stateMachine.transitionTo(
                nextState
            );


        if (
            !transition.transitioned
        ) {

            throw new Error(
                `GameController: transición inválida RESOLVING → ${nextState}.`
            );
        }


        return transition;
    }


    /**
     * Recuperación del estado operacional después de
     * una excepción durante la resolución.
     *
     * No realiza rollback físico del LevelState.
     *
     * Solamente evita dejar la máquina permanentemente
     * bloqueada en RESOLVING.
     */
    #restoreReadyAfterResolutionError() {

        if (
            this.stateMachine.is(
                GameStateMachine.STATE.RESOLVING
            )
        ) {

            const transition =
                this.stateMachine.transitionTo(
                    GameStateMachine.STATE.READY
                );


            if (
                !transition.transitioned
            ) {

                throw new Error(
                    "GameController: no se pudo recuperar READY tras un error de resolución."
                );
            }
        }
    }


    /**
     * Cambia directamente a un estado de preparación
     * solamente durante la configuración del Controller.
     *
     * No se utiliza durante una resolución.
     */
    #forceState(
        targetState
    ) {

        const currentState =
            this.stateMachine.getState();


        if (
            currentState ===
            targetState
        ) {

            return {

                transitioned:
                    true,

                previousState:
                    currentState,

                state:
                    targetState,

                reason:
                    GameStateMachine.REASON.SAME_STATE
            };
        }


        /*
         * Intentamos primero una transición normal.
         */
        const transition =
            this.stateMachine.transitionTo(
                targetState
            );


        if (
            transition.transitioned
        ) {

            return transition;
        }


        /*
         * La máquina no ofrece una transición administrativa
         * directa desde todos los estados.
         *
         * En esta fase solamente permitimos reiniciar cuando
         * estamos configurando un nuevo nivel.
         */
        const reset =
            this.stateMachine.reset();


        if (
            !reset ||
            this.stateMachine.getState() !==
            GameStateMachine.STATE.BOOT
        ) {

            return {

                transitioned:
                    false,

                previousState:
                    currentState,

                state:
                    this.stateMachine.getState(),

                reason:
                    GameStateMachine.REASON.INVALID_TRANSITION
            };
        }


        /*
         * BOOT → MENU → LOADING_LEVEL → READY
         *
         * Se utilizan exclusivamente para preparar el nuevo
         * nivel. No representan un flujo de juego iniciado
         * por el usuario en este punto.
         */
        const menu =
            this.stateMachine.transitionTo(
                GameStateMachine.STATE.MENU
            );


        if (
            !menu.transitioned
        ) {

            return {

                transitioned:
                    false,

                previousState:
                    currentState,

                state:
                    this.stateMachine.getState(),

                reason:
                    menu.reason
            };
        }


        const loading =
            this.stateMachine.transitionTo(
                GameStateMachine.STATE.LOADING_LEVEL
            );


        if (
            !loading.transitioned
        ) {

            return {

                transitioned:
                    false,

                previousState:
                    currentState,

                state:
                    this.stateMachine.getState(),

                reason:
                    loading.reason
            };
        }


        return this.stateMachine.transitionTo(
            targetState
        );
    }


    /**
     * Actualiza el temporizador.
     *
     * TimerSystem gestiona el tiempo.
     * GameController interpreta TIME_EXPIRED.
     */
    update(
        deltaTime
    ) {

        if (
            !this.levelState ||
            !this.timerSystem
        ) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    GameController.REASON.LEVEL_NOT_AVAILABLE
            };
        }


        const result =
            this.timerSystem.execute(
                deltaTime
            );


        if (
            result.reason ===
            TimerSystem.REASON.TIME_EXPIRED
        ) {

            /*
             * El temporizador es un flujo independiente
             * de MOVE_OBJECT.
             *
             * La sincronización completa TIME_OUT/LIFE_LOST
             * se desarrollará en la fase correspondiente.
             */
            return {

                ...result,

                controllerReason:
                    GameController.REASON.TIME_EXPIRED
            };
        }


        return result;
    }


    /**
     * Pausa el temporizador.
     */
    pauseTimer() {

        if (!this.timerSystem) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    GameController.REASON.LEVEL_NOT_AVAILABLE
            };
        }


        return this.timerSystem.pause();
    }


    /**
     * Reanuda el temporizador.
     */
    resumeTimer() {

        if (!this.timerSystem) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    GameController.REASON.LEVEL_NOT_AVAILABLE
            };
        }


        return this.timerSystem.resume();
    }


    /**
     * Devuelve las Shelves afectadas por un movimiento.
     *
     * Solamente realiza navegación estructural.
     */
    #getAffectedShelfIds(
        movement
    ) {

        if (!movement) {
            return [];
        }


        const shelfIds =
            [];


        const addShelfForSlot =
            (slotId) => {

                if (
                    slotId === undefined ||
                    slotId === null
                ) {

                    return;
                }


                const location =
                    this.#getSlotLocation(
                        slotId
                    );


                if (
                    location &&
                    location.shelfId !== undefined &&
                    location.shelfId !== null
                ) {

                    if (
                        !shelfIds.includes(
                            location.shelfId
                        )
                    ) {

                        shelfIds.push(
                            location.shelfId
                        );
                    }
                }
            };


        addShelfForSlot(
            movement.sourceSlotId
        );


        addShelfForSlot(
            movement.destinationSlotId
        );


        return shelfIds;
    }


    /**
     * Busca la Shelf propietaria de un Slot.
     *
     * Solamente realiza navegación estructural.
     */
    #getSlotLocation(
        slotId
    ) {

        if (
            !this.levelState?.board
        ) {

            return null;
        }


        const board =
            this.levelState.board;


        if (
            !Array.isArray(
                board.structures
            )
        ) {

            return null;
        }


        for (
            const structure
            of board.structures
        ) {

            if (
                !Array.isArray(
                    structure.shelves
                )
            ) {

                continue;
            }


            for (
                const shelf
                of structure.shelves
            ) {

                if (
                    !Array.isArray(
                        shelf.layers
                    )
                ) {

                    continue;
                }


                for (
                    const layer
                    of shelf.layers
                ) {

                    if (
                        !Array.isArray(
                            layer.slots
                        )
                    ) {

                        continue;
                    }


                    for (
                        const slot
                        of layer.slots
                    ) {

                        if (
                            slot.id ===
                            slotId
                        ) {

                            return {

                                structureId:
                                    structure.id,

                                shelfId:
                                    shelf.id,

                                layerId:
                                    layer.id,

                                slotId:
                                    slot.id
                            };
                        }
                    }
                }
            }
        }


        return null;
    }
}

