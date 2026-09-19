```javascript
/**
 * CollapseRules
 *
 * Reglas puras relacionadas con el colapso de Shelves.
 *
 * IMPORTANTE:
 * - No modifica LevelState.
 * - No modifica DynamicState.
 * - No modifica Shelf ni Layers.
 * - No conoce HTML, CSS, rendering ni animaciones.
 *
 * Esta clase únicamente determina si una Shelf debe colapsar.
 * La aplicación efectiva de la decisión corresponderá a CollapseSystem.
 */

export default class CollapseRules {
    static BEHAVIOR = Object.freeze({
        STANDARD: "STANDARD",
        COLLAPSIBLE: "COLLAPSIBLE"
    });

    /**
     * Determina si una Layer está completamente vacía.
     *
     * Una Layer está vacía cuando ninguno de sus Slots
     * contiene un Object.
     *
     * @param {Layer} layer
     * @returns {boolean}
     */
    static isLayerEmpty(layer) {
        if (!layer) {
            throw new Error(
                "CollapseRules: el Layer es obligatorio."
            );
        }

        return layer.slots.every(
            slot => slot.objectId === null
        );
    }

    /**
     * Determina si todas las Layers de una Shelf
     * están completamente vacías.
     *
     * @param {Shelf} shelf
     * @returns {boolean}
     */
    static areAllLayersEmpty(shelf) {
        if (!shelf) {
            throw new Error(
                "CollapseRules: la Shelf es obligatoria."
            );
        }

        return shelf.layers.every(
            layer => CollapseRules.isLayerEmpty(layer)
        );
    }

    /**
     * Determina si una Shelf tiene comportamiento COLLAPSIBLE.
     *
     * @param {Shelf} shelf
     * @returns {boolean}
     */
    static isCollapsible(shelf) {
        if (!shelf) {
            throw new Error(
                "CollapseRules: la Shelf es obligatoria."
            );
        }

        return (
            shelf.behavior ===
            CollapseRules.BEHAVIOR.COLLAPSIBLE
        );
    }

    /**
     * Determina si una Shelf tiene comportamiento STANDARD.
     *
     * @param {Shelf} shelf
     * @returns {boolean}
     */
    static isStandard(shelf) {
        if (!shelf) {
            throw new Error(
                "CollapseRules: la Shelf es obligatoria."
            );
        }

        return (
            shelf.behavior ===
            CollapseRules.BEHAVIOR.STANDARD
        );
    }

    /**
     * Determina si la Shelf debe colapsar.
     *
     * Regla:
     *
     *   STANDARD    -> nunca colapsa por estar vacía.
     *   COLLAPSIBLE -> colapsa cuando todas sus Layers están vacías.
     *
     * @param {Shelf} shelf
     * @returns {boolean}
     */
    static shouldCollapse(shelf) {
        if (!shelf) {
            throw new Error(
                "CollapseRules: la Shelf es obligatoria."
            );
        }

        if (!CollapseRules.isCollapsible(shelf)) {
            return false;
        }

        return CollapseRules.areAllLayersEmpty(shelf);
    }

    /**
     * Devuelve una decisión explícita de colapso.
     *
     * Esto permite que CollapseSystem reciba una decisión
     * estructurada en lugar de tener que volver a evaluar
     * las reglas.
     *
     * @param {Shelf} shelf
     * @returns {{
     *     shelfId: string|number,
     *     shouldCollapse: boolean
     * }}
     */
    static calculateCollapse(shelf) {
        if (!shelf) {
            throw new Error(
                "CollapseRules: la Shelf es obligatoria."
            );
        }

        return {
            shelfId: shelf.id,
            shouldCollapse: CollapseRules.shouldCollapse(shelf)
        };
    }
}
```
