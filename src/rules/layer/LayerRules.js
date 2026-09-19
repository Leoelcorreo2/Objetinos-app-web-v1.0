/**
 * LayerRules
 *
 * Regla pura para determinar el avance/exposición de Layers.
 *
 * Responsabilidad:
 *   - determinar la exposición actual de una Shelf;
 *   - determinar si la TOP puede avanzar;
 *   - calcular la nueva exposición de las Layers;
 *   - mantener la identidad de cada Layer.
 *
 * Esta regla NO modifica DynamicState ni la Shelf.
 * La aplicación del cambio corresponde posteriormente a LayerSystem.
 */

import StateQueries from "../../state/StateQueries.js";

export default class LayerRules {
    static STATE = Object.freeze({
        TOP: "TOP",
        SHADED: "SHADED",
        INVISIBLE: "INVISIBLE"
    });

    static REASON = Object.freeze({
        VALID_ADVANCE: "VALID_ADVANCE",
        SHELF_NOT_FOUND: "SHELF_NOT_FOUND",
        NO_LAYERS: "NO_LAYERS",
        TOP_NOT_FOUND: "TOP_NOT_FOUND",
        TOP_NOT_EMPTY: "TOP_NOT_EMPTY",
        LAST_LAYER: "LAST_LAYER"
    });

    constructor(levelState) {
        if (!levelState) {
            throw new Error(
                "LayerRules: LevelState es obligatorio."
            );
        }

        this.levelState = levelState;
        this.queries = new StateQueries(levelState);
    }

    /**
     * Devuelve la exposición actual de una Shelf.
     *
     * El orden del resultado es el orden lógico de shelf.layers.
     */
    getExposure(shelfId) {
        const shelf = this.queries.getShelf(shelfId);

        if (!shelf) {
            return null;
        }

        return shelf.layers.map(layer => ({
            layerId: layer.id,
            state: this.queries.getLayerState(layer.id)
        }));
    }

    /**
     * Devuelve la Layer actualmente TOP de una Shelf.
     */
    getTopLayer(shelfId) {
        const shelf = this.queries.getShelf(shelfId);

        if (!shelf) {
            return null;
        }

        return shelf.layers.find(
            layer => this.queries.isTopLayer(layer.id)
        ) ?? null;
    }

    /**
     * Determina si la TOP de una Shelf está completamente vacía.
     */
    isTopEmpty(shelfId) {
        const topLayer = this.getTopLayer(shelfId);

        if (!topLayer) {
            return false;
        }

        return topLayer.slots.every(
            slot => slot.isEmpty()
        );
    }

    /**
     * Determina si puede producirse un avance de Layers.
     *
     * Condiciones:
     *   - existe Shelf;
     *   - existe al menos una Layer;
     *   - existe una TOP;
     *   - la TOP está completamente vacía;
     *   - existen Layers posteriores.
     */
    canAdvance(shelfId) {
        return this.validateAdvance(shelfId).valid;
    }

    /**
     * Calcula si una Shelf debe avanzar y qué estados tendrán
     * sus Layers después del avance.
     *
     * NO modifica el estado.
     */
    validateAdvance(shelfId) {
        const result = {
            valid: false,
            reason: null,
            shelfId: shelfId ?? null,
            topLayerId: null,
            previousExposure: [],
            nextExposure: [],
            advancedLayerIds: []
        };

        if (
            shelfId === undefined ||
            shelfId === null
        ) {
            return this.#invalid(
                result,
                LayerRules.REASON.SHELF_NOT_FOUND
            );
        }

        const shelf =
            this.queries.getShelf(shelfId);

        if (!shelf) {
            return this.#invalid(
                result,
                LayerRules.REASON.SHELF_NOT_FOUND
            );
        }

        if (shelf.layers.length === 0) {
            return this.#invalid(
                result,
                LayerRules.REASON.NO_LAYERS
            );
        }

        const previousExposure =
            this.getExposure(shelfId);

        result.previousExposure =
            previousExposure;

        const topIndex =
            shelf.layers.findIndex(
                layer =>
                    this.queries.isTopLayer(
                        layer.id
                    )
            );

        if (topIndex === -1) {
            return this.#invalid(
                result,
                LayerRules.REASON.TOP_NOT_FOUND
            );
        }

        const topLayer =
            shelf.layers[topIndex];

        result.topLayerId =
            topLayer.id;

        if (!this.isTopEmpty(shelfId)) {
            return this.#invalid(
                result,
                LayerRules.REASON.TOP_NOT_EMPTY
            );
        }

        /*
         * Si la TOP vacía es la última Layer,
         * no existe avance de capas.
         *
         * El comportamiento específico de una Shelf SPECIAL
         * queda fuera de LayerRules y pertenece a CollapseRules.
         */
        if (
            topIndex ===
            shelf.layers.length - 1
        ) {
            return this.#invalid(
                result,
                LayerRules.REASON.LAST_LAYER
            );
        }

        /*
         * Las Layers NO cambian de identidad.
         *
         * Solo cambia su exposición:
         *
         * TOP       → INVISIBLE
         * SHADED    → TOP
         * INVISIBLE → SHADED
         *
         * Las posteriores permanecen INVISIBLE.
         */
        const nextExposure =
            shelf.layers.map(
                (layer, index) => ({
                    layerId: layer.id,
                    state:
                        this.#getStateAfterAdvance(
                            index,
                            topIndex
                        )
                })
            );

        result.nextExposure =
            nextExposure;

        result.advancedLayerIds =
            shelf.layers
                .filter(
                    (layer, index) =>
                        nextExposure[index].state !==
                        previousExposure[index].state
                )
                .map(
                    layer => layer.id
                );

        return {
            ...result,
            valid: true,
            reason:
                LayerRules.REASON.VALID_ADVANCE
        };
    }

    /**
     * Calcula el estado de una Layer después del avance.
     */
    #getStateAfterAdvance(
        index,
        topIndex
    ) {
        const relativeIndex =
            index - topIndex;

        if (relativeIndex === 0) {
            return LayerRules.STATE.INVISIBLE;
        }

        if (relativeIndex === 1) {
            return LayerRules.STATE.TOP;
        }

        if (relativeIndex === 2) {
            return LayerRules.STATE.SHADED;
        }

        /*
         * Cualquier Layer posterior permanece INVISIBLE.
         */
        if (relativeIndex >= 3) {
            return LayerRules.STATE.INVISIBLE;
        }

        /*
         * Protección frente a un estado incoherente
         * donde existan Layers anteriores a la TOP.
         */
        return LayerRules.STATE.INVISIBLE;
    }

    #invalid(result, reason) {
        return {
            ...result,
            valid: false,
            reason,
            nextExposure: [],
            advancedLayerIds: []
        };
    }
}