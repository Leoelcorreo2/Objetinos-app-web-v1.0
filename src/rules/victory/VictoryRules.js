/**
 * VictoryRules
 *
 * Determina si el nivel cumple la condición de victoria.
 *
 * Regla definida en la especificación:
 *
 *     totalObjects = 0
 *
 * IMPORTANTE:
 * - No cambia la fase de la partida.
 * - No elimina objetos.
 * - No modifica Slots.
 * - No ejecuta ninguna acción.
 *
 * La ejecución de la victoria corresponde a VictorySystem.
 */

export default class VictoryRules {
    static REASON = Object.freeze({
        VICTORY: "VICTORY",
        OBJECTS_REMAINING: "OBJECTS_REMAINING"
    });

    constructor(levelState) {
        if (!levelState) {
            throw new Error(
                "VictoryRules: levelState es obligatorio."
            );
        }

        this.levelState = levelState;
    }

    /**
     * Valida la condición de victoria.
     *
     * La condición se basa exclusivamente en el número
     * de Objects registrados en LevelState.
     */
    validate() {
        const totalObjects =
            this.levelState.getObjectCount();

        if (totalObjects === 0) {
            return {
                valid: true,
                reason: VictoryRules.REASON.VICTORY,
                totalObjects
            };
        }

        return {
            valid: false,
            reason: VictoryRules.REASON.OBJECTS_REMAINING,
            totalObjects
        };
    }

    /**
     * Atajo booleano.
     */
    isVictory() {
        return this.validate().valid;
    }
}