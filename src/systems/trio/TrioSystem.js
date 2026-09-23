javascript
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

        TRIO_EXECUTED:
            "TRIO_EXECUTED",

        TRIO_REJECTED:
            "TRIO_REJECTED"
    });

    constructor(levelState) {

        if (!levelState) {

            throw new Error(
                "TrioSystem: levelState es obligatorio."
            );
        }

        this.levelState =
            levelState;

        this.rules =
            new TrioRules(levelState);
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
    execute({
        destinationSlotId
    } = {}) {

        /*
         * ========================================================
         * 1. VALIDACIÓN
         * ========================================================
         *
         * TrioRules es la autoridad para determinar si existe
         * un trío válido.
         */
        const validation =
            this.rules.validate({
                destinationSlotId
            });

        /*
         * Si no existe un trío válido, no modificamos
         * absolutamente nada.
         */
        if (!validation.valid) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    TrioSystem.REASON.TRIO_REJECTED,

                validation
            };
        }

        /*
         * ========================================================
         * 2. VALIDAR RESULTADO DE LA REGLA
         * ========================================================
         *
         * La regla debe devolver exactamente tres Objects.
         *
         * Si no ocurre, abortamos antes de modificar el estado.
         */
        if (
            !Array.isArray(
                validation.objectIds
            ) ||
            validation.objectIds.length !== 3
        ) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    TrioSystem.REASON.TRIO_REJECTED,

                validation: {

                    valid:
                        false,

                    reason:
                        "INVALID_TRIO_RESULT"
                }
            };
        }

        /*
         * ========================================================
         * 3. COMPROBACIÓN TRANSACCIONAL
         * ========================================================
         *
         * Antes de limpiar ningún Slot comprobamos que:
         *
         *   - los tres Objects existen;
         *   - cada Object está realmente colocado en un Slot.
         *
         * De esta manera nunca podemos realizar una resolución
         * parcial.
         */

        const objects =
            [];

        for (
            const objectId
            of validation.objectIds
        ) {

            const object =
                this.levelState.getObjectById(
                    objectId
                );

            const slot =
                this.rules.queries.getSlotForObject(
                    objectId
                );

            if (
                !object ||
                !slot
            ) {

                return {

                    valid:
                        false,

                    executed:
                        false,

                    reason:
                        TrioSystem.REASON.TRIO_REJECTED,

                    validation: {

                        valid:
                            false,

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
         * ========================================================
         * 4. LIBERAR LOS SLOTS
         * ========================================================
         *
         * Los Slots permanecen en la Layer.
         *
         * Solamente desaparece su referencia al Object.
         */
        for (
            const {
                slot
            }
            of objects
        ) {

            slot.clear();
        }

        /*
         * ========================================================
         * 5. ELIMINAR OBJECTS
         * ========================================================
         *
         * Los tres Objects dejan de formar parte del estado
         * activo del nivel.
         */
        for (
            const {
                object
            }
            of objects
        ) {

            this.levelState.removeObject(
                object.id
            );
        }

        /*
         * ========================================================
         * 6. RESULTADO
         * ========================================================
         */

        return {

            valid:
                true,

            executed:
                true,

            reason:
                TrioSystem.REASON.TRIO_EXECUTED,

            destinationSlotId,

            objectIds: [
                ...validation.objectIds
            ]
        };
    }

    /**
     * Alias semántico de execute().
     */
    resolve({
        destinationSlotId
    } = {}) {

        return this.execute({
            destinationSlotId
        });
    }

    /**
     * Alias semántico de execute().
     *
     * Se mantiene por compatibilidad con el API actual.
     */
    advance({
        destinationSlotId
    } = {}) {

        return this.execute({
            destinationSlotId
        });
    }
}

