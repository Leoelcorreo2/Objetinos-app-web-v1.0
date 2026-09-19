/**
 * LayerSystem
 *
 * Ejecuta el avance de Layers previamente calculado
 * por LayerRules.
 *
 * Responsabilidades:
 *
 * - solicitar a LayerRules la validación del avance;
 * - aplicar al DynamicState la nueva exposición calculada;
 * - mantener intacta la identidad y estructura de las Layers.
 *
 * NO es responsabilidad de LayerSystem:
 *
 * - decidir si una Layer puede avanzar;
 * - modificar Shelf.layers;
 * - crear o eliminar Layers;
 * - modificar Slots;
 * - mover Objects;
 * - ejecutar tríos;
 * - colapsar Shelves;
 * - determinar victoria o bloqueo.
 *
 * Flujo:
 *
 *     LayerRules
 *          ↓
 *     validateAdvance()
 *          ↓
 *     nextExposure
 *          ↓
 *     LayerSystem
 *          ↓
 *     DynamicState
 */

import LayerRules from "../../rules/layer/LayerRules.js";

export default class LayerSystem {
    static REASON = Object.freeze({
        LAYER_ADVANCED: "LAYER_ADVANCED",
        LAYER_REJECTED: "LAYER_REJECTED"
    });

    constructor(levelState) {
        if (!levelState) {
            throw new Error(
                "LayerSystem: levelState es obligatorio."
            );
        }

        this.levelState = levelState;
        this.rules = new LayerRules(levelState);
    }

    /**
     * Ejecuta el avance de Layers de una Shelf.
     *
     * El método primero solicita a LayerRules el resultado
     * del avance.
     *
     * Si la operación no es válida, el estado permanece
     * completamente inalterado.
     *
     * Si es válida, aplica exclusivamente los estados
     * calculados en nextExposure al DynamicState.
     */
    execute(shelfId) {
        const validation =
            this.rules.validateAdvance(shelfId);

        /*
         * Una operación inválida no modifica ningún estado.
         */
        if (!validation.valid) {
            return {
                valid: false,
                executed: false,
                reason:
                    LayerSystem.REASON.LAYER_REJECTED,
                validation
            };
        }

        /*
         * La regla debe proporcionar una exposición
         * posterior válida.
         */
        if (
            !Array.isArray(validation.nextExposure)
        ) {
            return {
                valid: false,
                executed: false,
                reason:
                    LayerSystem.REASON.LAYER_REJECTED,
                validation: {
                    valid: false,
                    reason: "INVALID_LAYER_RESULT"
                }
            };
        }

        /*
         * Aplicamos exclusivamente el estado dinámico.
         *
         * Las Layers siguen siendo las mismas entidades.
         * No modificamos Shelf.layers ni sus Slots.
         */
        for (const exposure of validation.nextExposure) {
            if (
                !exposure ||
                exposure.layerId === undefined ||
                exposure.layerId === null ||
                exposure.state === undefined ||
                exposure.state === null
            ) {
                return {
                    valid: false,
                    executed: false,
                    reason:
                        LayerSystem.REASON.LAYER_REJECTED,
                    validation: {
                        valid: false,
                        reason:
                            "INVALID_LAYER_RESULT"
                    }
                };
            }
        }

        for (const exposure of validation.nextExposure) {
            this.levelState.dynamic.setLayerState(
                exposure.layerId,
                exposure.state
            );
        }

        return {
            valid: true,
            executed: true,
            reason:
                LayerSystem.REASON.LAYER_ADVANCED,
            shelfId: validation.shelfId,
            topLayerId: validation.topLayerId,
            previousExposure:
                validation.previousExposure,
            nextExposure:
                validation.nextExposure,
            advancedLayerIds:
                [...validation.advancedLayerIds]
        };
    }

    /**
     * Alias semántico.
     */
    advance(shelfId) {
        return this.execute(shelfId);
    }
}
