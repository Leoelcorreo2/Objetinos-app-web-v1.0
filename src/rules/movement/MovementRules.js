/**
 * MovementRules
 *
 * Regla pura de validación del movimiento lógico de un Object.
 *
 * Responsabilidad:
 *   - determinar si un Object puede desplazarse desde su Slot lógico
 *     actual hasta un Slot destino;
 *   - no modificar LevelState, Board, Slots, Objects ni DynamicState;
 *   - no ejecutar el movimiento;
 *   - no resolver tríos, capas, colapsos, victoria ni bloqueos de partida.
 *
 * Separación importante:
 *   La detección física/visual de qué Slot está bajo el puntero y la
 *   comprobación de proximidad/"imán" pertenecen a la capa de interacción.
 *   Esta regla recibe el destinationSlotId que esa capa haya resuelto.
 */

import StateQueries from "../../state/StateQueries.js";

export default class MovementRules {
    static REASON = Object.freeze({
        VALID: "VALID",
        OBJECT_NOT_FOUND: "OBJECT_NOT_FOUND",
        OBJECT_LOCATION_NOT_FOUND: "OBJECT_LOCATION_NOT_FOUND",
        SOURCE_NOT_TOP: "SOURCE_NOT_TOP",
        OBJECT_BLOCKED: "OBJECT_BLOCKED",
        DESTINATION_NOT_FOUND: "DESTINATION_NOT_FOUND",
        DESTINATION_NOT_TOP: "DESTINATION_NOT_TOP",
        DESTINATION_OCCUPIED: "DESTINATION_OCCUPIED",
        DESTINATION_SHELF_INVALID: "DESTINATION_SHELF_INVALID",
        DESTINATION_LAYER_INVALID: "DESTINATION_LAYER_INVALID",
        DESTINATION_STRUCTURE_INVALID: "DESTINATION_STRUCTURE_INVALID",
        SAME_SLOT: "SAME_SLOT"
    });

    constructor(levelState) {
        if (!levelState) {
            throw new Error("MovementRules: LevelState es obligatorio.");
        }

        this.levelState = levelState;
        this.queries = new StateQueries(levelState);
    }

    /**
     * Comprueba si el movimiento lógico es válido.
     *
     * @param {Object} input
     * @param {string|number} input.objectId
     * @param {string|number} input.destinationSlotId
     *
     * @returns {{
     *   valid: boolean,
     *   reason: string,
     *   objectId: string|number|null,
     *   sourceSlotId: string|number|null,
     *   destinationSlotId: string|number|null,
     *   sourceLayerId: string|number|null,
     *   destinationLayerId: string|number|null,
     *   sourceShelfId: string|number|null,
     *   destinationShelfId: string|number|null,
     *   sourceStructureId: string|number|null,
     *   destinationStructureId: string|number|null
     * }}
     */
    validate({ objectId, destinationSlotId } = {}) {
        const baseResult = {
            valid: false,
            reason: null,
            objectId: objectId ?? null,
            sourceSlotId: null,
            destinationSlotId: destinationSlotId ?? null,
            sourceLayerId: null,
            destinationLayerId: null,
            sourceShelfId: null,
            destinationShelfId: null,
            sourceStructureId: null,
            destinationStructureId: null
        };

        /*
         * 1. El Object debe existir en LevelState.
         */
        if (objectId === undefined || objectId === null) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.OBJECT_NOT_FOUND
            );
        }

        const object = this.queries.getObject(objectId);

        if (!object) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.OBJECT_NOT_FOUND
            );
        }

        /*
         * 2. El Object debe encontrarse realmente en un Slot
         *    dentro de la jerarquía lógica del Board.
         */
        const sourceLocation = this.queries.getObjectLocation(objectId);

        if (!sourceLocation) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.OBJECT_LOCATION_NOT_FOUND
            );
        }

        baseResult.sourceSlotId = sourceLocation.slot.id;
        baseResult.sourceLayerId = sourceLocation.layer.id;
        baseResult.sourceShelfId = sourceLocation.shelf.id;
        baseResult.sourceStructureId = sourceLocation.structure.id;

        /*
         * 3. Solo puede moverse un Object situado en una capa TOP.
         */
        if (!this.queries.isTopLayer(sourceLocation.layer.id)) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.SOURCE_NOT_TOP
            );
        }

        /*
         * 4. Un Object bloqueado no puede moverse directamente.
         *
         * Importante:
         * MovementRules no impide que posteriormente TrioRules
         * permita que ese Object participe en un trío.
         */
        if (object.isBlocked()) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.OBJECT_BLOCKED
            );
        }

        /*
         * 5. Debe existir un destino.
         */
        if (
            destinationSlotId === undefined ||
            destinationSlotId === null
        ) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.DESTINATION_NOT_FOUND
            );
        }

        /*
         * 6. Localizamos el destino dentro de la jerarquía lógica.
         */
        const destinationLocation =
            this.#getSlotLocation(destinationSlotId);

        if (!destinationLocation) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.DESTINATION_NOT_FOUND
            );
        }

        baseResult.destinationLayerId =
            destinationLocation.layer.id;

        baseResult.destinationShelfId =
            destinationLocation.shelf.id;

        baseResult.destinationStructureId =
            destinationLocation.structure.id;

        /*
         * 7. Un Object no puede moverse a su propio Slot.
         */
        if (
            destinationLocation.slot.id ===
            sourceLocation.slot.id
        ) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.SAME_SLOT
            );
        }

        /*
         * 8. La jerarquía del destino debe ser completa.
         */
        if (!destinationLocation.structure) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.DESTINATION_STRUCTURE_INVALID
            );
        }

        if (!destinationLocation.shelf) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.DESTINATION_SHELF_INVALID
            );
        }

        if (!destinationLocation.layer) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.DESTINATION_LAYER_INVALID
            );
        }

        /*
         * 9. El destino debe pertenecer a una capa TOP.
         */
        if (
            !this.queries.isTopLayer(
                destinationLocation.layer.id
            )
        ) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.DESTINATION_NOT_TOP
            );
        }

        /*
         * 10. El destino debe estar vacío.
         */
        if (!destinationLocation.slot.isEmpty()) {
            return this.#invalid(
                baseResult,
                MovementRules.REASON.DESTINATION_OCCUPIED
            );
        }

        /*
         * El movimiento lógico es válido.
         *
         * No se modifica ningún dato del estado.
         * La ejecución corresponderá posteriormente a MovementSystem.
         */
        return {
            ...baseResult,
            valid: true,
            reason: MovementRules.REASON.VALID
        };
    }

    /**
     * Atajo para consumidores que solamente necesitan
     * conocer si el movimiento es válido.
     */
    canMove({ objectId, destinationSlotId } = {}) {
        return this.validate({
            objectId,
            destinationSlotId
        }).valid;
    }

    /**
     * Localiza un Slot y reconstruye su ubicación lógica.
     *
     * Resultado:
     *
     * {
     *     structure,
     *     shelf,
     *     layer,
     *     slot
     * }
     *
     * No se utilizan coordenadas físicas.
     */
    #getSlotLocation(slotId) {
        const layer = this.queries.getLayerForSlot(slotId);

        if (!layer) {
            return null;
        }

        const slot = layer.getSlotById(slotId);

        const shelf =
            this.queries.getShelfForLayer(layer.id);

        const structure = shelf
            ? this.queries.getStructureForShelf(shelf.id)
            : null;

        return {
            structure,
            shelf,
            layer,
            slot
        };
    }

    #invalid(result, reason) {
        return {
            ...result,
            valid: false,
            reason
        };
    }
}