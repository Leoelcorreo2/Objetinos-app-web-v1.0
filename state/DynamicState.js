/**
 * DynamicState
 *
 * Estado dinámico de una partida.
 *
 * Contiene información que cambia durante la ejecución del nivel,
 * pero que no forma parte de la estructura estática del Board.
 *
 * No contiene coordenadas visuales ni referencias al DOM.
 */

export default class DynamicState {
    constructor() {
        /*
         * Estado visual/lógico de cada Layer.
         *
         * Map<layerId, "TOP" | "SHADED" | "INVISIBLE">
         */
        this.layerStates = new Map();

        /*
         * Objeto actualmente seleccionado.
         *
         * null cuando no existe selección.
         */
        this.selectedObjectId = null;

        /*
         * Estructuras que están siendo desplazadas.
         *
         * Set<structureId>
         *
         * El movimiento físico concreto se calculará en el sistema
         * correspondiente; aquí únicamente registramos el estado.
         */
        this.movingStructureIds = new Set();

        /*
         * Objetos que están siendo procesados/eliminados.
         *
         * Set<objectId>
         */
        this.pendingRemovalObjectIds = new Set();
    }

    setLayerState(layerId, state) {
        if (layerId === undefined || layerId === null) {
            throw new Error(
                "DynamicState: layerId es obligatorio."
            );
        }

        this.layerStates.set(layerId, state);
    }

    getLayerState(layerId) {
        return this.layerStates.get(layerId) ?? null;
    }

    hasLayerState(layerId) {
        return this.layerStates.has(layerId);
    }

    removeLayerState(layerId) {
        return this.layerStates.delete(layerId);
    }

    clearLayerStates() {
        this.layerStates.clear();
    }

    setSelectedObject(objectId) {
        this.selectedObjectId = objectId ?? null;
    }

    clearSelection() {
        this.selectedObjectId = null;
    }

    hasSelection() {
        return this.selectedObjectId !== null;
    }

    addMovingStructure(structureId) {
        if (structureId === undefined || structureId === null) {
            throw new Error(
                "DynamicState: structureId es obligatorio."
            );
        }

        this.movingStructureIds.add(structureId);
    }

    removeMovingStructure(structureId) {
        this.movingStructureIds.delete(structureId);
    }

    isStructureMoving(structureId) {
        return this.movingStructureIds.has(structureId);
    }

    addPendingRemoval(objectId) {
        if (objectId === undefined || objectId === null) {
            throw new Error(
                "DynamicState: objectId es obligatorio."
            );
        }

        this.pendingRemovalObjectIds.add(objectId);
    }

    removePendingRemoval(objectId) {
        this.pendingRemovalObjectIds.delete(objectId);
    }

    isPendingRemoval(objectId) {
        return this.pendingRemovalObjectIds.has(objectId);
    }

    clearPendingRemovals() {
        this.pendingRemovalObjectIds.clear();
    }

    reset() {
        this.clearLayerStates();
        this.clearSelection();
        this.movingStructureIds.clear();
        this.clearPendingRemovals();
    }
}