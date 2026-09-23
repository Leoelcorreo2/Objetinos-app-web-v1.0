/**
 * BlockDetectionRules
 *
 * Regla pura para determinar si el nivel está bloqueado.
 *
 * Regla oficial:
 *
 *     remainingObjects > 0
 *     AND
 *     no valid normal move exists
 *
 * Responsabilidad:
 *   - determinar si existe al menos un movimiento normal válido;
 *   - determinar si, por tanto, el nivel está bloqueado.
 *
 * No modifica:
 *   - LevelState
 *   - Board
 *   - Structure
 *   - Shelf
 *   - Layer
 *   - Slot
 *   - Object
 *   - DynamicState
 *
 * La victoria tiene prioridad sobre el bloqueo.
 *
 * IMPORTANTE:
 *
 * BlockDetectionRules NO duplica la lógica de movimiento.
 *
 * Utiliza MovementRules como autoridad única para decidir
 * si un candidato constituye un movimiento válido.
 *
 * Los Objects REWARD no son candidatos a MOVE_OBJECT normal.
 * Su interacción pertenece a su sistema/regla específica.
 */

import StateQueries from "../../state/StateQueries.js";
import MovementRules from "../movement/MovementRules.js";

export default class BlockDetectionRules {

    static REASON = Object.freeze({

        BLOCKED:
            "BLOCKED",

        NOT_BLOCKED:
            "NOT_BLOCKED",

        VICTORY:
            "VICTORY"
    });

    constructor(levelState) {

        if (!levelState) {

            throw new Error(
                "BlockDetectionRules: LevelState es obligatorio."
            );
        }

        this.levelState =
            levelState;

        this.queries =
            new StateQueries(levelState);

        /*
         * MovementRules es la única autoridad para determinar
         * si un MOVE_OBJECT es válido.
         */
        this.movementRules =
            new MovementRules(levelState);
    }

    /**
     * Determina el estado de bloqueo actual.
     *
     * La victoria siempre tiene prioridad.
     *
     * @returns {{
     *   blocked: boolean,
     *   reason: string,
     *   remainingObjects: number,
     *   movableObjectIds: Array,
     *   candidateDestinationSlotIds: Array,
     *   validMove: Object|null
     * }}
     */
    validate() {

        const remainingObjects =
            this.levelState.getObjectCount();

        /*
         * ========================================================
         * VICTORIA
         * ========================================================
         *
         * Si no quedan Objects, no estamos ante un bloqueo.
         */

        if (
            remainingObjects === 0
        ) {

            return {

                blocked:
                    false,

                reason:
                    BlockDetectionRules.REASON.VICTORY,

                remainingObjects:
                    0,

                movableObjectIds:
                    [],

                candidateDestinationSlotIds:
                    [],

                validMove:
                    null
            };
        }

        /*
         * ========================================================
         * CANDIDATOS DE ORIGEN
         * ========================================================
         */

        const movableObjectIds =
            this.#getNormalMovableObjectIds();

        /*
         * ========================================================
         * CANDIDATOS DE DESTINO
         * ========================================================
         */

        const candidateDestinationSlotIds =
            this.#getTopEmptySlotIds();

        /*
         * ========================================================
         * SIN CANDIDATOS
         * ========================================================
         *
         * Si no existe Object normal movible o no existe
         * ningún Slot TOP vacío, no puede existir un
         * MOVE_OBJECT válido.
         */

        if (
            movableObjectIds.length === 0 ||
            candidateDestinationSlotIds.length === 0
        ) {

            return {

                blocked:
                    true,

                reason:
                    BlockDetectionRules.REASON.BLOCKED,

                remainingObjects,

                movableObjectIds,

                candidateDestinationSlotIds,

                validMove:
                    null
            };
        }

        /*
         * ========================================================
         * VALIDACIÓN REAL
         * ========================================================
         *
         * Probamos todas las combinaciones:
         *
         *     Object TOP movible
         *              +
         *     Slot TOP vacío
         *
         * La decisión final pertenece exclusivamente
         * a MovementRules.
         */

        for (
            const objectId
            of movableObjectIds
        ) {

            for (
                const destinationSlotId
                of candidateDestinationSlotIds
            ) {

                const result =
                    this.movementRules.validate({

                        objectId,

                        destinationSlotId
                    });

                if (
                    result.valid
                ) {

                    return {

                        blocked:
                            false,

                        reason:
                            BlockDetectionRules.REASON.NOT_BLOCKED,

                        remainingObjects,

                        movableObjectIds,

                        candidateDestinationSlotIds,

                        validMove:
                            result
                    };
                }
            }
        }

        /*
         * ========================================================
         * BLOQUEADO
         * ========================================================
         *
         * Hemos probado todos los candidatos y MovementRules
         * no ha aceptado ninguno.
         */

        return {

            blocked:
                true,

            reason:
                BlockDetectionRules.REASON.BLOCKED,

            remainingObjects,

            movableObjectIds,

            candidateDestinationSlotIds,

            validMove:
                null
        };
    }

    /**
     * Devuelve true si el nivel está bloqueado.
     */
    isBlocked() {

        return this.validate().blocked;
    }

    /**
     * Devuelve true si existe algún movimiento normal válido.
     *
     * La victoria devuelve false porque no quedan Objects
     * que mover.
     */
    hasValidMove() {

        const result =
            this.validate();

        return (
            result.blocked === false &&
            result.reason ===
                BlockDetectionRules.REASON.NOT_BLOCKED
        );
    }

    /**
     * Devuelve el primer movimiento normal válido encontrado.
     *
     * Devuelve null si:
     *
     *   - el nivel está bloqueado;
     *   - el nivel está ganado.
     */
    getValidMove() {

        return this.validate().validMove;
    }

    /**
     * Devuelve los Objects que actualmente podrían ser
     * candidatos a origen de MOVE_OBJECT.
     *
     * Condiciones:
     *
     *   - Layer TOP;
     *   - Slot ocupado;
     *   - Object existente;
     *   - Object no bloqueado;
     *   - Object no REWARD.
     *
     * La última decisión de movimiento pertenece a MovementRules.
     */
    #getNormalMovableObjectIds() {

        const ids =
            [];

        for (
            const structure
            of this.levelState.board.structures
        ) {

            for (
                const shelf
                of structure.shelves
            ) {

                for (
                    const layer
                    of shelf.layers
                ) {

                    /*
                     * Solo TOP es interactiva.
                     */

                    if (
                        !this.queries.isTopLayer(
                            layer.id
                        )
                    ) {

                        continue;
                    }

                    for (
                        const slot
                        of layer.slots
                    ) {

                        /*
                         * Un Slot vacío no puede ser origen.
                         */

                        if (
                            slot.isEmpty()
                        ) {

                            continue;
                        }

                        const object =
                            this.queries.getObject(
                                slot.objectId
                            );

                        /*
                         * Referencia inconsistente:
                         * no puede ser candidato.
                         */

                        if (!object) {
                            continue;
                        }

                        /*
                         * REWARD no participa en MOVE_OBJECT
                         * normal.
                         */

                        if (
                            object.isReward()
                        ) {

                            continue;
                        }

                        /*
                         * Un Object bloqueado no puede ser
                         * origen de movimiento.
                         */

                        if (
                            object.isBlocked()
                        ) {

                            continue;
                        }

                        ids.push(
                            object.id
                        );
                    }
                }
            }
        }

        return ids;
    }

    /**
     * Devuelve todos los Slots vacíos pertenecientes
     * actualmente a Layers TOP.
     */
    #getTopEmptySlotIds() {

        const ids =
            [];

        for (
            const structure
            of this.levelState.board.structures
        ) {

            for (
                const shelf
                of structure.shelves
            ) {

                for (
                    const layer
                    of shelf.layers
                ) {

                    /*
                     * Solo TOP puede recibir Objects.
                     */

                    if (
                        !this.queries.isTopLayer(
                            layer.id
                        )
                    ) {

                        continue;
                    }

                    for (
                        const slot
                        of layer.slots
                    ) {

                        if (
                            slot.isEmpty()
                        ) {

                            ids.push(
                                slot.id
                            );
                        }
                    }
                }
            }
        }

        return ids;
    }
}