import GamePhase from "../state/GamePhase.js";

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
 * - comprobar que la acción puede ejecutarse en la fase actual;
 * - delegar la lógica en los Systems correspondientes;
 * - coordinar la resolución completa de un movimiento;
 * - procesar los resultados de los Systems;
 * - transformar resultados ejecutados en Events;
 * - actualizar GameState cuando corresponda;
 * - coordinar temporizador y final de nivel.
 *
 * IMPORTANTE:
 *
 * GameController NO contiene las reglas internas del juego.
 *
 * Las decisiones específicas pertenecen a:
 *
 *     Rules
 *       ↓
 *     Systems
 *
 * GameController solamente coordina.
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
            "NO_BLOCK"
    });


    /**
     * @param {Object} params
     * @param {GameState} params.gameState
     * @param {LevelState} params.levelState
     * @param {Object} params.systems
     *
     * Los Systems se pueden inyectar para facilitar:
     *
     * - pruebas;
     * - simulación;
     * - sustitución futura;
     * - integración progresiva.
     *
     * Si no se proporcionan, se crean automáticamente.
     */
    constructor({
        gameState,
        levelState,
        systems = {}
    } = {}) {

        if (!gameState) {
            throw new Error(
                "GameController: gameState es obligatorio."
            );
        }

        this.gameState = gameState;

        this.levelState =
            levelState ?? null;


        /*
         * Los Systems solamente pueden crearse si existe
         * un LevelState.
         *
         * Esto permite crear un GameController antes de
         * que exista un nivel cargado.
         */
        if (this.levelState) {

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

        } else {

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
    }


    /**
     * Asocia un LevelState al Controller.
     *
     * Esta operación se utilizará posteriormente durante
     * LOADING_LEVEL.
     *
     * Los Systems se reconstruyen para trabajar sobre el
     * nuevo LevelState.
     */
    setLevelState(levelState) {

        if (!levelState) {
            throw new Error(
                "GameController: levelState es obligatorio."
            );
        }

        this.levelState =
            levelState;


        this.movementSystem =
            new MovementSystem(
                levelState
            );

        this.trioSystem =
            new TrioSystem(
                levelState
            );

        this.layerSystem =
            new LayerSystem(
                levelState
            );

        this.collapseSystem =
            new CollapseSystem(
                levelState
            );

        this.victorySystem =
            new VictorySystem(
                levelState
            );

        this.blockDetectionSystem =
            new BlockDetectionSystem(
                levelState
            );

        this.timerSystem =
            new TimerSystem(
                levelState
            );

        this.structureMovementSystem =
            new StructureMovementSystem(
                levelState
            );

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
     * Inicia el nivel actualmente cargado.
     *
     * En esta primera versión:
     *
     *     READY → PLAYING
     *
     * La máquina de estados explícita se incorporará
     * posteriormente.
     */
    start() {

        if (!this.levelState) {

            return {
                valid: false,
                executed: false,

                reason:
                    GameController.REASON.LEVEL_NOT_AVAILABLE
            };
        }


        this.gameState.setGamePhase(
            GamePhase.PLAYING
        );

        this.levelState.setPhase(
            GamePhase.PLAYING
        );


        /*
         * El temporizador se inicia solamente si existe
         * configuración temporal.
         */
        let timerResult = null;

        if (this.levelState.timer !== null) {

            timerResult =
                this.timerSystem.start();
        }


        return {
            valid: true,
            executed: true,

            reason:
                GameController.REASON.COMMAND_EXECUTED,

            phase:
                GamePhase.PLAYING,

            timer:
                timerResult
        };
    }


    /**
     * Punto único de entrada para Commands de aplicación.
     *
     * Un Command expresa una intención.
     *
     * GameController decide qué flujo de aplicación
     * corresponde a esa intención.
     *
     * IMPORTANTE:
     *
     * dispatch() no contiene reglas de juego.
     * Las reglas siguen perteneciendo a Rules/Systems.
     *
     * @param {Object} command
     * @returns {Object}
     */
    dispatch(command) {

        if (
            !command ||
            typeof command !== "object"
        ) {

            return {
                valid: false,
                executed: false,

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
                valid: false,
                executed: false,

                reason:
                    GameController.REASON.COMMAND_REJECTED,

                command
            };
        }


        switch (command.type) {

            case GameCommands.TYPE.MOVE_OBJECT:

                return this.#executeMoveCommand(
                    command
                );


            default:

                return {
                    valid: false,
                    executed: false,

                    reason:
                        GameController.REASON.COMMAND_REJECTED,

                    command
                };
        }
    }


    /**
     * Adapta MOVE_OBJECT al flujo transaccional
     * de movimiento.
     *
     * No contiene reglas de juego.
     *
     * @param {Object} command
     * @returns {Object}
     */
    #executeMoveCommand(command) {

        const {
            objectId,
            destinationSlotId
        } = command.payload ?? {};


        return this.#executeMoveTransaction({

            objectId,

            destinationSlotId,

            command
        });
    }


    /**
     * Fachada de compatibilidad para la API histórica
     * move().
     *
     * La lógica real se ejecuta a través de:
     *
     *     Command
     *       ↓
     *     dispatch()
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
     * Ejecuta la transacción lógica de MOVE_OBJECT.
     *
     * Flujo:
     *
     *     MovementSystem
     *          ↓
     *     TrioSystem
     *          ↓
     *     LayerSystem
     *          ↓
     *     CollapseSystem
     *          ↓
     *     VictorySystem
     *          ↓
     *     BlockDetectionSystem
     *
     * Los Systems siguen siendo responsables de sus
     * propias reglas.
     *
     * El Controller solamente:
     *
     * - coordina;
     * - recoge resultados;
     * - transforma hechos ejecutados en Events;
     * - sincroniza el GameState global cuando corresponde.
     *
     * NOTA:
     *
     * La atomicidad física/rollback de esta transacción
     * se incorporará en el siguiente paso de arquitectura.
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
                valid: false,
                executed: false,

                reason:
                    GameController.REASON.LEVEL_NOT_AVAILABLE,

                command,

                events: []
            };
        }


        /*
         * En esta fase del proyecto solamente permitimos
         * movimientos durante PLAYING.
         */
        if (
            this.gameState.gamePhase !==
            GamePhase.PLAYING
        ) {

            return {
                valid: false,
                executed: false,

                reason:
                    GameController.REASON.GAME_NOT_PLAYING,

                phase:
                    this.gameState.gamePhase,

                command,

                events: []
            };
        }


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
         * Si el movimiento no se ejecuta:
         *
         * - no continúa la transacción;
         * - no se ejecuta ningún System posterior;
         * - no se genera ningún Event.
         */
        if (!movement.executed) {

            return {
                valid: false,
                executed: false,

                reason:
                    GameController.REASON.MOVEMENT_REJECTED,

                command,

                events: [],

                movement
            };
        }


        /*
         * A partir de este punto existe un hecho:
         *
         *     OBJECT_MOVED
         *
         * El Event representa algo que ya ha ocurrido.
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
         *
         * TrioSystem recibe el Slot destino.
         *
         * Si existe y se ejecuta un trío, añadimos
         * TRIO_COMPLETED.
         */
        const trio =
            this.trioSystem.execute({

                destinationSlotId
            });


        if (trio.executed) {

            events.push(

                GameEvents.trioCompleted({

                    objectIds:
                        trio.objectIds
                })
            );
        }


        /*
         * ---------------------------------------------------
         * 3. CAPAS
         * ---------------------------------------------------
         *
         * Obtenemos las Shelves afectadas por el movimiento.
         *
         * Esta función solamente navega por la estructura.
         * No contiene reglas de juego.
         */
        const affectedShelfIds =
            this.#getAffectedShelfIds(
                movement
            );


        const layerResults = [];


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


            /*
             * Solamente un avance realmente ejecutado
             * produce LAYER_ADVANCED.
             */
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
         * 4. COLAPSOS
         * ---------------------------------------------------
         *
         * Un CollapseSystem solamente modifica el estado
         * cuando CollapseRules determina que corresponde.
         */
        const collapseResults = [];


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


            /*
             * Solamente un colapso realmente ejecutado
             * produce SHELF_COLLAPSED.
             */
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
         * 5. VICTORIA
         * ---------------------------------------------------
         *
         * VictorySystem decide si existe victoria.
         */
        const victory =
            this.victorySystem.execute();


        if (
            victory.executed
        ) {

            /*
             * VictorySystem ya cambia:
             *
             *     LevelState.phase → WON
             *
             * El Controller NO vuelve a escribir
             * LevelState.phase.
             *
             * Solamente sincroniza el estado global
             * de la partida.
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


            return {

                valid: true,

                executed: true,

                reason:
                    GameController.REASON.VICTORY,

                command,

                events,

                movement,

                trio,

                layerResults,

                collapseResults,

                victory,

                blocked: null
            };
        }


        /*
         * ---------------------------------------------------
         * 6. BLOQUEO
         * ---------------------------------------------------
         *
         * BlockDetectionSystem NO pierde automáticamente
         * una vida.
         *
         * El resultado solamente informa de la situación.
         */
        const blocked =
            this.blockDetectionSystem.execute();


        return {

            valid: true,

            executed: true,

            reason:
                blocked.blocked === true

                    ? GameController.REASON.BLOCKED

                    : GameController.REASON.MOVEMENT_RESOLVED,

            command,

            events,

            movement,

            trio,

            layerResults,

            collapseResults,

            victory,

            blocked
        };
    }


    /**
     * Actualiza el temporizador.
     *
     * TimerSystem solamente gestiona el tiempo.
     *
     * GameController interpreta TIME_EXPIRED.
     */
    update(deltaTime) {

        if (
            !this.levelState ||
            !this.timerSystem
        ) {

            return {
                valid: false,
                executed: false,

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
                valid: false,
                executed: false,

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
                valid: false,
                executed: false,

                reason:
                    GameController.REASON.LEVEL_NOT_AVAILABLE
            };
        }


        return this.timerSystem.resume();
    }


    /**
     * Devuelve las Shelves afectadas por el movimiento.
     *
     * IMPORTANTE:
     *
     * Esta función NO contiene reglas de juego.
     *
     * Únicamente obtiene información estructural.
     *
     * La resolución de dependencias entre Shelves
     * pertenece a los Systems/Rules correspondientes.
     */
    #getAffectedShelfIds(movement) {

        if (!movement) {
            return [];
        }


        const shelfIds = [];


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
    #getSlotLocation(slotId) {

        if (!this.levelState?.board) {
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
                            slot.id === slotId
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