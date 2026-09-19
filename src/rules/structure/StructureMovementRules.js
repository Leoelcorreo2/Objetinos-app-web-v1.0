/**
 * StructureMovementRules
 *
 * Determina si una Structure puede realizar movimiento físico.
 *
 * IMPORTANTE:
 * - Esta clase NO mueve la Structure.
 * - NO modifica posición, dirección ni velocidad.
 * - NO modifica Shelves, Layers, Slots ni Objects.
 * - La identidad lógica de la Structure es independiente
 *   de su posición física.
 *
 * La ejecución del movimiento físico corresponde a
 * StructureMovementSystem.
 */

export default class StructureMovementRules {
    static REASON = Object.freeze({
        VALID_MOVEMENT: "VALID_MOVEMENT",
        STRUCTURE_NOT_FOUND: "STRUCTURE_NOT_FOUND",
        MOVEMENT_NOT_ENABLED: "MOVEMENT_NOT_ENABLED",
        INVALID_POSITION: "INVALID_POSITION",
        INVALID_DIRECTION: "INVALID_DIRECTION",
        INVALID_SPEED: "INVALID_SPEED"
    });

    constructor(levelState) {
        if (!levelState) {
            throw new Error(
                "StructureMovementRules: levelState es obligatorio."
            );
        }

        this.levelState = levelState;
    }

    /**
     * Valida si una Structure puede realizar movimiento físico.
     *
     * No modifica el estado.
     */
    validate(structureId) {
        const structure =
            this.levelState.board.getStructureById(
                structureId
            );

        if (!structure) {
            return {
                valid: false,
                reason:
                    StructureMovementRules.REASON
                        .STRUCTURE_NOT_FOUND,
                structureId
            };
        }

        /*
         * Una estructura sin movimiento habilitado
         * simplemente no necesita movimiento físico.
         */
        if (!structure.movement.enabled) {
            return {
                valid: false,
                reason:
                    StructureMovementRules.REASON
                        .MOVEMENT_NOT_ENABLED,
                structureId
            };
        }

        /*
         * La posición física debe existir y contener
         * coordenadas numéricas finitas.
         */
        if (!this.isValidPosition(structure.position)) {
            return {
                valid: false,
                reason:
                    StructureMovementRules.REASON
                        .INVALID_POSITION,
                structureId
            };
        }

        /*
         * Cuando el movimiento está habilitado,
         * debe existir una dirección válida.
         */
        if (!this.isValidDirection(structure.movement.direction)) {
            return {
                valid: false,
                reason:
                    StructureMovementRules.REASON
                        .INVALID_DIRECTION,
                structureId
            };
        }

        /*
         * La velocidad debe ser positiva y finita.
         */
        if (!this.isValidSpeed(structure.movement.speed)) {
            return {
                valid: false,
                reason:
                    StructureMovementRules.REASON
                        .INVALID_SPEED,
                structureId
            };
        }

        return {
            valid: true,
            reason:
                StructureMovementRules.REASON
                    .VALID_MOVEMENT,
            structureId,
            position: {
                x: structure.position.x,
                y: structure.position.y,
                z: structure.position.z
            },
            direction: structure.movement.direction,
            speed: structure.movement.speed
        };
    }

    /**
     * Atajo booleano.
     */
    canMove(structureId) {
        return this.validate(structureId).valid;
    }

    /**
     * Valida una posición.
     */
    isValidPosition(position) {
        if (!position) {
            return false;
        }

        return (
            Number.isFinite(position.x) &&
            Number.isFinite(position.y) &&
            Number.isFinite(position.z)
        );
    }

    /**
     * Valida una dirección.
     *
     * La especificación v1 no fija todavía una representación
     * concreta de dirección, por lo que aceptamos:
     *
     * - string no vacío
     * - objeto con x/y/z numéricos
     *
     * Esto permite mantener la regla independiente de la
     * representación física concreta que adopte el sistema.
     */
    isValidDirection(direction) {
        if (typeof direction === "string") {
            return direction.trim().length > 0;
        }

        if (
            direction &&
            typeof direction === "object"
        ) {
            const components = [
                direction.x,
                direction.y,
                direction.z
            ].filter(
                value => value !== undefined
            );

            if (components.length === 0) {
                return false;
            }

            return components.every(
                value => Number.isFinite(value)
            );
        }

        return false;
    }

    /**
     * Valida una velocidad.
     */
    isValidSpeed(speed) {
        return (
            Number.isFinite(speed) &&
            speed > 0
        );
    }
}