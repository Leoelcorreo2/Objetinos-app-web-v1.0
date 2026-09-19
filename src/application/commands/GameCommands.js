/**
 * GameCommands
 *
 * Define las acciones que pueden ser solicitadas al motor
 * de Objetinos.
 *
 * IMPORTANTE:
 *
 * Un Command representa una INTENCIÓN.
 *
 * Un Command:
 * - no ejecuta ninguna acción;
 * - no modifica GameState;
 * - no modifica LevelState;
 * - no contiene reglas de juego;
 * - solamente describe qué acción se solicita.
 *
 * Los Systems y el GameController serán responsables de
 * interpretar y ejecutar posteriormente estos comandos.
 */
export default class GameCommands {

    static TYPE = Object.freeze({

        MOVE_OBJECT:
            "MOVE_OBJECT",

        USE_POWERUP:
            "USE_POWERUP",

        PAUSE_GAME:
            "PAUSE_GAME",

        CONTINUE_LEVEL:
            "CONTINUE_LEVEL",

        EXIT_TO_MENU:
            "EXIT_TO_MENU"
    });


    static VALUES = Object.freeze([
        GameCommands.TYPE.MOVE_OBJECT,
        GameCommands.TYPE.USE_POWERUP,
        GameCommands.TYPE.PAUSE_GAME,
        GameCommands.TYPE.CONTINUE_LEVEL,
        GameCommands.TYPE.EXIT_TO_MENU
    ]);


    /**
     * Comprueba si un tipo corresponde a un Command válido.
     *
     * @param {string} type
     * @returns {boolean}
     */
    static isValidType(type) {

        return GameCommands.VALUES.includes(
            type
        );
    }


    /**
     * Crea un Command.
     *
     * No ejecuta absolutamente nada.
     *
     * @param {string} type
     * @param {Object} payload
     * @returns {Object}
     */
    static create(
        type,
        payload = {}
    ) {

        if (
            !GameCommands.isValidType(
                type
            )
        ) {

            throw new Error(
                `GameCommands: tipo de comando inválido "${type}".`
            );
        }


        if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
        ) {

            throw new Error(
                "GameCommands: payload debe ser un objeto."
            );
        }


        return Object.freeze({

            type,

            payload: Object.freeze({
                ...payload
            })
        });
    }


    /**
     * Crea un comando MOVE_OBJECT.
     *
     * @param {string|number} objectId
     * @param {string|number} destinationSlotId
     * @returns {Object}
     */
    static moveObject(
        objectId,
        destinationSlotId
    ) {

        return GameCommands.create(
            GameCommands.TYPE.MOVE_OBJECT,
            {
                objectId,
                destinationSlotId
            }
        );
    }


    /**
     * Crea un comando USE_POWERUP.
     *
     * @param {string} powerUpId
     * @returns {Object}
     */
    static usePowerUp(
        powerUpId
    ) {

        return GameCommands.create(
            GameCommands.TYPE.USE_POWERUP,
            {
                powerUpId
            }
        );
    }


    /**
     * Crea un comando PAUSE_GAME.
     *
     * @returns {Object}
     */
    static pauseGame() {

        return GameCommands.create(
            GameCommands.TYPE.PAUSE_GAME
        );
    }


    /**
     * Crea un comando CONTINUE_LEVEL.
     *
     * @returns {Object}
     */
    static continueLevel() {

        return GameCommands.create(
            GameCommands.TYPE.CONTINUE_LEVEL
        );
    }


    /**
     * Crea un comando EXIT_TO_MENU.
     *
     * @returns {Object}
     */
    static exitToMenu() {

        return GameCommands.create(
            GameCommands.TYPE.EXIT_TO_MENU
        );
    }
}