/**
 * Structure
 *
 * Representa una Estantería o Balda dentro del tablero.
 *
 * Una Structure contiene una colección de Shelves.
 *
 * El movimiento de la estructura es continuo y su estado físico
 * se almacena en position/movement.
 *
 * IMPORTANTE:
 * Structure NO ejecuta el movimiento.
 * Las reglas/sistemas de movimiento serán responsables de modificar
 * su estado físico.
 */

export default class Structure {
    static ORIENTATION = Object.freeze({
        HORIZONTAL: "HORIZONTAL",
        VERTICAL: "VERTICAL"
    });

    constructor({
        id,
        orientation,
        position = { x: 0, y: 0, z: 0 },
        movement = {
            enabled: false,
            direction: null,
            speed: 0
        },
        shelves = []
    }) {
        if (id === undefined || id === null) {
            throw new Error("Structure: el id es obligatorio.");
        }

        if (!Object.values(Structure.ORIENTATION).includes(orientation)) {
            throw new Error(
                `Structure "${id}": orientación no válida "${orientation}".`
            );
        }

        this.id = id;

        this.orientation = orientation;

        this.position = {
            x: position.x ?? 0,
            y: position.y ?? 0,
            z: position.z ?? 0
        };

        this.movement = {
            enabled: movement.enabled ?? false,
            direction: movement.direction ?? null,
            speed: movement.speed ?? 0
        };

        this.shelves = [];

        for (const shelf of shelves) {
            this.addShelf(shelf);
        }
    }

    addShelf(shelf) {
        if (!shelf) {
            throw new Error(
                `Structure "${this.id}": la balda no puede ser null o undefined.`
            );
        }

        if (this.shelves.some(existing => existing.id === shelf.id)) {
            throw new Error(
                `Structure "${this.id}": ya existe una balda con id "${shelf.id}".`
            );
        }

        /*
         * Una estructura no puede mezclar tipos NORMAL y SPECIAL.
         *
         * El comportamiento STANDARD/COLLAPSIBLE sí puede mezclarse.
         */
        if (this.shelves.length > 0) {
            const currentType = this.shelves[0].type;

            if (currentType !== shelf.type) {
                throw new Error(
                    `Structure "${this.id}": no se pueden mezclar Shelves ` +
                    `de tipo "${currentType}" y "${shelf.type}".`
                );
            }
        }

        this.shelves.push(shelf);

        return shelf;
    }

    removeShelf(shelfId) {
        const index = this.shelves.findIndex(
            shelf => shelf.id === shelfId
        );

        if (index === -1) {
            return false;
        }

        this.shelves.splice(index, 1);
        return true;
    }

    getShelfById(shelfId) {
        return this.shelves.find(
            shelf => shelf.id === shelfId
        ) ?? null;
    }

    getShelfCount() {
        return this.shelves.length;
    }
}