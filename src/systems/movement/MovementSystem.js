/**
 * MovementSystem
 *
 * Ejecuta un movimiento de Object previamente validado
 * por MovementRules.
 *
 * Flujo:
 *
 *     MovementRules
 *          ↓
 *     ¿Movimiento válido?
 *          ↓
 *     MovementSystem
 *          ↓
 *     mueve Object de Slot origen a Slot destino
 *
 * IMPORTANTE:
 * - MovementSystem NO reinventa las reglas de movimiento.
 * - MovementSystem delega la validación en MovementRules.
 * - Si el movimiento no es válido, no modifica el estado.
 * - El Object mantiene su identidad.
 * - El Object no se modifica.
 * - Solamente cambian las referencias objectId de los Slots.
 *
 * La detección de tríos, avance de Layers, colapsos y victoria
 * pertenecen a sistemas posteriores.
 */

import StateQueries from "../../state/StateQueries.js";
import MovementRules from "../../rules/movement/MovementRules.js";

export default class MovementSystem {
    static REASON = Object.freeze({
        MOVEMENT_EXECUTED: "MOVEMENT_EXECUTED",
        MOVEMENT_REJECTED: "MOVEMENT_REJECTED"
    });

    constructor(levelState) {
        if (!levelState) {
            throw new Error(
                "MovementSystem: levelState es obligatorio."
            );
        }

        this.levelState = levelState;
        this.queries = new StateQueries(levelState);
        this.rules = new MovementRules(levelState);
    }

    /**
     * Intenta ejecutar un movimiento.
     *
     * Parámetros:
     *
     * {
     *     objectId,
     *     destinationSlotId
     * }
     *
     * Primero se valida el movimiento.
     * Solamente si la validación es correcta se modifica
     * el estado.
     */
    execute({
        objectId,
        destinationSlotId
    }) {
        const validation =
            this.rules.validate({
                objectId,
                destinationSlotId
            });

        /*
         * Nunca modificamos el estado si la validación falla.
         */
        if (!validation.valid) {
            return {
                valid: false,
                executed: false,
                reason:
                    MovementSystem.REASON.MOVEMENT_REJECTED,
                validation
            };
        }

        /*
         * Volvemos a localizar los elementos desde el estado
         * actual. No utilizamos referencias obtenidas antes de
         * la validación como fuente de verdad.
         */
        const location =
            this.queries.getObjectLocation(objectId);

        const destinationSlot =
            this.queries.getSlot(destinationSlotId);

        /*
         * La validación ya garantiza estas condiciones.
         * Si la estructura del estado fuese inconsistente entre
         * validación y ejecución, abortamos sin modificar nada.
         */
        if (!location || !destinationSlot) {
            return {
                valid: false,
                executed: false,
                reason:
                    MovementSystem.REASON.MOVEMENT_REJECTED,
                validation: {
                    valid: false,
                    reason: "STATE_CHANGED_AFTER_VALIDATION"
                }
            };
        }

        const sourceSlot =
            location.slot;

        /*
         * Protección adicional:
         *
         * nunca permitimos ejecutar sobre el mismo Slot.
         */
        if (
            sourceSlot.id ===
            destinationSlot.id
        ) {
            return {
                valid: false,
                executed: false,
                reason:
                    MovementSystem.REASON.MOVEMENT_REJECTED,
                validation: {
                    valid: false,
                    reason:
                        MovementRules.REASON.SAME_SLOT
                }
            };
        }

        /*
         * Ejecutamos el movimiento.
         *
         * Primero ocupamos el destino y después liberamos
         * el origen.
         *
         * El Object en sí no se modifica.
         * Su ubicación lógica cambia exclusivamente porque
         * cambia la referencia objectId del Slot.
         */
        destinationSlot.setObject(objectId);
        sourceSlot.clear();

        return {
            valid: true,
            executed: true,
            reason:
                MovementSystem.REASON.MOVEMENT_EXECUTED,

            objectId,

            sourceSlotId:
                sourceSlot.id,

            destinationSlotId:
                destinationSlot.id
        };
    }

    /**
     * Alias semántico para ejecutar un movimiento.
     */
    move({
        objectId,
        destinationSlotId
    }) {
        return this.execute({
            objectId,
            destinationSlotId
        });
    }
}