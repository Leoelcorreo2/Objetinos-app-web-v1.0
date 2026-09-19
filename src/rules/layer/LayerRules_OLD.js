 /**
  * LayerRules
  *
  * Reglas puras relacionadas con el estado y avance de Layers.
  *
  * IMPORTANTE:
  * - No modifica LevelState.
  * - No modifica DynamicState.
  * - No modifica Layers, Slots ni Objects.
  * - No conoce HTML, CSS, rendering ni animaciones.
  *
  * La aplicación efectiva de estas decisiones será responsabilidad
  * de LayerSystem.
  */

export default class LayerRules {
    static STATE = Object.freeze({
        TOP: "TOP",
        SHADED: "SHADED",
        INVISIBLE: "INVISIBLE"
    });

    /**
     * Determina si un Layer contiene al menos un objeto.
     */
    static isLayerOccupied(layer) {
        if (!layer) {
            throw new Error(
                "LayerRules: el Layer es obligatorio."
            );
        }

        return layer.slots.some(
            slot => slot.objectId !== null
        );
    }

    /**
     * Determina si un Layer está completamente vacío.
     */
    static isLayerEmpty(layer) {
        return !LayerRules.isLayerOccupied(layer);
    }

    /**
     * Determina si existe algún objeto en las Layers posteriores
     * a la indicada.
     */
    static hasObjectsInLaterLayers(shelf, layerIndex) {
        if (!shelf) {
            throw new Error(
                "LayerRules: la Shelf es obligatoria."
            );
        }

        for (
            let index = layerIndex + 1;
            index < shelf.layers.length;
            index++
        ) {
            if (LayerRules.isLayerOccupied(shelf.layers[index])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determina el índice de la Layer que actualmente está en TOP
     * según DynamicState.
     *
     * Devuelve -1 si no existe una TOP registrada.
     */
    static getTopLayerIndex(shelf, dynamicState) {
        if (!shelf) {
            throw new Error(
                "LayerRules: la Shelf es obligatoria."
            );
        }

        if (!dynamicState) {
            throw new Error(
                "LayerRules: DynamicState es obligatorio."
            );
        }

        for (let index = 0; index < shelf.layers.length; index++) {
            const layer = shelf.layers[index];

            if (
                dynamicState.getLayerState(layer.id) ===
                LayerRules.STATE.TOP
            ) {
                return index;
            }
        }

        return -1;
    }

    /**
     * Devuelve la Layer que actualmente está en TOP.
     *
     * Devuelve null si no existe.
     */
    static getTopLayer(shelf, dynamicState) {
        const index = LayerRules.getTopLayerIndex(
            shelf,
            dynamicState
        );

        if (index === -1) {
            return null;
        }

        return shelf.layers[index];
    }

    /**
     * Devuelve los objetos contenidos en la Layer TOP.
     *
     * Esta consulta no decide si los objetos pueden interactuar.
     * Esa decisión pertenece a las reglas de selección/movimiento.
     */
    static getTopObjects(shelf, dynamicState, objects) {
        const topLayer = LayerRules.getTopLayer(
            shelf,
            dynamicState
        );

        if (!topLayer) {
            return [];
        }

        if (!Array.isArray(objects)) {
            throw new Error(
                "LayerRules: objects debe ser un array."
            );
        }

        const objectById = new Map(
            objects.map(object => [object.id, object])
        );

        const result = [];

        for (const slot of topLayer.slots) {
            if (slot.objectId === null) {
                continue;
            }

            const object = objectById.get(slot.objectId);

            if (object) {
                result.push(object);
            }
        }

        return result;
    }

    /**
     * Determina si la TOP puede avanzar.
     *
     * Solo puede avanzar si:
     *
     * 1. existe una TOP;
     * 2. la TOP está completamente vacía;
     * 3. existen Layers posteriores.
     *
     * En ese caso:
     *
     * TOP
     *   ↓
     * SHADED -> TOP
     * INVISIBLE -> SHADED
     */
    static canAdvance(shelf, dynamicState) {
        const topIndex = LayerRules.getTopLayerIndex(
            shelf,
            dynamicState
        );

        if (topIndex === -1) {
            return false;
        }

        const topLayer = shelf.layers[topIndex];

        if (!LayerRules.isLayerEmpty(topLayer)) {
            return false;
        }

        return topIndex < shelf.layers.length - 1;
    }

    /**
     * Determina si la TOP vacía es la última Layer de una Shelf.
     */
    static isLastTopLayer(shelf, dynamicState) {
        const topIndex = LayerRules.getTopLayerIndex(
            shelf,
            dynamicState
        );

        if (topIndex === -1) {
            return false;
        }

        return topIndex === shelf.layers.length - 1;
    }

    /**
     * Determina si la última TOP vacía pertenece a una Shelf NORMAL.
     *
     * En este caso la Shelf NO desaparece.
     */
    static isFinalNormalLayer(shelf, dynamicState) {
        if (!shelf) {
            throw new Error(
                "LayerRules: la Shelf es obligatoria."
            );
        }

        if (!dynamicState) {
            throw new Error(
                "LayerRules: DynamicState es obligatorio."
            );
        }

        const topLayer = LayerRules.getTopLayer(
            shelf,
            dynamicState
        );

        if (!topLayer || !LayerRules.isLayerEmpty(topLayer)) {
            return false;
        }

        if (!LayerRules.isLastTopLayer(shelf, dynamicState)) {
            return false;
        }

        return shelf.type === "NORMAL";
    }

    /**
     * Determina si la última TOP vacía pertenece a una Shelf SPECIAL.
     *
     * La especificación establece que deja de aceptar objetos.
     * La forma visual concreta de desaparición/cierre se resolverá
     * posteriormente.
     */
    static isFinalSpecialLayer(shelf, dynamicState) {
        if (!shelf) {
            throw new Error(
                "LayerRules: la Shelf es obligatoria."
            );
        }

        if (!dynamicState) {
            throw new Error(
                "LayerRules: DynamicState es obligatorio."
            );
        }

        const topLayer = LayerRules.getTopLayer(
            shelf,
            dynamicState
        );

        if (!topLayer || !LayerRules.isLayerEmpty(topLayer)) {
            return false;
        }

        if (!LayerRules.isLastTopLayer(shelf, dynamicState)) {
            return false;
        }

        return shelf.type === "SPECIAL";
    }

    /**
     * Calcula cómo quedarían los estados de las Layers después
     * de un avance.
     *
     * NO modifica DynamicState.
     *
     * Devuelve un array:
     *
     * [
     *   { layerId, state },
     *   ...
     * ]
     */
    static calculateAdvance(shelf, dynamicState) {
        if (!LayerRules.canAdvance(shelf, dynamicState)) {
            return null;
        }

        const topIndex = LayerRules.getTopLayerIndex(
            shelf,
            dynamicState
        );

        const result = [];

        for (let index = 0; index < shelf.layers.length; index++) {
            const layer = shelf.layers[index];

            let state = LayerRules.STATE.INVISIBLE;

            if (index === topIndex + 1) {
                state = LayerRules.STATE.TOP;
            } else if (index === topIndex + 2) {
                state = LayerRules.STATE.SHADED;
            }

            result.push({
                layerId: layer.id,
                state
            });
        }

        return result;
    }

    /**
     * Devuelve el estado que debería tener cada Layer durante
     * la inicialización de una Shelf.
     *
     * La primera Layer siempre comienza como TOP.
     * La segunda como SHADED.
     * Las posteriores como INVISIBLE.
     *
     * Esto es importante porque una TOP puede comenzar vacía.
     */
    static calculateInitialStates(shelf) {
        if (!shelf) {
            throw new Error(
                "LayerRules: la Shelf es obligatoria."
            );
        }

        return shelf.layers.map((layer, index) => {
            let state = LayerRules.STATE.INVISIBLE;

            if (index === 0) {
                state = LayerRules.STATE.TOP;
            } else if (index === 1) {
                state = LayerRules.STATE.SHADED;
            }

            return {
                layerId: layer.id,
                state
            };
        });
    }
}