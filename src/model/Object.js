/**
 * Object
 *
 * Representa un objeto del juego.
 *
 * La identidad para formar tríos se basa en:
 *
 *   type + color
 *
 * La posición del objeto NO se almacena aquí.
 * Su ubicación se obtiene mediante:
 *
 *   Structure -> Shelf -> Layer -> Slot -> Object
 *
 * blocked:
 *   true  -> no puede seleccionarse/moverse directamente
 *   false -> puede seleccionarse/moverse si las demás reglas lo permiten
 *
 * special:
 *   false -> objeto normal
 *   true  -> objeto especial
 *
 * specialType:
 *   NONE
 *   REWARD
 *
 * Los objetos REWARD:
 *   - no forman tríos
 *   - desaparecen al ejecutar su recompensa
 *   - no pueden estar bloqueados
 */

export default class Object {
    static SPECIAL_TYPE = globalThis.Object.freeze({
        NONE: "NONE",
        REWARD: "REWARD"
    });

    constructor({
        id,
        type,
        color,
        blocked = false,
        special = false,
        specialType = Object.SPECIAL_TYPE.NONE
    }) {
        if (id === undefined || id === null) {
            throw new Error("Object: el id es obligatorio.");
        }

        if (type === undefined || type === null) {
            throw new Error(
                `Object "${id}": el type es obligatorio.`
            );
        }

        if (color === undefined || color === null) {
            throw new Error(
                `Object "${id}": el color es obligatorio.`
            );
        }

        if (typeof blocked !== "boolean") {
            throw new Error(
                `Object "${id}": blocked debe ser booleano.`
            );
        }

        if (typeof special !== "boolean") {
            throw new Error(
                `Object "${id}": special debe ser booleano.`
            );
        }

        if (
            !globalThis.Object
                .values(Object.SPECIAL_TYPE)
                .includes(specialType)
        ) {
            throw new Error(
                `Object "${id}": specialType no válido "${specialType}".`
            );
        }

        /*
         * Un objeto normal no puede declarar un tipo especial.
         */
        if (
            special === false &&
            specialType !== Object.SPECIAL_TYPE.NONE
        ) {
            throw new Error(
                `Object "${id}": un objeto no especial debe tener specialType NONE.`
            );
        }

        /*
         * Un objeto especial debe tener un tipo especial distinto de NONE.
         */
        if (
            special === true &&
            specialType === Object.SPECIAL_TYPE.NONE
        ) {
            throw new Error(
                `Object "${id}": un objeto especial debe tener un specialType válido.`
            );
        }

        /*
         * REWARD nunca puede estar bloqueado.
         */
        if (
            specialType === Object.SPECIAL_TYPE.REWARD &&
            blocked === true
        ) {
            throw new Error(
                `Object "${id}": un objeto REWARD no puede estar bloqueado.`
            );
        }

        this.id = id;
        this.type = type;
        this.color = color;
        this.blocked = blocked;
        this.special = special;
        this.specialType = specialType;
    }

    isSpecial() {
        return this.special;
    }

    isReward() {
        return (
            this.special === true &&
            this.specialType === Object.SPECIAL_TYPE.REWARD
        );
    }

    isBlocked() {
        return this.blocked;
    }

    /**
     * Clave de identidad para las reglas de coincidencia.
     *
     * Las reglas de tríos decidirán posteriormente si este objeto
     * puede participar realmente en un trío.
     */
    getMatchKey() {
        return `${this.type}::${this.color}`;
    }
}