import assert from "node:assert/strict";

import GameCommands from "./GameCommands.js";


let passed = 0;


function test(
    name,
    callback
) {

    try {

        callback();

        console.log(
            `✓ ${name}`
        );

        passed += 1;

    } catch (error) {

        console.error(
            `✗ ${name}`
        );

        throw error;
    }
}


test(
    "define todos los comandos conceptuales",
    () => {

        assert.deepEqual(
            GameCommands.VALUES,
            [
                "MOVE_OBJECT",
                "USE_POWERUP",
                "PAUSE_GAME",
                "CONTINUE_LEVEL",
                "EXIT_TO_MENU"
            ]
        );
    }
);


test(
    "reconoce tipos de comando válidos",
    () => {

        assert.equal(
            GameCommands.isValidType(
                GameCommands.TYPE.MOVE_OBJECT
            ),
            true
        );

        assert.equal(
            GameCommands.isValidType(
                "UNKNOWN"
            ),
            false
        );
    }
);


test(
    "crea un comando MOVE_OBJECT",
    () => {

        const command =
            GameCommands.moveObject(
                "object-1",
                "slot-9"
            );

        assert.equal(
            command.type,
            GameCommands.TYPE.MOVE_OBJECT
        );

        assert.deepEqual(
            command.payload,
            {
                objectId: "object-1",
                destinationSlotId: "slot-9"
            }
        );
    }
);


test(
    "crea un comando USE_POWERUP",
    () => {

        const command =
            GameCommands.usePowerUp(
                "hammer"
            );

        assert.equal(
            command.type,
            GameCommands.TYPE.USE_POWERUP
        );

        assert.deepEqual(
            command.payload,
            {
                powerUpId: "hammer"
            }
        );
    }
);


test(
    "crea comandos sin payload",
    () => {

        const pause =
            GameCommands.pauseGame();

        const continueLevel =
            GameCommands.continueLevel();

        const exit =
            GameCommands.exitToMenu();


        assert.deepEqual(
            pause,
            {
                type: "PAUSE_GAME",
                payload: {}
            }
        );

        assert.deepEqual(
            continueLevel,
            {
                type: "CONTINUE_LEVEL",
                payload: {}
            }
        );

        assert.deepEqual(
            exit,
            {
                type: "EXIT_TO_MENU",
                payload: {}
            }
        );
    }
);


test(
    "los comandos son inmutables",
    () => {

        const command =
            GameCommands.moveObject(
                "object-1",
                "slot-1"
            );

        assert.equal(
            Object.isFrozen(command),
            true
        );

        assert.equal(
            Object.isFrozen(command.payload),
            true
        );
    }
);


test(
    "rechaza tipos de comando inexistentes",
    () => {

        assert.throws(
            () => GameCommands.create(
                "INVALID_COMMAND"
            ),
            /tipo de comando inválido/
        );
    }
);


test(
    "rechaza payloads que no son objetos",
    () => {

        assert.throws(
            () => GameCommands.create(
                GameCommands.TYPE.PAUSE_GAME,
                null
            ),
            /payload debe ser un objeto/
        );

        assert.throws(
            () => GameCommands.create(
                GameCommands.TYPE.PAUSE_GAME,
                []
            ),
            /payload debe ser un objeto/
        );
    }
);


console.log(
    `\nGameCommands: ${passed}/8 tests PASS`
);