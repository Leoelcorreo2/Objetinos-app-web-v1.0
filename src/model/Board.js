/**
 * Board
 *
 * Representa el tablero lógico del juego.
 *
 * Jerarquía:
 * Board
 *   └── Structure
 *         └── Shelf
 *               └── Layer
 *                     └── Slot
 *                           └── Object
 *
 * El Board NO mantiene una colección directa de objetos.
 * La localización de los objetos se obtiene recorriendo la jerarquía.
 */

export default class Board {
    constructor(structures = []) {
        this.structures = [];

        for (const structure of structures) {
            this.addStructure(structure);
        }
    }

    addStructure(structure) {
        if (!structure) {
            throw new Error("Board: la estructura no puede ser null o undefined.");
        }

        if (this.getStructureById(structure.id)) {
            throw new Error(
                `Board: ya existe una estructura con id "${structure.id}".`
            );
        }

        this.structures.push(structure);

        return structure;
    }

    removeStructure(structureId) {
        const index = this.structures.findIndex(
            structure => structure.id === structureId
        );

        if (index === -1) {
            return false;
        }

        this.structures.splice(index, 1);
        return true;
    }

    getStructureById(structureId) {
        return this.structures.find(
            structure => structure.id === structureId
        ) ?? null;
    }

    getStructureCount() {
        return this.structures.length;
    }
}