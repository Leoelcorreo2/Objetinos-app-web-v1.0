/**
 * Layer
 *
 * Representa una capa lógica dentro de una Shelf.
 *
 * Un Layer contiene Slots.
 *
 * IMPORTANTE:
 * El estado dinámico del Layer:
 *
 *   TOP
 *   SHADED
 *   INVISIBLE
 *
 * NO se almacena aquí.
 *
 * Ese estado pertenece al sistema de estado del nivel.
 */

export default class Layer {
    constructor({
        id,
        slots = []
    }) {
        if (id === undefined || id === null) {
            throw new Error("Layer: el id es obligatorio.");
        }

        this.id = id;
        this.slots = [];

        for (const slot of slots) {
            this.addSlot(slot);
        }
    }

    addSlot(slot) {
        if (!slot) {
            throw new Error(
                `Layer "${this.id}": el Slot no puede ser null o undefined.`
            );
        }

        if (this.slots.some(existing => existing.id === slot.id)) {
            throw new Error(
                `Layer "${this.id}": ya existe un Slot con id "${slot.id}".`
            );
        }

        if (this.slots.some(existing => existing.index === slot.index)) {
            throw new Error(
                `Layer "${this.id}": ya existe un Slot con index ${slot.index}.`
            );
        }

        this.slots.push(slot);

        /*
         * El índice forma parte de la definición lógica de cada Slot.
         * Ordenamos para mantener una representación determinista.
         */
        this.slots.sort((a, b) => a.index - b.index);

        return slot;
    }

    removeSlot(slotId) {
        const index = this.slots.findIndex(
            slot => slot.id === slotId
        );

        if (index === -1) {
            return false;
        }

        this.slots.splice(index, 1);
        return true;
    }

    getSlotById(slotId) {
        return this.slots.find(
            slot => slot.id === slotId
        ) ?? null;
    }

    getSlotByIndex(index) {
        return this.slots.find(
            slot => slot.index === index
        ) ?? null;
    }

    getSlotCount() {
        return this.slots.length;
    }
}