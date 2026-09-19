/**
 * CollapseRules
 *
 * Determina si una Shelf puede colapsar.
 *
 * Regla definida en la especificación:
 *
 *     behavior = COLLAPSIBLE
 *     AND
 *     todas sus Layers están vacías
 *
 * IMPORTANTE:
 * - No ejecuta el colapso.
 * - No elimina la Shelf.
 * - No mueve otras Shelves.
 * - No modifica Layers ni Slots.
 * - No modifica la identidad lógica del estado.
 *
 * El colapso físico será responsabilidad de un sistema posterior.
 */

import StateQueries from "../../state/StateQueries.js";

export default class CollapseRules {
    static REASON = Object.freeze({
        VALID_COLLAPSE: "VALID_COLLAPSE",
        SHELF_NOT_FOUND: "SHELF_NOT_FOUND",
        NO_LAYERS: "NO_LAYERS",
        NOT_COLLAPSIBLE: "NOT_COLLAPSIBLE",
        SHELF_NOT_EMPTY: "SHELF_NOT_EMPTY"
    });

    constructor(levelState) {
        if (!levelState) {
            throw new Error(
                "CollapseRules: levelState es obligatorio."
            );
        }

        this.levelState = levelState;
        this.queries = new StateQueries(levelState);
    }

    /**
     * Determina si una Shelf cumple las condiciones para colapsar.
     *
     * NO modifica el estado.
     *
     * Resultado:
     *
     * {
     *     valid,
     *     reason,
     *     shelfId,
     *     layerIds,
     *     occupiedLayerIds
     * }
     */
    validate(shelfId) {
        const shelf = this.queries.getShelf(shelfId);

        if (!shelf) {
            return {
                valid: false,
                reason: CollapseRules.REASON.SHELF_NOT_FOUND,
                shelfId,
                layerIds: []
            };
        }

        const layerIds = shelf.layers.map(
            layer => layer.id
        );

        /*
         * Una Shelf sin Layers no puede cumplir la regla
         * "todas sus Layers están vacías".
         */
        if (layerIds.length === 0) {
            return {
                valid: false,
                reason: CollapseRules.REASON.NO_LAYERS,
                shelfId,
                layerIds
            };
        }

        /*
         * STANDARD nunca colapsa simplemente por estar vacío.
         */
        if (
            shelf.behavior !==
            shelf.constructor.BEHAVIOR.COLLAPSIBLE
        ) {
            return {
                valid: false,
                reason: CollapseRules.REASON.NOT_COLLAPSIBLE,
                shelfId,
                layerIds
            };
        }

        const occupiedLayerIds = [];

        /*
         * La condición se comprueba sobre TODAS las Layers.
         *
         * No importa si una Layer está:
         * - TOP
         * - SHADED
         * - INVISIBLE
         *
         * Si contiene algún Object, la Shelf no está completamente vacía.
         */
        for (const layer of shelf.layers) {
            const hasObjects = layer.slots.some(
                slot => !slot.isEmpty()
            );

            if (hasObjects) {
                occupiedLayerIds.push(layer.id);
            }
        }

        if (occupiedLayerIds.length > 0) {
            return {
                valid: false,
                reason: CollapseRules.REASON.SHELF_NOT_EMPTY,
                shelfId,
                layerIds,
                occupiedLayerIds
            };
        }

        /*
         * COLLAPSIBLE + todas las Layers vacías.
         */
        return {
            valid: true,
            reason: CollapseRules.REASON.VALID_COLLAPSE,
            shelfId,
            layerIds,
            occupiedLayerIds: []
        };
    }

    /**
     * Atajo booleano.
     */
    canCollapse(shelfId) {
        return this.validate(shelfId).valid;
    }

    /**
     * Determina si todas las Layers de una Shelf están vacías.
     *
     * Esta consulta es independiente del comportamiento
     * STANDARD/COLLAPSIBLE.
     *
     * Por tanto:
     *
     *     STANDARD + todas vacías -> true
     *     COLLAPSIBLE + todas vacías -> true
     *
     * La decisión de si puede colapsar corresponde a canCollapse().
     */
    areAllLayersEmpty(shelfId) {
        const shelf = this.queries.getShelf(shelfId);

        if (!shelf || shelf.layers.length === 0) {
            return false;
        }

        return shelf.layers.every(layer =>
            layer.slots.every(
                slot => slot.isEmpty()
            )
        );
    }
}