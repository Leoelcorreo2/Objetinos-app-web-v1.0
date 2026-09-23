/**
 * TrioRules
 *
 * Regla pura de detección de tríos.
 *
 * Responsabilidad:
 *   - determinar si existe un trío válido en la capa destino;
 *   - localizar exactamente los tres Objects que lo forman;
 *   - respetar la identidad type + color;
 *   - respetar Shelf + Layer + TOP;
 *   - permitir Objects bloqueados;
 *   - excluir Objects especiales REWARD.
 *
 * Condiciones consolidadas:
 *
 *   3 Objects
 *   +
 *   mismo type
 *   +
 *   mismo color
 *   +
 *   mismo Shelf
 *   +
 *   misma Layer
 *   +
 *   Layer = TOP
 *
 * Una acción del jugador puede producir como máximo un trío.
 *
 * Esta regla NO:
 *   - mueve Objects;
 *   - elimina Objects;
 *   - modifica Slots;
 *   - modifica LevelState;
 *   - modifica DynamicState;
 *   - ejecuta animaciones;
 *   - realiza colapsos;
 *   - comprueba victoria.
 *
 * El movimiento debe haber sido ejecutado previamente por
 * MovementSystem cuando TrioRules sea utilizada dentro del
 * flujo normal del juego.
 */

import StateQueries from "../../state/StateQueries.js";

export default class TrioRules {

    static REASON = Object.freeze({

        VALID:
            "VALID",

        DESTINATION_NOT_FOUND:
            "DESTINATION_NOT_FOUND",

        DESTINATION_NOT_TOP:
            "DESTINATION_NOT_TOP",

        NO_TRIO:
            "NO_TRIO",

        SPECIAL_OBJECT:
            "SPECIAL_OBJECT"
    });

    constructor(levelState) {

        if (!levelState) {

            throw new Error(
                "TrioRules: LevelState es obligatorio."
            );
        }

        this.levelState =
            levelState;

        this.queries =
            new StateQueries(levelState);
    }

    /**
     * Detecta el trío producido por el destino indicado.
     *
     * El destino debe ser un Slot que ya contenga el Object
     * que acaba de llegar como consecuencia del movimiento.
     *
     * @param {Object} input
     * @param {string|number} input.destinationSlotId
     *
     * @returns {{
     *   valid: boolean,
     *   reason: string,
     *   destinationSlotId: string|number|null,
     *   objectId: string|number|null,
     *   shelfId: string|number|null,
     *   layerId: string|number|null,
     *   structureId: string|number|null,
     *   matchKey: string|null,
     *   objectIds: Array
     * }}
     */
    validate({
        destinationSlotId
    } = {}) {

        const result = {

            valid:
                false,

            reason:
                null,

            destinationSlotId:
                destinationSlotId ?? null,

            objectId:
                null,

            shelfId:
                null,

            layerId:
                null,

            structureId:
                null,

            matchKey:
                null,

            objectIds:
                []
        };

        /*
         * ========================================================
         * 1. DESTINO
         * ========================================================
         */

        if (
            destinationSlotId === undefined ||
            destinationSlotId === null
        ) {

            return this.#invalid(
                result,
                TrioRules.REASON.DESTINATION_NOT_FOUND
            );
        }

        /*
         * ========================================================
         * 2. LOCALIZACIÓN DEL DESTINO
         * ========================================================
         */

        const destinationLocation =
            this.#getSlotLocation(
                destinationSlotId
            );

        if (!destinationLocation) {

            return this.#invalid(
                result,
                TrioRules.REASON.DESTINATION_NOT_FOUND
            );
        }

        const {
            structure,
            shelf,
            layer,
            slot
        } = destinationLocation;

        result.structureId =
            structure.id;

        result.shelfId =
            shelf.id;

        result.layerId =
            layer.id;

        /*
         * ========================================================
         * 3. DESTINO TOP
         * ========================================================
         *
         * Solo TOP es interactiva y solo TOP puede producir
         * un trío.
         */

        if (
            !this.queries.isTopLayer(
                layer.id
            )
        ) {

            return this.#invalid(
                result,
                TrioRules.REASON.DESTINATION_NOT_TOP
            );
        }

        /*
         * ========================================================
         * 4. DESTINO OCUPADO
         * ========================================================
         *
         * El trío solamente puede comprobarse a partir del
         * Object que ocupa el Slot destino.
         */

        if (slot.isEmpty()) {

            return this.#invalid(
                result,
                TrioRules.REASON.NO_TRIO
            );
        }

        const destinationObject =
            this.queries.getObject(
                slot.objectId
            );

        if (!destinationObject) {

            return this.#invalid(
                result,
                TrioRules.REASON.NO_TRIO
            );
        }

        result.objectId =
            destinationObject.id;

        /*
         * ========================================================
         * 5. OBJETOS ESPECIALES REWARD
         * ========================================================
         *
         * Los REWARD no forman tríos.
         */

        if (
            destinationObject.isReward()
        ) {

            return this.#invalid(
                result,
                TrioRules.REASON.SPECIAL_OBJECT
            );
        }

        /*
         * ========================================================
         * 6. IDENTIDAD DEL TRÍO
         * ========================================================
         *
         * La identidad lógica es:
         *
         *     type + color
         */

        const matchKey =
            destinationObject.getMatchKey();

        result.matchKey =
            matchKey;

        /*
         * ========================================================
         * 7. BUSCAR CANDIDATOS
         * ========================================================
         *
         * IMPORTANTÍSIMO:
         *
         * Se recorre solamente:
         *
         *     esta Layer
         *
         * que ya sabemos que pertenece a:
         *
         *     este Shelf
         *
         * y además es:
         *
         *     TOP
         *
         * Por tanto no se mezclan:
         *
         *   - Shelves diferentes;
         *   - Layers diferentes;
         *   - Structures diferentes.
         */

        const matchingObjectIds =
            [];

        for (
            const candidateSlot
            of layer.slots
        ) {

            if (
                candidateSlot.isEmpty()
            ) {
                continue;
            }

            const candidateObject =
                this.queries.getObject(
                    candidateSlot.objectId
                );

            if (!candidateObject) {
                continue;
            }

            /*
             * Los REWARD quedan fuera de la lógica de tríos.
             */
            if (
                candidateObject.isReward()
            ) {
                continue;
            }

            if (
                candidateObject.getMatchKey() ===
                matchKey
            ) {

                matchingObjectIds.push(
                    candidateObject.id
                );
            }
        }

        /*
         * ========================================================
         * 8. EXACTAMENTE TRES
         * ========================================================
         *
         * Una Layer NORMAL tiene tres Slots, por lo que
         * como máximo puede existir un trío.
         *
         * Un SPECIAL tiene un único Slot y no puede formar
         * un trío.
         *
         * Por ello exigimos exactamente tres coincidencias.
         */

        if (
            matchingObjectIds.length !== 3
        ) {

            return this.#invalid(
                result,
                TrioRules.REASON.NO_TRIO
            );
        }

        /*
         * ========================================================
         * 9. TRÍO VÁLIDO
         * ========================================================
         *
         * No se modifica el estado.
         */

        return {

            ...result,

            valid:
                true,

            reason:
                TrioRules.REASON.VALID,

            objectIds:
                matchingObjectIds
        };
    }

    /**
     * Atajo booleano.
     */
    hasTrio({
        destinationSlotId
    } = {}) {

        return this.validate({
            destinationSlotId
        }).valid;
    }

    /**
     * Devuelve los IDs de los tres Objects que forman
     * el trío, o [] si no existe.
     */
    getTrioObjectIds({
        destinationSlotId
    } = {}) {

        return this.validate({
            destinationSlotId
        }).objectIds;
    }

    /**
     * Localiza la jerarquía completa de un Slot.
     *
     * Resultado:
     *
     * {
     *     structure,
     *     shelf,
     *     layer,
     *     slot
     * }
     */
    #getSlotLocation(slotId) {

        const layer =
            this.queries.getLayerForSlot(
                slotId
            );

        if (!layer) {
            return null;
        }

        const shelf =
            this.queries.getShelfForLayer(
                layer.id
            );

        if (!shelf) {
            return null;
        }

        const structure =
            this.queries.getStructureForShelf(
                shelf.id
            );

        if (!structure) {
            return null;
        }

        const slot =
            layer.getSlotById(
                slotId
            );

        if (!slot) {
            return null;
        }

        return {
            structure,
            shelf,
            layer,
            slot
        };
    }

    #invalid(
        result,
        reason
    ) {

        return {

            ...result,

            valid:
                false,

            reason,

            objectIds:
                []
        };
    }
}