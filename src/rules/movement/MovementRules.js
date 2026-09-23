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
 * Reglas consolidadas:
 *
 *   - El Object debe existir.
 *   - El Object debe tener una ubicación lógica válida.
 *   - El Object debe estar en una Layer TOP.
 *   - Un Object bloqueado no puede moverse.
 *   - El destino debe existir.
 *   - El destino debe pertenecer a una jerarquía válida:
 *       Structure -> Shelf -> Layer -> Slot
 *   - El destino debe estar en una Layer TOP.
 *   - El destino debe estar vacío.
 *   - El destino no puede ser el mismo Slot de origen.
 *
 * Los destinos físicos, la detección de proximidad, el "imán" y las
 * coordenadas de estructuras móviles pertenecen a la capa de interacción.
 *
 * Esta regla trabaja exclusivamente con identidad lógica:
 *
 *   objectId
 *   destinationSlotId
 *
 * No utiliza coordenadas de pantalla.
 */

import StateQueries from "../../state/StateQueries.js";

export default class MovementRules {

    static REASON = Object.freeze({
        VALID:
            "VALID",

        OBJECT_NOT_FOUND:
            "OBJECT_NOT_FOUND",

        OBJECT_LOCATION_NOT_FOUND:
            "OBJECT_LOCATION_NOT_FOUND",

        SOURCE_NOT_TOP:
            "SOURCE_NOT_TOP",

        OBJECT_BLOCKED:
            "OBJECT_BLOCKED",

        DESTINATION_NOT_FOUND:
            "DESTINATION_NOT_FOUND",

        DESTINATION_NOT_TOP:
            "DESTINATION_NOT_TOP",

        DESTINATION_OCCUPIED:
            "DESTINATION_OCCUPIED",

        DESTINATION_SHELF_INVALID:
            "DESTINATION_SHELF_INVALID",

        DESTINATION_LAYER_INVALID:
            "DESTINATION_LAYER_INVALID",

        DESTINATION_STRUCTURE_INVALID:
            "DESTINATION_STRUCTURE_INVALID",

        SAME_SLOT:
            "SAME_SLOT"
    });

    constructor(levelState) {

        if (!levelState) {
            throw new Error(
                "MovementRules: LevelState es obligatorio."
            );
        }

        this.levelState =
            levelState;

        this.queries =
            new StateQueries(levelState);
    }

    /**
     * Comprueba si el movimiento lógico es válido.
     *
     * IMPORTANTE:
     *
     * Esta función NO ejecuta el movimiento.
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
    validate({
        objectId,
        destinationSlotId
    } = {}) {

        const baseResult = {

            valid:
                false,

            reason:
                null,

            objectId:
                objectId ?? null,

            sourceSlotId:
                null,

            destinationSlotId:
                destinationSlotId ?? null,

            sourceLayerId:
                null,

            destinationLayerId:
                null,

            sourceShelfId:
                null,

            destinationShelfId:
                null,

            sourceStructureId:
                null,

            destinationStructureId:
                null
        };

        /*
         * ========================================================
         * 1. OBJECT
         * ========================================================
         */

        if (
            objectId === undefined ||
            objectId === null
        ) {

            return this.#invalid(
                baseResult,
                MovementRules.REASON.OBJECT_NOT_FOUND
            );
        }

        const object =
            this.queries.getObject(objectId);

        if (!object) {

            return this.#invalid(
                baseResult,
                MovementRules.REASON.OBJECT_NOT_FOUND
            );
        }

        /*
         * ========================================================
         * 2. UBICACIÓN LÓGICA DEL OBJECT
         * ========================================================
         */

        const sourceLocation =
            this.queries.getObjectLocation(
                objectId
            );

        if (!sourceLocation) {

            return this.#invalid(
                baseResult,
                MovementRules.REASON.OBJECT_LOCATION_NOT_FOUND
            );
        }

        baseResult.sourceSlotId =
            sourceLocation.slot.id;

        baseResult.sourceLayerId =
            sourceLocation.layer.id;

        baseResult.sourceShelfId =
            sourceLocation.shelf.id;

        baseResult.sourceStructureId =
            sourceLocation.structure.id;

        /*
         * ========================================================
         * 3. ORIGEN TOP
         * ========================================================
         *
         * Solamente TOP es interactiva.
         */

        if (
            !this.queries.isTopLayer(
                sourceLocation.layer.id
            )
        ) {

            return this.#invalid(
                baseResult,
                MovementRules.REASON.SOURCE_NOT_TOP
            );
        }

        /*
         * ========================================================
         * 4. OBJECT BLOQUEADO
         * ========================================================
         *
         * El bloqueo solamente impide mover directamente
         * el Object.
         *
         * No impide que posteriormente pueda participar
         * en un trío.
         */

        if (object.isBlocked()) {

            return this.#invalid(
                baseResult,
                MovementRules.REASON.OBJECT_BLOCKED
            );
        }

        /*
         * ========================================================
         * 5. DESTINO EXISTENTE
         * ========================================================
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
         * ========================================================
         * 6. UBICACIÓN LÓGICA DEL DESTINO
         * ========================================================
         */

        const destinationLocation =
            this.#getSlotLocation(
                destinationSlotId
            );

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
         * ========================================================
         * 7. MISMO SLOT
         * ========================================================
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
         * ========================================================
         * 8. JERARQUÍA DEL DESTINO
         * ========================================================
         *
         * La ubicación debe estar completa.
         *
         * Structure
         *    ↓
         * Shelf
         *    ↓
         * Layer
         *    ↓
         * Slot
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

        if (!destinationLocation.slot) {

            return this.#invalid(
                baseResult,
                MovementRules.REASON.DESTINATION_NOT_FOUND
            );
        }

        /*
         * ========================================================
         * 9. DESTINO TOP
         * ========================================================
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
         * ========================================================
         * 10. DESTINO VACÍO
         * ========================================================
         *
         * Los movimientos solamente pueden realizarse hacia
         * huecos TOP vacíos.
         */

        if (
            !destinationLocation.slot.isEmpty()
        ) {

            return this.#invalid(
                baseResult,
                MovementRules.REASON.DESTINATION_OCCUPIED
            );
        }

        /*
         * ========================================================
         * MOVIMIENTO VÁLIDO
         * ========================================================
         *
         * No se modifica absolutamente nada del estado.
         *
         * MovementSystem será responsable posteriormente
         * de ejecutar el movimiento.
         */

        return {

            ...baseResult,

            valid:
                true,

            reason:
                MovementRules.REASON.VALID
        };
    }

    /**
     * Atajo booleano.
     *
     * Devuelve solamente si el movimiento es válido.
     */
    canMove({
        objectId,
        destinationSlotId
    } = {}) {

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

        const layer =
            this.queries.getLayerForSlot(
                slotId
            );

        if (!layer) {
            return null;
        }

        const slot =
            layer.getSlotById(
                slotId
            );

        if (!slot) {
            return null;
        }

        const shelf =
            this.queries.getShelfForLayer(
                layer.id
            );

        const structure =
            shelf
                ? this.queries.getStructureForShelf(
                    shelf.id
                )
                : null;

        return {
            structure,
            shelf,
            layer,
            slot
        };
    }

    /**
     * Construye un resultado inválido sin modificar
     * el objeto base.
     */
    #invalid(
        result,
        reason
    ) {

        return {

            ...result,

            valid:
                false,

            reason
        };
    }
}