/**
 * TrioSystem
 *
 * Ejecuta la resolución de un trío previamente detectado
 * por TrioRules.
 *
 * Responsabilidades:
 *
 * - recibir el Slot destino del movimiento;
 * - solicitar a TrioRules la validación del trío;
 * - limpiar los Slots de los Objects resueltos;
 * - eliminar los Objects del registro de LevelState.
 *
 * NO es responsabilidad de TrioSystem:
 *
 * - decidir si existe un trío;
 * - modificar la estructura Board / Structure / Shelf / Layer;
 * - crear nuevos Objects;
 * - ejecutar el movimiento;
 * - avanzar Layers;
 * - realizar colapsos;
 * - comprobar victoria.
 *
 * Flujo:
 *
 *     MovementSystem
 *           ↓
 *     destinationSlotId
 *           ↓
 *     TrioSystem
 *           ↓
 *     TrioRules.validate()
 *           ↓
 *     objectIds
 *           ↓
 *     limpiar Slots
 *           ↓
 *     eliminar Objects de LevelState
 */

import TrioRules from "../../rules/trio/TrioRules.js";

export default class TrioSystem {
    static REASON = Object.freeze({
        TRIO_EXECUTED: "TRIO_EXECUTED",
        TRIO_REJECTED: "TRIO_REJECTED"
    });

    constructor(levelState) {
        if (!levelState) {
            throw new Error(
                "TrioSystem: levelState es obligatorio."
            );
        }

        this.levelState = levelState;
        this.rules = new TrioRules(levelState);
    }

    /**
     * Ejecuta la resolución de un posible trío.
     *
     * El punto de entrada es el Slot destino del movimiento.
     *
     * @param {Object} params
     * @param {string|number} params.destinationSlotId
     *
     * @returns {Object}
     */
    execute({ destinationSlotId } = {}) {
        const validation =
            this.rules.validate({
                destinationSlotId
            });

        /*
         * Si TrioRules determina que no existe un trío,
         * no modificamos absolutamente nada.
         */
        if (!validation.valid) {
            return {
                valid: false,
                executed: false,
                reason:
                    TrioSystem.REASON.TRIO_REJECTED,
                validation
            };
        }

        /*
         * Un resultado válido debe contener exactamente
         * los tres Objects que forman el trío.
         */
        if (
            !Array.isArray(validation.objectIds) ||
            validation.objectIds.length !== 3
        ) {
            return {
                valid: false,
                executed: false,
                reason:
                    TrioSystem.REASON.TRIO_REJECTED,
                validation: {
                    valid: false,
                    reason: "INVALID_TRIO_RESULT"
                }
            };
        }

        /*
         * Antes de modificar el estado verificamos que
         * todos los Objects existen y que cada uno está
         * realmente ubicado en un Slot.
         *
         * Esto evita realizar una resolución parcial.
         */
        const objects = [];

        for (const objectId of validation.objectIds) {
            const object =
                this.levelState.getObjectById(
                    objectId
                );

            const slot =
                this.rules.queries.getSlotForObject(
                    objectId
                );

            if (!object || !slot) {
                return {
                    valid: false,
                    executed: false,
                    reason:
                        TrioSystem.REASON.TRIO_REJECTED,
                    validation: {
                        valid: false,
                        reason:
                            "INVALID_TRIO_STATE"
                    }
                };
            }

            objects.push({
                object,
                slot
            });
        }

        /*
         * 1. Liberamos los Slots.
         *
         * Los Slots NO se eliminan.
         * Mantienen su identidad y su posición dentro
         * de la Layer.
         */
        for (const { slot } of objects) {
            slot.clear();
        }

        /*
         * 2. Eliminamos los Objects del registro de LevelState.
         *
         * La identidad de los Objects deja de formar parte
         * del estado activo del nivel.
         */
        for (const { object } of objects) {
            this.levelState.removeObject(
                object.id
            );
        }

        return {
            valid: true,
            executed: true,
            reason:
                TrioSystem.REASON.TRIO_EXECUTED,
            destinationSlotId,
            objectIds: [
                ...validation.objectIds
            ]
        };
    }

    /**
     * Alias semántico para execute().
     *
     * @param {Object} params
     * @param {string|number} params.destinationSlotId
     */
    resolve({ destinationSlotId } = {}) {
        return this.execute({
            destinationSlotId
        });
    }

    /**
     * Alias semántico para execute().
     *
     * @param {Object} params
     * @param {string|number} params.destinationSlotId
     */
    advance({ destinationSlotId } = {}) {
        return this.execute({
            destinationSlotId
        });
    }
}