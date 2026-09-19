import assert from "node:assert/strict";

import GameEvents from "./GameEvents.js";


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
    "define todos los eventos conceptuales",
    () => {

        assert.deepEqual(
            GameEvents.VALUES,
            [
                "OBJECT_MOVED",
                "TRIO_COMPLETED",
                "POWERUP_USED",
                "LAYER_ADVANCED",
                "SHELF_COLLAPSED",
                "LEVEL_COMPLETED",
                "TIME_EXPIRED",
                "LIFE_LOST"
            ]
        );
    }
);


test(
    "reconoce tipos de evento válidos",
    () => {

        assert.equal(
            GameEvents.isValidType(
                GameEvents.TYPE.OBJECT_MOVED
            ),
            true
        );

        assert.equal(
            GameEvents.isValidType(
                "UNKNOWN"
            ),
            false
        );
    }
);


test(
    "crea OBJECT_MOVED con sus datos",
    () => {

        const event =
            GameEvents.objectMoved(
                "object-1",
                "slot-1",
                "slot-2"
            );

        assert.equal(
            event.type,
            GameEvents.TYPE.OBJECT_MOVED
        );

        assert.deepEqual(
            event.data,
            {
                objectId: "object-1",
                sourceSlot: "slot-1",
                destinationSlot: "slot-2"
            }
        );
    }
);


test(
    "crea TRIO_COMPLETED con objectIds",
    () => {

        const event =
            GameEvents.trioCompleted({
                shelfId: "shelf-1",
                layerId: "layer-1",
                objectType: "fruit",
                objectColor: "red",
                objectIds: [
                    "object-1",
                    "object-2",
                    "object-3"
                ]
            });

        assert.equal(
            event.type,
            GameEvents.TYPE.TRIO_COMPLETED
        );

        assert.deepEqual(
            event.data.objectIds,
            [
                "object-1",
                "object-2",
                "object-3"
            ]
        );

        assert.equal(
            event.data.shelfId,
            "shelf-1"
        );

        assert.equal(
            event.data.layerId,
            "layer-1"
        );
    }
);


test(
    "crea POWERUP_USED",
    () => {

        const event =
            GameEvents.powerUpUsed(
                "hammer",
                {
                    remaining: 2
                }
            );

        assert.equal(
            event.type,
            GameEvents.TYPE.POWERUP_USED
        );

        assert.deepEqual(
            event.data,
            {
                powerUpId: "hammer",
                remaining: 2
            }
        );
    }
);


test(
    "crea LAYER_ADVANCED",
    () => {

        const event =
            GameEvents.layerAdvanced(
                "shelf-1",
                [
                    "layer-2",
                    "layer-3"
                ]
            );

        assert.equal(
            event.type,
            GameEvents.TYPE.LAYER_ADVANCED
        );

        assert.deepEqual(
            event.data,
            {
                shelfId: "shelf-1",
                advancedLayerIds: [
                    "layer-2",
                    "layer-3"
                ]
            }
        );
    }
);


test(
    "crea SHELF_COLLAPSED y LEVEL_COMPLETED",
    () => {

        const collapsed =
            GameEvents.shelfCollapsed(
                "shelf-1"
            );

        const completed =
            GameEvents.levelCompleted(
                12
            );

        assert.equal(
            collapsed.type,
            "SHELF_COLLAPSED"
        );

        assert.deepEqual(
            collapsed.data,
            {
                shelfId: "shelf-1"
            }
        );

        assert.equal(
            completed.type,
            "LEVEL_COMPLETED"
        );

        assert.deepEqual(
            completed.data,
            {
                levelNumber: 12
            }
        );
    }
);


test(
    "crea TIME_EXPIRED y LIFE_LOST",
    () => {

        const timeout =
            GameEvents.timeExpired({
                remainingTime: 0
            });

        const lifeLost =
            GameEvents.lifeLost({
                remainingLives: 4
            });

        assert.deepEqual(
            timeout,
            {
                type: "TIME_EXPIRED",
                data: {
                    remainingTime: 0
                }
            }
        );

        assert.deepEqual(
            lifeLost,
            {
                type: "LIFE_LOST",
                data: {
                    remainingLives: 4
                }
            }
        );
    }
);


test(
    "los eventos son inmutables",
    () => {

        const event =
            GameEvents.objectMoved(
                "object-1",
                "slot-1",
                "slot-2"
            );

        assert.equal(
            Object.isFrozen(event),
            true
        );

        assert.equal(
            Object.isFrozen(event.data),
            true
        );
    }
);


test(
    "rechaza tipos de evento inexistentes",
    () => {

        assert.throws(
            () => GameEvents.create(
                "INVALID_EVENT"
            ),
            /tipo de evento inválido/
        );
    }
);


test(
    "rechaza datos que no son objetos",
    () => {

        assert.throws(
            () => GameEvents.create(
                GameEvents.TYPE.TIME_EXPIRED,
                null
            ),
            /data debe ser un objeto/
        );

        assert.throws(
            () => GameEvents.create(
                GameEvents.TYPE.TIME_EXPIRED,
                []
            ),
            /data debe ser un objeto/
        );
    }
);


console.log(
    `\nGameEvents: ${passed}/11 tests PASS`
);