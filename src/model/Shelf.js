/**
 * Shelf
 *
 * Representa una Estantería/Balda.
 *
 * Hay dos dimensiones independientes:
 *
 * type:
 *   NORMAL  -> 3 Slots por Layer
 *   SPECIAL -> 1 Slot por Layer
 *
 * behavior:
 *   STANDARD
 *   COLLAPSIBLE
 *
 * El número de Layers es variable.
 *
 * IMPORTANTE:
 * Shelf NO contiene lógica de colapso.
 * El colapso pertenece a las reglas del juego.
 */

export default class Shelf {
    static TYPE = Object.freeze({
        NORMAL: "NORMAL",
        SPECIAL: "SPECIAL"
    });

    static BEHAVIOR = Object.freeze({
        STANDARD: "STANDARD",
        COLLAPSIBLE: "COLLAPSIBLE"
    });

    constructor({
        id,
        type,
        behavior = Shelf.BEHAVIOR.STANDARD,
        layers = []
    }) {
        if (id === undefined || id === null) {
            throw new Error("Shelf: el id es obligatorio.");
        }

        if (!Object.values(Shelf.TYPE).includes(type)) {
            throw new Error(
                `Shelf "${id}": tipo no válido "${type}".`
            );
        }

        if (!Object.values(Shelf.BEHAVIOR).includes(behavior)) {
            throw new Error(
                `Shelf "${id}": comportamiento no válido "${behavior}".`
            );
        }

        this.id = id;
        this.type = type;
        this.behavior = behavior;
        this.layers = [];

        for (const layer of layers) {
            this.addLayer(layer);
        }
    }

    getSlotCountPerLayer() {
        return this.type === Shelf.TYPE.NORMAL ? 3 : 1;
    }

    addLayer(layer) {
        if (!layer) {
            throw new Error(
                `Shelf "${this.id}": el Layer no puede ser null o undefined.`
            );
        }

        if (this.layers.some(existing => existing.id === layer.id)) {
            throw new Error(
                `Shelf "${this.id}": ya existe un Layer con id "${layer.id}".`
            );
        }

        const expectedSlotCount = this.getSlotCountPerLayer();

        if (layer.slots.length !== expectedSlotCount) {
            throw new Error(
                `Shelf "${this.id}": el Layer "${layer.id}" debe tener ` +
                `${expectedSlotCount} Slot(s), pero tiene ${layer.slots.length}.`
            );
        }

        this.layers.push(layer);

        return layer;
    }

    removeLayer(layerId) {
        const index = this.layers.findIndex(
            layer => layer.id === layerId
        );

        if (index === -1) {
            return false;
        }

        this.layers.splice(index, 1);
        return true;
    }

    getLayerById(layerId) {
        return this.layers.find(
            layer => layer.id === layerId
        ) ?? null;
    }

    getLayerCount() {
        return this.layers.length;
    }
}