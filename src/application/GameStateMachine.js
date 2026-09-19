/**
 * GameStateMachine
 *
 * Máquina de estados explícita del flujo general de Objetinos.
 *
 * Esta clase NO contiene reglas de juego.
 *
 * Su responsabilidad exclusiva es:
 *
 * - mantener el estado actual del flujo;
 * - validar transiciones;
 * - ejecutar transiciones válidas;
 * - impedir transiciones inválidas.
 *
 * Estados conceptuales definidos por la especificación:
 *
 * BOOT
 * MENU
 * LOADING_LEVEL
 * READY
 * DRAGGING
 * RESOLVING
 * BLOCKED
 * PAUSED
 * VICTORY
 * TIME_OUT
 * LIFE_LOST
 * GAME_OVER
 */
export default class GameStateMachine {

    static STATE = Object.freeze({

        BOOT: "BOOT",

        MENU: "MENU",

        LOADING_LEVEL: "LOADING_LEVEL",

        READY: "READY",

        DRAGGING: "DRAGGING",

        RESOLVING: "RESOLVING",

        BLOCKED: "BLOCKED",

        PAUSED: "PAUSED",

        VICTORY: "VICTORY",

        TIME_OUT: "TIME_OUT",

        LIFE_LOST: "LIFE_LOST",

        GAME_OVER: "GAME_OVER"
    });


    static VALUES = Object.freeze([
        GameStateMachine.STATE.BOOT,
        GameStateMachine.STATE.MENU,
        GameStateMachine.STATE.LOADING_LEVEL,
        GameStateMachine.STATE.READY,
        GameStateMachine.STATE.DRAGGING,
        GameStateMachine.STATE.RESOLVING,
        GameStateMachine.STATE.BLOCKED,
        GameStateMachine.STATE.PAUSED,
        GameStateMachine.STATE.VICTORY,
        GameStateMachine.STATE.TIME_OUT,
        GameStateMachine.STATE.LIFE_LOST,
        GameStateMachine.STATE.GAME_OVER
    ]);


    static REASON = Object.freeze({

        VALID_TRANSITION:
            "VALID_TRANSITION",

        INVALID_STATE:
            "INVALID_STATE",

        INVALID_TRANSITION:
            "INVALID_TRANSITION",

        SAME_STATE:
            "SAME_STATE"
    });


    /**
     * Tabla explícita de transiciones.
     *
     * La tabla representa el flujo permitido por la arquitectura.
     *
     * IMPORTANTE:
     *
     * Una transición que no aparezca aquí es inválida.
     */
    static TRANSITIONS = Object.freeze({

        BOOT: Object.freeze([
            "MENU"
        ]),

        MENU: Object.freeze([
            "LOADING_LEVEL"
        ]),

        LOADING_LEVEL: Object.freeze([
            "READY"
        ]),

        READY: Object.freeze([
            "DRAGGING",
            "PAUSED"
        ]),

        DRAGGING: Object.freeze([
            "RESOLVING",
            "READY",
            "PAUSED"
        ]),

        RESOLVING: Object.freeze([
            "READY",
            "BLOCKED",
            "VICTORY",
            "TIME_OUT",
            "PAUSED"
        ]),

        BLOCKED: Object.freeze([
            "READY",
            "PAUSED",
            "LIFE_LOST"
        ]),

        PAUSED: Object.freeze([
            "READY",
            "DRAGGING",
            "RESOLVING",
            "BLOCKED",
            "VICTORY",
            "TIME_OUT",
            "LIFE_LOST"
        ]),

        VICTORY: Object.freeze([
            "LOADING_LEVEL",
            "MENU"
        ]),

        TIME_OUT: Object.freeze([
            "LIFE_LOST",
            "GAME_OVER"
        ]),

        LIFE_LOST: Object.freeze([
            "LOADING_LEVEL",
            "MENU",
            "GAME_OVER"
        ]),

        GAME_OVER: Object.freeze([
            "MENU"
        ])
    });


    constructor(initialState = GameStateMachine.STATE.BOOT) {

        if (!GameStateMachine.isValid(initialState)) {

            throw new Error(
                `GameStateMachine: estado inicial inválido "${initialState}".`
            );
        }


        this.currentState = initialState;
    }


    /**
     * Comprueba si un estado pertenece a la máquina.
     */
    static isValid(state) {

        return GameStateMachine.VALUES.includes(
            state
        );
    }


    /**
     * Devuelve el estado actual.
     */
    getState() {

        return this.currentState;
    }


    /**
     * Comprueba si el estado actual coincide con el indicado.
     */
    is(state) {

        return this.currentState === state;
    }


    /**
     * Devuelve los estados a los que se puede transitar
     * desde el estado actual.
     */
    getAvailableTransitions() {

        return [
            ...(
                GameStateMachine.TRANSITIONS[
                    this.currentState
                ] ?? []
            )
        ];
    }


    /**
     * Comprueba si una transición es válida sin modificar
     * el estado actual.
     */
    canTransitionTo(nextState) {

        if (
            !GameStateMachine.isValid(
                nextState
            )
        ) {

            return false;
        }


        return this.getAvailableTransitions()
            .includes(nextState);
    }


    /**
     * Valida una transición.
     *
     * NO modifica el estado.
     */
    validateTransition(nextState) {

        if (
            !GameStateMachine.isValid(
                nextState
            )
        ) {

            return {
                valid: false,

                reason:
                    GameStateMachine.REASON.INVALID_STATE,

                from:
                    this.currentState,

                to:
                    nextState
            };
        }


        if (
            this.currentState ===
            nextState
        ) {

            return {
                valid: false,

                reason:
                    GameStateMachine.REASON.SAME_STATE,

                from:
                    this.currentState,

                to:
                    nextState
            };
        }


        if (
            !this.canTransitionTo(
                nextState
            )
        ) {

            return {
                valid: false,

                reason:
                    GameStateMachine.REASON.INVALID_TRANSITION,

                from:
                    this.currentState,

                to:
                    nextState
            };
        }


        return {
            valid: true,

            reason:
                GameStateMachine.REASON.VALID_TRANSITION,

            from:
                this.currentState,

            to:
                nextState
        };
    }


    /**
     * Ejecuta una transición válida.
     *
     * Las transiciones inválidas no modifican el estado.
     */
    transitionTo(nextState) {

        const validation =
            this.validateTransition(
                nextState
            );


        if (!validation.valid) {

            return {
                ...validation,

                transitioned: false,

                state:
                    this.currentState
            };
        }


        const previousState =
            this.currentState;


        this.currentState =
            nextState;


        return {
            ...validation,

            transitioned: true,

            previousState,

            state:
                this.currentState
        };
    }


    /**
     * Alias semántico para transitionTo().
     */
    transition(nextState) {

        return this.transitionTo(
            nextState
        );
    }


    /**
     * Reinicia la máquina.
     *
     * Se utiliza para comenzar una nueva partida.
     */
    reset() {

        const previousState =
            this.currentState;


        this.currentState =
            GameStateMachine.STATE.BOOT;


        return {
            transitioned:
                previousState !==
                GameStateMachine.STATE.BOOT,

            previousState,

            state:
                this.currentState
        };
    }
}