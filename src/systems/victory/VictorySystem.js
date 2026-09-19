/**
 * VictorySystem
 *
 * Ejecuta la consecuencia de una victoria previamente validada
 * por VictoryRules.
 *
 * Responsabilidades:
 *
 * - solicitar a VictoryRules la validación;
 * - cambiar la fase global de LevelState a WON cuando la
 *   condición de victoria se cumple;
 * - no modificar Objects, Slots ni la estructura del Board.
 *
 * NO es responsabilidad de VictorySystem:
 *
 * - decidir cuándo existe victoria por su cuenta;
 * - eliminar Objects;
 * - modificar Slots;
 * - modificar Shelves, Layers o Structures;
 * - detectar bloqueo;
 * - gestionar vidas o tiempo.
 *
 * Flujo:
 *
 *     VictoryRules
 *          ↓
 *      validate()
 *          ↓
 *     VictorySystem
 *          ↓
 *     LevelState.phase = WON
 */

import VictoryRules from "../../rules/victory/VictoryRules.js";
import GamePhase from "../../state/GamePhase.js";

export default class VictorySystem {
    static REASON = Object.freeze({
        VICTORY_EXECUTED: "VICTORY_EXECUTED",
        VICTORY_REJECTED: "VICTORY_REJECTED"
    });

    constructor(levelState) {
        if (!levelState) {
            throw new Error(
                "VictorySystem: levelState es obligatorio."
            );
        }

        this.levelState = levelState;
        this.rules = new VictoryRules(levelState);
    }

    /**
     * Intenta ejecutar la victoria.
     *
     * La regla se consulta antes de realizar cualquier mutación.
     *
     * Si totalObjects !== 0:
     *
     * - no existe victoria;
     * - no se modifica la fase;
     * - no se modifica ninguna otra parte del estado.
     *
     * Si totalObjects === 0:
     *
     * - la victoria se ejecuta;
     * - la fase global pasa a WON.
     *
     * La única mutación propia de VictorySystem es
     * cambiar la fase global.
     */
    execute() {
        const validation =
            this.rules.validate();

        /*
         * Si la condición de victoria no se cumple,
         * no modificamos absolutamente nada.
         */
        if (!validation.valid) {
            return {
                valid: false,
                executed: false,
                reason:
                    VictorySystem.REASON.VICTORY_REJECTED,
                validation,
                phase:
                    this.levelState.getPhase()
            };
        }

        /*
         * La condición de victoria se cumple.
         *
         * La única mutación realizada por este sistema
         * es cambiar la fase global a WON.
         */
        const previousPhase =
            this.levelState.getPhase();

        this.levelState.setPhase(
            GamePhase.WON
        );

        return {
            valid: true,
            executed: true,
            reason:
                VictorySystem.REASON.VICTORY_EXECUTED,

            totalObjects:
                validation.totalObjects,

            previousPhase,

            phase:
                this.levelState.getPhase()
        };
    }

    /**
     * Alias semántico.
     */
    check() {
        return this.execute();
    }

    /**
     * Alias semántico.
     */
    win() {
        return this.execute();
    }
}