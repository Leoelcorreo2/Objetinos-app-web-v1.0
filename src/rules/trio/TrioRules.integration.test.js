import test from "node:test";
import assert from "node:assert/strict";

import Board from "../../model/Board.js";
import Layer from "../../model/Layer.js";
import ObjectModel from "../../model/Object.js";
import Shelf from "../../model/Shelf.js";
import Slot from "../../model/Slot.js";
import Structure from "../../model/Structure.js";

import DynamicState from "../../state/DynamicState.js";
import LevelState from "../../state/LevelState.js";

import TrioRules from "../../rules/trio/TrioRules.js";


function createLayer(
    id,
    slotIds,
    objectIds = []
) {
    return new Layer({
        id,
        slots: slotIds.map((slotId, index) => {
            return new Slot({
                id: slotId,
                index,
                objectId: objectIds[index] ?? null
            });
        })
    });
}


function createNormalShelf(id, layers) {
    return new Shelf({
        id,
        type: Shelf.TYPE.NORMAL,
        behavior: Shelf.BEHAVIOR.STANDARD,
        layers
    });
}


function createBaseLevel() {
    /*
     * Shelf A
     *
     * TOP
     *
     * ┌────────┬────────┬────────┐
     * │ apple  │ apple  │ apple  │
     * └────────┴────────┴────────┘
     */
    const trioLayer = createLayer(
        "layer-trio",
        [
            "trio-0",
            "trio-1",
            "trio-2"
        ],
        [
            "apple-red-1",
            "apple-red-2",
            "apple-red-3"
        ]
    );

    /*
     * Segunda capa del mismo Shelf.
     *
     * No debe participar porque no es TOP.
     */
    const lowerLayer = createLayer(
        "layer-lower",
        [
            "lower-0",
            "lower-1",
            "lower-2"
        ],
        [
            "apple-red-lower",
            null,
            null
        ]
    );

    const trioShelf = createNormalShelf(
        "shelf-trio",
        [
            trioLayer,
            lowerLayer
        ]
    );

    /*
     * Shelf B.
     *
     * Contiene otros objetos iguales.
     * NO deben combinarse con los de Shelf A.
     */
    const otherShelfLayer = createLayer(
        "layer-other",
        [
            "other-0",
            "other-1",
            "other-2"
        ],
        [
            "apple-red-other",
            null,
            null
        ]
    );

    const otherShelf = createNormalShelf(
        "shelf-other",
        [
            otherShelfLayer
        ]
    );

    const structure = new Structure({
        id: "structure-main",
        orientation: Structure.ORIENTATION.HORIZONTAL,
        shelves: [
            trioShelf,
            otherShelf
        ]
    });

    const board = new Board([
        structure
    ]);

    const objects = [
        new ObjectModel({
            id: "apple-red-1",
            type: "APPLE",
            color: "RED"
        }),

        new ObjectModel({
            id: "apple-red-2",
            type: "APPLE",
            color: "RED"
        }),

        new ObjectModel({
            id: "apple-red-3",
            type: "APPLE",
            color: "RED"
        }),

        new ObjectModel({
            id: "apple-red-lower",
            type: "APPLE",
            color: "RED"
        }),

        new ObjectModel({
            id: "apple-red-other",
            type: "APPLE",
            color: "RED"
        })
    ];

    const dynamicState =
        new DynamicState();

    dynamicState.setLayerState(
        "layer-trio",
        "TOP"
    );

    dynamicState.setLayerState(
        "layer-lower",
        "SHADED"
    );

    dynamicState.setLayerState(
        "layer-other",
        "TOP"
    );

    return new LevelState({
        board,
        objects,
        dynamicState
    });
}


/* ============================================================
 * TRÍO VÁLIDO
 * ============================================================
 */

test(
    "TrioRules: detecta tres objetos iguales en la misma Layer TOP",
    () => {
        const levelState =
            createBaseLevel();

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId: "trio-2"
            });

        assert.equal(
            result.valid,
            true
        );

        assert.equal(
            result.reason,
            TrioRules.REASON.VALID
        );

        assert.equal(
            result.structureId,
            "structure-main"
        );

        assert.equal(
            result.shelfId,
            "shelf-trio"
        );

        assert.equal(
            result.layerId,
            "layer-trio"
        );

        assert.equal(
            result.objectId,
            "apple-red-3"
        );

        assert.equal(
            result.matchKey,
            "APPLE::RED"
        );

        assert.deepEqual(
            result.objectIds,
            [
                "apple-red-1",
                "apple-red-2",
                "apple-red-3"
            ]
        );
    }
);


/* ============================================================
 * TYPE
 * ============================================================
 */

test(
    "TrioRules: type diferente impide formar trío",
    () => {
        const levelState =
            createBaseLevel();

        const thirdObject =
            levelState.getObjectById(
                "apple-red-3"
            );

        thirdObject.type = "BOTTLE";

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId: "trio-2"
            });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            TrioRules.REASON.NO_TRIO
        );

        assert.deepEqual(
            result.objectIds,
            []
        );
    }
);


/* ============================================================
 * COLOR
 * ============================================================
 */

test(
    "TrioRules: color diferente impide formar trío",
    () => {
        const levelState =
            createBaseLevel();

        const thirdObject =
            levelState.getObjectById(
                "apple-red-3"
            );

        thirdObject.color = "BLUE";

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId: "trio-2"
            });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            TrioRules.REASON.NO_TRIO
        );
    }
);


/* ============================================================
 * SHELF
 * ============================================================
 */

test(
    "TrioRules: no combina objetos iguales de Shelves diferentes",
    () => {
        const levelState =
            createBaseLevel();

        /*
         * Dejamos solamente dos objetos iguales
         * en el Shelf del trío y otro en otro Shelf.
         */
        const firstSlot =
            levelState.board
                .getStructureById("structure-main")
                .getShelfById("shelf-trio")
                .getLayerById("layer-trio")
                .getSlotById("trio-0");

        firstSlot.clear();

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId: "trio-2"
            });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            TrioRules.REASON.NO_TRIO
        );
    }
);


/* ============================================================
 * LAYER
 * ============================================================
 */

test(
    "TrioRules: no combina objetos iguales de Layers diferentes",
    () => {
        const levelState =
            createBaseLevel();

        /*
         * Eliminamos uno de los objetos de la TOP.
         * Existe otro igual en una Layer inferior,
         * pero no puede completar el trío.
         */
        const firstSlot =
            levelState.board
                .getStructureById("structure-main")
                .getShelfById("shelf-trio")
                .getLayerById("layer-trio")
                .getSlotById("trio-0");

        firstSlot.clear();

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId: "trio-2"
            });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            TrioRules.REASON.NO_TRIO
        );
    }
);


/* ============================================================
 * TOP
 * ============================================================
 */

test(
    "TrioRules: una Layer que no es TOP no puede producir un trío",
    () => {
        const levelState =
            createBaseLevel();

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId: "lower-0"
            });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            TrioRules.REASON.DESTINATION_NOT_TOP
        );
    }
);


/* ============================================================
 * BLOQUEADOS
 * ============================================================
 */

test(
    "TrioRules: los objetos bloqueados sí pueden formar parte de un trío",
    () => {
        const levelState =
            createBaseLevel();

        const blockedObject =
            levelState.getObjectById(
                "apple-red-1"
            );

        blockedObject.blocked = true;

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId: "trio-2"
            });

        assert.equal(
            result.valid,
            true
        );

        assert.deepEqual(
            result.objectIds,
            [
                "apple-red-1",
                "apple-red-2",
                "apple-red-3"
            ]
        );
    }
);


/* ============================================================
 * SPECIAL / REWARD
 * ============================================================
 */

test(
    "TrioRules: un objeto REWARD no forma parte de un trío",
    () => {
        const levelState =
            createBaseLevel();

        const reward =
            new ObjectModel({
                id: "reward-red",
                type: "APPLE",
                color: "RED",
                special: true,
                specialType:
                    ObjectModel.SPECIAL_TYPE.REWARD
            });

        levelState.addObject(reward);

        const destinationSlot =
            levelState.board
                .getStructureById("structure-main")
                .getShelfById("shelf-trio")
                .getLayerById("layer-trio")
                .getSlotById("trio-2");

        destinationSlot.setObject(
            "reward-red"
        );

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId: "trio-2"
            });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            TrioRules.REASON.SPECIAL_OBJECT
        );

        assert.deepEqual(
            result.objectIds,
            []
        );
    }
);


/* ============================================================
 * DESTINO VACÍO
 * ============================================================
 */

test(
    "TrioRules: un destino vacío no produce un trío",
    () => {
        const levelState =
            createBaseLevel();

        const destinationSlot =
            levelState.board
                .getStructureById("structure-main")
                .getShelfById("shelf-trio")
                .getLayerById("layer-trio")
                .getSlotById("trio-2");

        destinationSlot.clear();

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId: "trio-2"
            });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            TrioRules.REASON.NO_TRIO
        );
    }
);


/* ============================================================
 * DESTINO INEXISTENTE
 * ============================================================
 */

test(
    "TrioRules: rechaza un destino inexistente",
    () => {
        const levelState =
            createBaseLevel();

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId:
                    "does-not-exist"
            });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            TrioRules.REASON.DESTINATION_NOT_FOUND
        );
    }
);


/* ============================================================
 * API BOOLEAN
 * ============================================================
 */

test(
    "TrioRules: hasTrio devuelve true cuando existe un trío",
    () => {
        const levelState =
            createBaseLevel();

        const rules =
            new TrioRules(levelState);

        assert.equal(
            rules.hasTrio({
                destinationSlotId: "trio-2"
            }),
            true
        );
    }
);


test(
    "TrioRules: hasTrio devuelve false cuando no existe un trío",
    () => {
        const levelState =
            createBaseLevel();

        const rules =
            new TrioRules(levelState);

        assert.equal(
            rules.hasTrio({
                destinationSlotId: "lower-0"
            }),
            false
        );
    }
);


/* ============================================================
 * PUREZA / NO MUTACIÓN
 * ============================================================
 */

test(
    "TrioRules: detectar un trío no modifica el estado",
    () => {
        const levelState =
            createBaseLevel();

        const layer =
            levelState.board
                .getStructureById("structure-main")
                .getShelfById("shelf-trio")
                .getLayerById("layer-trio");

        const before =
            layer.slots.map(
                slot => slot.objectId
            );

        const objectCountBefore =
            levelState.getObjectCount();

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId: "trio-2"
            });

        assert.equal(
            result.valid,
            true
        );

        assert.deepEqual(
            layer.slots.map(
                slot => slot.objectId
            ),
            before
        );

        assert.equal(
            levelState.getObjectCount(),
            objectCountBefore
        );
    }
);


/* ============================================================
 * MÁXIMO UN TRÍO
 * ============================================================
 */

test(
    "TrioRules: una única capa NORMAL solo puede devolver un único trío",
    () => {
        const levelState =
            createBaseLevel();

        const rules =
            new TrioRules(levelState);

        const result =
            rules.validate({
                destinationSlotId: "trio-2"
            });

        assert.equal(
            result.valid,
            true
        );

        assert.equal(
            result.objectIds.length,
            3
        );

        /*
         * La regla devuelve exactamente los tres Objects
         * de la capa destino, no una colección de posibles tríos.
         */
        assert.equal(
            Array.isArray(result.objectIds),
            true
        );
    }
);