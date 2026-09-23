javascript
/**
 * LayerSystem
 *
 * Ejecuta el avance lógico de las Layers de un Shelf.
 *
 * Responsabilidad única:
 *
 *   aplicar sobre DynamicState una transición de exposición
 *   previamente calculada y validada por LayerRules.
 *
 * LayerSystem NO:
 *
 *   - decide si una Layer puede avanzar;
 *   - modifica Shelf.layers;
 *   - crea Layers;
 *   - elimina Layers;
 *   - mueve Objects;
 *   - cambia los Slots;
 *   - ejecuta tríos;
 *   - ejecuta colapsos;
 *   - determina victoria;
 *   - determina bloqueo.
 *
 * La identidad de las Layers permanece intacta.
 *
 * Ejemplo:
 *
 *     antes:
 *
 *     layer-0 → TOP
 *     layer-1 → SHADED
 *     layer-2 → INVISIBLE
 *     layer-3 → INVISIBLE
 *
 *     después:
 *
 *     layer-0 → INVISIBLE
 *     layer-1 → TOP
 *     layer-2 → SHADED
 *     layer-3 → INVISIBLE
 *
 * Los Objects siguen perteneciendo a sus Layers originales.
 */

import LayerRules from "../../rules/layer/LayerRules.js";

export default class LayerSystem {

    static REASON = Object.freeze({

        LAYER_ADVANCED:
            "LAYER_ADVANCED",

        LAYER_REJECTED:
            "LAYER_REJECTED"
    });

    constructor(levelState) {

        if (!levelState) {

            throw new Error(
                "LayerSystem: levelState es obligatorio."
            );
        }

        this.levelState =
            levelState;

        this.rules =
            new LayerRules(levelState);
    }

    /**
     * Ejecuta el avance de Layers de un Shelf.
     *
     * LayerRules realiza primero toda la validación.
     *
     * Si la validación falla:
     *
     *     no se modifica ningún estado.
     *
     * Si es válida:
     *
     *     solamente se actualiza DynamicState.
     *
     * @param {string|number} shelfId
     *
     * @returns {Object}
     */
    execute(shelfId) {

        /*
         * ========================================================
         * 1. VALIDACIÓN
         * ========================================================
         *
         * LayerRules es la autoridad para determinar:
         *
         *   - si existe el Shelf;
         *   - si existen Layers;
         *   - cuál es la TOP;
         *   - si la TOP está vacía;
         *   - si existen Layers posteriores;
         *   - cuál será la nueva exposición.
         */
        const validation =
            this.rules.validateAdvance(
                shelfId
            );

        /*
         * --------------------------------------------------------
         * Operación inválida
         * --------------------------------------------------------
         *
         * No modificamos DynamicState.
         */
        if (!validation.valid) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    LayerSystem.REASON.LAYER_REJECTED,

                validation
            };
        }

        /*
         * ========================================================
         * 2. VALIDAR EL RESULTADO DE LA REGLA
         * ========================================================
         *
         * Una transición válida debe contener una exposición
         * posterior completa.
         */
        if (
            !Array.isArray(
                validation.nextExposure
            )
        ) {

            return {

                valid:
                    false,

                executed:
                    false,

                reason:
                    LayerSystem.REASON.LAYER_REJECTED,

                validation: {

                    valid:
                        false,

                    reason:
                        "INVALID_LAYER_RESULT"
                }
            };
        }

        /*
         * ========================================================
         * 3. VALIDACIÓN TRANSACCIONAL
         * ========================================================
         *
         * Antes de tocar DynamicState verificamos TODAS
         * las entradas.
         *
         * Esto evita aplicar parcialmente una transición
         * corrupta.
         */
        for (
            const exposure
            of validation.nextExposure
        ) {

            if (
                !exposure ||
                exposure.layerId === undefined ||
                exposure.layerId === null ||
                exposure.state === undefined ||
                exposure.state === null
            ) {

                return {

                    valid:
                        false,

                    executed:
                        false,

                    reason:
                        LayerSystem.REASON.LAYER_REJECTED,

                    validation: {

                        valid:
                            false,

                        reason:
                            "INVALID_LAYER_RESULT"
                    }
                };
            }
        }

        /*
         * ========================================================
         * 4. APLICAR TRANSICIÓN
         * ========================================================
         *
         * IMPORTANTE:
         *
         * No modificamos:
         *
         *     shelf.layers
         *     layer.slots
         *     object.layer
         *
         * porque la identidad lógica de las Layers permanece.
         *
         * Solo cambia su exposición dinámica.
         */
        for (
            const exposure
            of validation.nextExposure
        ) {

            this.levelState.dynamic.setLayerState(
                exposure.layerId,
                exposure.state
            );
        }

        /*
         * ========================================================
         * 5. RESULTADO
         * ========================================================
         */

        return {

            valid:
                true,

            executed:
                true,

            reason:
                LayerSystem.REASON.LAYER_ADVANCED,

            shelfId:
                validation.shelfId,

            topLayerId:
                validation.topLayerId,

            previousExposure:
                validation.previousExposure,

            nextExposure:
                validation.nextExposure,

            advancedLayerIds:
                [
                    ...validation.advancedLayerIds
                ]
        };
    }

    /**
     * Alias semántico.
     *
     * Permite expresar la operación como:
     *
     *     layerSystem.advance(shelfId)
     */
    advance(shelfId) {

        return this.execute(
            shelfId
        );
    }
}

