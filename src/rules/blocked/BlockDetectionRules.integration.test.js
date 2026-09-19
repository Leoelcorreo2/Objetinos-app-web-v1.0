import test from "node:test";
import assert from "node:assert/strict";

import Board from "../../model/Board.js";
import Layer from "../../model/Layer.js";
import ObjectModel from "../../model/Object.js";
import Shelf from "../../model/Shelf.js";
import Slot from "../../model/Slot.js";
import Structure from "../../model/Structure.js"

import DynamicState from "../../state/DynamicState.js";
import LevelState from "../../state/LevelState.js";

import BlockDetectionRules
    from "../../rules/blocked/BlockDetectionRules.js";


function createLayer(
    id,
    objectIds
) {
    return new Layer({
        id,
        slots: objectIds.map(
            (objectId, index) =>
                new Slot({
                    id: `${id}-slot-${index}`,
                    index,
                    objectId
                })
        )
    });
}


function createNormalShelf(
    id,
    layers
) {
    return new Shelf({
        id,
        type: Shelf.TYPE.NORMAL,
        behavior: Shelf.BEHAVIOR.STANDARD,
        layers
    });
}


function createLevel({
    topObjectIds,
    topState = "TOP",
    extraObjects = [],
    extraLayers = []
}) {

    const topLayer =
        createLayer(
            "top",
            topObjectIds
        );

    const shelf =
        createNormalShelf(
            "shelf",
            [
                topLayer,
                ...extraLayers
            ]
        );

    const structure =
        new Structure({
            id: "structure",
            orientation:
                Structure.ORIENTATION.HORIZONTAL,
            shelves: [
                shelf
            ]
        });

    const board =
        new Board([
            structure
        ]);

    const objects =
        topObjectIds
            .filter(
                objectId =>
                    objectId !== null
            )
            .map(
                (id, index) =>
                    new ObjectModel({
                        id,
                        type: "TYPE",
                        color: String(index),
                        blocked: false
                    })
            );

    const dynamicState =
        new DynamicState();

    dynamicState.setLayerState(
        "top",
        topState
    );

    for (
        const layer
        of extraLayers
    ) {
        dynamicState.setLayerState(
            layer.id,
            "SHADED"
        );
    }

    return new LevelState({
        board,
        objects: [
            ...objects,
            ...extraObjects
        ],
        dynamicState
    });
}


/* ============================================================
 * MOVIMIENTO EXISTENTE
 * ============================================================
 */

test(
    "BlockDetectionRules: detecta que existe un movimiento normal válido",
    () => {

        const levelState =
            createLevel({
                topObjectIds: [
                    "object-a",
                    null,
                    null
                ]
            });

        const rules =
            new BlockDetectionRules(
                levelState
            );

        const result =
            rules.validate();

        assert.equal(
            result.blocked,
            false
        );

        assert.equal(
            result.reason,
            BlockDetectionRules.REASON.NOT_BLOCKED
        );

        assert.ok(
            result.validMove
        );

        assert.equal(
            result.validMove.objectId,
            "object-a"
        );
    }
);


/* ============================================================
 * BLOQUEO REAL
 * ============================================================
 */

test(
    "BlockDetectionRules: detecta bloqueo cuando todos los Objects TOP están bloqueados",
    () => {

        const levelState =
            createLevel({
                topObjectIds: [
                    "object-a",
                    "object-b",
                    "object-c"
                ]
            });

        levelState
            .getObjectById("object-a")
            .blocked = true;

        levelState
            .getObjectById("object-b")
            .blocked = true;

        levelState
            .getObjectById("object-c")
            .blocked = true;

        const rules =
            new BlockDetectionRules(
                levelState
            );

        const result =
            rules.validate();

        assert.equal(
            result.blocked,
            true
        );

        assert.equal(
            result.reason,
            BlockDetectionRules.REASON.BLOCKED
        );

        assert.equal(
            result.validMove,
            null
        );
    }
);


/* ============================================================
 * SHADED
 * ============================================================
 */

test(
    "BlockDetectionRules: un Object en SHADED no constituye un movimiento válido",
    () => {

        const levelState =
            createLevel({
                topObjectIds: [
                    "object-a",
                    "object-b",
                    "object-c"
                ],
                topState: "SHADED"
            });

        const rules =
            new BlockDetectionRules(
                levelState
            );

        const result =
            rules.validate();

        assert.equal(
            result.blocked,
            true
        );

        assert.equal(
            result.reason,
            BlockDetectionRules.REASON.BLOCKED
        );
    }
);


/* ============================================================
 * CAPAS POSTERIORES
 * ============================================================
 */

test(
    "BlockDetectionRules: Objects de Layers no-TOP no se consideran fuentes de movimiento",
    () => {

        const lowerLayer =
            createLayer(
                "lower",
                [
                    "object-d",
                    null,
                    null
                ]
            );

        const lowerObject =
            new ObjectModel({
                id: "object-d",
                type: "TYPE",
                color: "D",
                blocked: false
            });

        const levelState =
            createLevel({
                topObjectIds: [
                    "object-a",
                    "object-b",
                    "object-c"
                ],
                extraLayers: [
                    lowerLayer
                ],
                extraObjects: [
                    lowerObject
                ]
            });

        const rules =
            new BlockDetectionRules(
                levelState
            );

        const result =
            rules.validate();

        assert.equal(
            result.blocked,
            true
        );

        assert.ok(
            !result.movableObjectIds.includes(
                "object-d"
            )
        );
    }
);


/* ============================================================
 * MOVIMIENTO CON BLOQUEADOS PARCIALES
 * ============================================================
 */

test(
    "BlockDetectionRules: un Object libre permite movimiento aunque existan Objects bloqueados",
    () => {

        const levelState =
            createLevel({
                topObjectIds: [
                    "object-a",
                    "object-b",
                    null
                ]
            });

        levelState
            .getObjectById("object-a")
            .blocked = true;

        const rules =
            new BlockDetectionRules(
                levelState
            );

        const result =
            rules.validate();

        assert.equal(
            result.blocked,
            false
        );

        assert.ok(
            result.validMove
        );

        assert.equal(
            result.validMove.objectId,
            "object-b"
        );

        assert.equal(
            result.validMove.destinationSlotId,
            "top-slot-2"
        );
    }
);


/* ============================================================
 * REWARD
 * ============================================================
 */

test(
    "BlockDetectionRules: un REWARD no se considera origen de MOVE_OBJECT normal",
    () => {

        const reward =
            new ObjectModel({
                id: "reward",
                type: "REWARD",
                color: "GOLD",
                special: true,
                specialType:
                    ObjectModel.SPECIAL_TYPE.REWARD
            });

        const levelState =
            createLevel({
                topObjectIds: [
                    null,
                    null,
                    null
                ],
                extraObjects: [
                    reward
                ]
            });

        levelState.board
            .getStructureById(
                "structure"
            )
            .getShelfById(
                "shelf"
            )
            .getLayerById(
                "top"
            )
            .getSlotById(
                "top-slot-0"
            )
            .setObject(
                "reward"
            );

        const rules =
            new BlockDetectionRules(
                levelState
            );

        const result =
            rules.validate();

        assert.equal(
            result.blocked,
            true
        );

        assert.ok(
            !result.movableObjectIds.includes(
                "reward"
            )
        );
    }
);


/* ============================================================
 * VICTORIA
 * ============================================================
 */

test(
    "BlockDetectionRules: la victoria tiene prioridad cuando no quedan Objects",
    () => {

        const levelState =
            createLevel({
                topObjectIds: [
                    null,
                    null,
                    null
                ]
            });

        const rules =
            new BlockDetectionRules(
                levelState
            );

        const result =
            rules.validate();

        assert.equal(
            result.blocked,
            false
        );

        assert.equal(
            result.reason,
            BlockDetectionRules.REASON.VICTORY
        );

        assert.equal(
            result.remainingObjects,
            0
        );
    }
);


/* ============================================================
 * PUREZA
 * ============================================================
 */

test(
    "BlockDetectionRules: no modifica el estado",
    () => {

        const levelState =
            createLevel({
                topObjectIds: [
                    "object-a",
                    null,
                    null
                ]
            });

        const layer =
            levelState.board
                .getStructureById(
                    "structure"
                )
                .getShelfById(
                    "shelf"
                )
                .getLayerById(
                    "top"
                );

        const beforeSlots =
            layer.slots.map(
                slot =>
                    slot.objectId
            );

        const beforeObjects =
            levelState.objects.map(
                object =>
                    object.id
            );

        const rules =
            new BlockDetectionRules(
                levelState
            );

        rules.validate();

        assert.deepEqual(
            layer.slots.map(
                slot =>
                    slot.objectId
            ),
            beforeSlots
        );

        assert.deepEqual(
            levelState.objects.map(
                object =>
                    object.id
            ),
            beforeObjects
        );
    }
);


/* ============================================================
 * MOVEMENTRULES COMO AUTORIDAD
 * ============================================================
 */

test(
    "BlockDetectionRules: utiliza MovementRules para validar el movimiento candidato",
    () => {

        const levelState =
            createLevel({
                topObjectIds: [
                    "object-a",
                    null,
                    null
                ]
            });

        const rules =
            new BlockDetectionRules(
                levelState
            );

        const validMove =
            rules.getValidMove();

        assert.ok(
            validMove
        );

        assert.equal(
            validMove.valid,
            true
        );

        assert.equal(
            rules.hasValidMove(),
            true
        );

        assert.equal(
            rules.isBlocked(),
            false
        );
    }
);