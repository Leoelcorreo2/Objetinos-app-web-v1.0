/**
 * StateQueries
 *
 * Funciones de consulta sobre LevelState.
 *
 * Este módulo NO modifica el estado.
 * Este módulo NO ejecuta reglas de juego.
 *
 * Su responsabilidad es localizar y consultar elementos dentro
 * de la jerarquía:
 *
 * Board
 *   -> Structure
 *      -> Shelf
 *         -> Layer
 *            -> Slot
 *               -> Object
 *
 * y consultar el estado dinámico asociado.
 */

export default class StateQueries {
    constructor(levelState) {
        if (!levelState) {
            throw new Error(
                "StateQueries: LevelState es obligatorio."
            );
        }

        this.levelState = levelState;
    }

    /**
     * Devuelve el Board asociado al nivel.
     */
    getBoard() {
        return this.levelState.board;
    }

    /**
     * Devuelve una Structure por ID.
     */
    getStructure(structureId) {
        return this.levelState.board.getStructureById(structureId);
    }

    /**
     * Devuelve una Shelf por ID.
     *
     * La búsqueda se realiza recorriendo las Structures.
     */
    getShelf(shelfId) {
        for (const structure of this.levelState.board.structures) {
            const shelf = structure.getShelfById(shelfId);

            if (shelf) {
                return shelf;
            }
        }

        return null;
    }

    /**
     * Devuelve un Layer por ID.
     */
    getLayer(layerId) {
        for (const structure of this.levelState.board.structures) {
            for (const shelf of structure.shelves) {
                const layer = shelf.getLayerById(layerId);

                if (layer) {
                    return layer;
                }
            }
        }

        return null;
    }

    /**
     * Devuelve un Slot por ID.
     */
    getSlot(slotId) {
        for (const structure of this.levelState.board.structures) {
            for (const shelf of structure.shelves) {
                for (const layer of shelf.layers) {
                    const slot = layer.getSlotById(slotId);

                    if (slot) {
                        return slot;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Devuelve un Object por ID.
     *
     * Los Objects están registrados en LevelState.
     *
     * El Board no mantiene una colección directa de Objects.
     * Los Slots solamente almacenan objectId.
     */
    getObject(objectId) {
        return this.levelState.getObjectById(objectId);
    }

    /**
     * Devuelve la Structure que contiene una Shelf.
     */
    getStructureForShelf(shelfId) {
        for (const structure of this.levelState.board.structures) {
            if (structure.getShelfById(shelfId)) {
                return structure;
            }
        }

        return null;
    }

    /**
     * Devuelve la Shelf que contiene un Layer.
     */
    getShelfForLayer(layerId) {
        for (const structure of this.levelState.board.structures) {
            for (const shelf of structure.shelves) {
                if (shelf.getLayerById(layerId)) {
                    return shelf;
                }
            }
        }

        return null;
    }

    /**
     * Devuelve el Layer que contiene un Slot.
     */
    getLayerForSlot(slotId) {
        for (const structure of this.levelState.board.structures) {
            for (const shelf of structure.shelves) {
                for (const layer of shelf.layers) {
                    if (layer.getSlotById(slotId)) {
                        return layer;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Devuelve el Slot que contiene un Object.
     *
     * La localización física/lógica del Object se obtiene
     * recorriendo la jerarquía.
     */
    getSlotForObject(objectId) {
        for (const structure of this.levelState.board.structures) {
            for (const shelf of structure.shelves) {
                for (const layer of shelf.layers) {
                    for (const slot of layer.slots) {
                        if (slot.objectId === objectId) {
                            return slot;
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Devuelve la ubicación lógica completa de un Object.
     *
     * NO devuelve coordenadas de pantalla.
     *
     * Resultado:
     *
     * {
     *     structure,
     *     shelf,
     *     layer,
     *     slot
     * }
     */
    getObjectLocation(objectId) {
        for (const structure of this.levelState.board.structures) {
            for (const shelf of structure.shelves) {
                for (const layer of shelf.layers) {
                    for (const slot of layer.slots) {
                        if (slot.objectId === objectId) {
                            return {
                                structure,
                                shelf,
                                layer,
                                slot
                            };
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Devuelve el estado dinámico de un Layer.
     *
     * Puede devolver:
     *
     * TOP
     * SHADED
     * INVISIBLE
     *
     * o null si todavía no ha sido inicializado.
     */
    getLayerState(layerId) {
        return this.levelState.dynamic.getLayerState(layerId);
    }

    /**
     * Indica si un Layer está actualmente en estado TOP.
     */
    isTopLayer(layerId) {
        return this.getLayerState(layerId) === "TOP";
    }

    /**
     * Indica si un Layer está actualmente en estado SHADED.
     */
    isShadedLayer(layerId) {
        return this.getLayerState(layerId) === "SHADED";
    }

    /**
     * Indica si un Layer está actualmente en estado INVISIBLE.
     */
    isInvisibleLayer(layerId) {
        return this.getLayerState(layerId) === "INVISIBLE";
    }

    /**
     * Devuelve el Object actualmente seleccionado.
     */
    getSelectedObject() {
        const objectId = this.levelState.dynamic.selectedObjectId;

        if (objectId === null) {
            return null;
        }

        return this.getObject(objectId);
    }

    /**
     * Devuelve el ID del Object actualmente seleccionado.
     */
    getSelectedObjectId() {
        return this.levelState.dynamic.selectedObjectId;
    }

    /**
     * Indica si existe un Object seleccionado.
     */
    hasSelection() {
        return this.levelState.dynamic.hasSelection();
    }
}