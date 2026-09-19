/**
 * GameEvents
 *
 * Define los acontecimientos producidos por el motor
 * de Objetinos.
 *
 * IMPORTANTE:
 *
 * Un Event representa un HECHO QUE YA HA OCURRIDO.
 *
 * Un Event:
 * - no solicita una acción;
 * - no ejecuta lógica;
 * - no contiene reglas;
 * - no modifica el estado por sí mismo.
 *
 * Los Systems producen Events y las capas superiores
 * pueden utilizarlos para coordinar el flujo del juego,
 * animaciones, interfaz, estadísticas, etc.
 */
export default class GameEvents {

    static TYPE = Object.freeze({

        OBJECT_MOVED:
            "OBJECT_MOVED",

        TRIO_COMPLETED:
            "TRIO_COMPLETED",

        POWERUP_USED:
            "POWERUP_USED",

        LAYER_ADVANCED:
            "LAYER_ADVANCED",

        SHELF_COLLAPSED:
            "SHELF_COLLAPSED",

        LEVEL_COMPLETED:
            "LEVEL_COMPLETED",

        TIME_EXPIRED:
            "TIME_EXPIRED",

        LIFE_LOST:
            "LIFE_LOST"
    });


    static VALUES = Object.freeze([
        GameEvents.TYPE.OBJECT_MOVED,
        GameEvents.TYPE.TRIO_COMPLETED,
        GameEvents.TYPE.POWERUP_USED,
        GameEvents.TYPE.LAYER_ADVANCED,
        GameEvents.TYPE.SHELF_COLLAPSED,
        GameEvents.TYPE.LEVEL_COMPLETED,
        GameEvents.TYPE.TIME_EXPIRED,
        GameEvents.TYPE.LIFE_LOST
    ]);


    /**
     * Comprueba si un tipo corresponde a un Event válido.
     *
     * @param {string} type
     * @returns {boolean}
     */
    static isValidType(type) {

        return GameEvents.VALUES.includes(
            type
        );
    }


    /**
     * Crea un Event.
     *
     * El evento se devuelve congelado para evitar que
     * pueda modificarse accidentalmente después de haber
     * sido producido.
     *
     * @param {string} type
     * @param {Object} data
     * @returns {Object}
     */
    static create(
        type,
        data = {}
    ) {

        if (
            !GameEvents.isValidType(
                type
            )
        ) {

            throw new Error(
                `GameEvents: tipo de evento inválido "${type}".`
            );
        }


        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {

            throw new Error(
                "GameEvents: data debe ser un objeto."
            );
        }


        return Object.freeze({

            type,

            data: Object.freeze({
                ...data
            })
        });
    }


    /**
     * Evento OBJECT_MOVED.
     *
     * Representa un movimiento que ya se ha ejecutado.
     *
     * @param {string|number} objectId
     * @param {string|number} sourceSlot
     * @param {string|number} destinationSlot
     * @returns {Object}
     */
    static objectMoved(
        objectId,
        sourceSlot,
        destinationSlot
    ) {

        return GameEvents.create(
            GameEvents.TYPE.OBJECT_MOVED,
            {
                objectId,
                sourceSlot,
                destinationSlot
            }
        );
    }


    /**
     * Evento TRIO_COMPLETED.
     *
     * @param {Object} data
     * @param {string|number} data.shelfId
     * @param {string|number} data.layerId
     * @param {string} data.objectType
     * @param {string} data.objectColor
     * @param {Array} data.objectIds
     * @returns {Object}
     */
    static trioCompleted(
        {
            shelfId,
            layerId,
            objectType,
            objectColor,
            objectIds
        } = {}
    ) {

        return GameEvents.create(
            GameEvents.TYPE.TRIO_COMPLETED,
            {
                shelfId,
                layerId,
                objectType,
                objectColor,
                objectIds: Array.isArray(objectIds)
                    ? [...objectIds]
                    : objectIds
            }
        );
    }


    /**
     * Evento POWERUP_USED.
     *
     * @param {string} powerUpId
     * @param {Object} details
     * @returns {Object}
     */
    static powerUpUsed(
        powerUpId,
        details = {}
    ) {

        return GameEvents.create(
            GameEvents.TYPE.POWERUP_USED,
            {
                powerUpId,
                ...details
            }
        );
    }


    /**
     * Evento LAYER_ADVANCED.
     *
     * @param {string|number} shelfId
     * @param {Array} advancedLayerIds
     * @param {Object} details
     * @returns {Object}
     */
    static layerAdvanced(
        shelfId,
        advancedLayerIds = [],
        details = {}
    ) {

        return GameEvents.create(
            GameEvents.TYPE.LAYER_ADVANCED,
            {
                shelfId,
                advancedLayerIds: [
                    ...advancedLayerIds
                ],
                ...details
            }
        );
    }


    /**
     * Evento SHELF_COLLAPSED.
     *
     * @param {string|number} shelfId
     * @param {Object} details
     * @returns {Object}
     */
    static shelfCollapsed(
        shelfId,
        details = {}
    ) {

        return GameEvents.create(
            GameEvents.TYPE.SHELF_COLLAPSED,
            {
                shelfId,
                ...details
            }
        );
    }


    /**
     * Evento LEVEL_COMPLETED.
     *
     * @param {number} levelNumber
     * @param {Object} details
     * @returns {Object}
     */
    static levelCompleted(
        levelNumber,
        details = {}
    ) {

        return GameEvents.create(
            GameEvents.TYPE.LEVEL_COMPLETED,
            {
                levelNumber,
                ...details
            }
        );
    }


    /**
     * Evento TIME_EXPIRED.
     *
     * @param {Object} details
     * @returns {Object}
     */
    static timeExpired(
        details = {}
    ) {

        return GameEvents.create(
            GameEvents.TYPE.TIME_EXPIRED,
            {
                ...details
            }
        );
    }


    /**
     * Evento LIFE_LOST.
     *
     * @param {Object} details
     * @returns {Object}
     */
    static lifeLost(
        details = {}
    ) {

        return GameEvents.create(
            GameEvents.TYPE.LIFE_LOST,
            {
                ...details
            }
        );
    }
}