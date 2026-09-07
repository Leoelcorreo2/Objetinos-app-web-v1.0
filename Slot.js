/**
 * Slot
 *
 * Representa una posición lógica dentro de un Layer.
 *
 * Un Slot NO tiene coordenadas de pantalla.
 *
 * La posición física/visual se deriva de:
 *
 * Structure
 *   -> Shelf
 *      -> Layer
 *         -> Slot
 *
 * objectId:
 *   null     -> Slot vacío
 *   string   -> referencia al Object que ocupa el Slot
 */

export default class Slot {
    constructor({
        id,
        index,
        objectId = null
    }) {
        if (id === undefined || id === null) {
            throw new Error("Slot: el id es obligatorio.");
        }

        if (!Number.isInteger(index) || index < 0) {
            throw new Error(
                `Slot "${id}": el index debe ser un entero >= 0.`
            );
        }

        this.id = id;
        this.index = index;
        this.objectId = objectId;
    }

    isEmpty() {
        return this.objectId === null;
    }

    isOccupied() {
        return !this.isEmpty();
    }

    setObject(objectId) {
        if (objectId === undefined || objectId === null) {
            throw new Error(
                `Slot "${this.id}": objectId no puede ser null o undefined al ocupar el Slot.`
            );
        }

        this.objectId = objectId;
    }

    clear() {
        this.objectId = null;
    }
}