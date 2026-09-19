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

import MovementRules from "../../rules/movement/MovementRules.js";


function createLayer(id, slotIds, objectIds = []) {
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


function createLevel() {
    /*
     * SOURCE
     *
     * TOP
     * ┌───────────────┐
     * │ object-a      │
     * │ empty         │
     * │ empty         │
     * └───────────────┘
     */
    const sourceLayer = createLayer(
        "layer-source",
        [
            "source-0",
            "source-1",
            "source-2"
        ],
        [
            "object-a",
            null,
            null
        ]
    );


    /*
     * DESTINATION
     *
     * TOP
     * ┌───────────────┐
     * │ empty         │
     * │ empty         │
     * │ empty         │
     * └───────────────┘
     */
    const destinationLayer = createLayer(
        "layer-destination",
        [
            "destination-0",
            "destination-1",
            "destination-2"
        ],
        [
            null,
            null,
            null
        ]
    );


    /*
     * SHADING TEST
     *
     * SHADED
     */
    const shadedLayer = createLayer(
        "layer-shaded",
        [
            "shaded-0",
            "shaded-1",
            "shaded-2"
        ],
        [
            null,
            null,
            null
        ]
    );


    /*
     * BLOCKED OBJECT
     *
     * TOP
     */
    const blockedLayer = createLayer(
        "layer-blocked",
        [
            "blocked-0",
            "blocked-1",
            "blocked-2"
        ],
        [
            "object-blocked",
            null,
            null
        ]
    );


    const sourceShelf = createNormalShelf(
        "shelf-source",
        [
            sourceLayer
        ]
    );


    const destinationShelf = createNormalShelf(
        "shelf-destination",
        [
            destinationLayer,
            shadedLayer
        ]
    );


    const blockedShelf = createNormalShelf(
        "shelf-blocked",
        [
            blockedLayer
        ]
    );


    const sourceStructure = new Structure({
        id: "structure-source",
        orientation: Structure.ORIENTATION.HORIZONTAL,
        shelves: [
            sourceShelf
        ]
    });


    const destinationStructure = new Structure({
        id: "structure-destination",
        orientation: Structure.ORIENTATION.HORIZONTAL,
        shelves: [
            destinationShelf
        ]
    });


    const blockedStructure = new Structure({
        id: "structure-blocked",
        orientation: Structure.ORIENTATION.HORIZONTAL,
        shelves: [
            blockedShelf
        ]
    });


    const board = new Board([
        sourceStructure,
        destinationStructure,
        blockedStructure
    ]);


    const objects = [
        new ObjectModel({
            id: "object-a",
            type: "apple",
            color: "red"
        }),

        new ObjectModel({
            id: "object-blocked",
            type: "pear",
            color: "green",
            blocked: true
        }),

        new ObjectModel({
            id: "object-unused",
            type: "book",
            color: "blue"
        })
    ];


    const dynamicState = new DynamicState();

    dynamicState.setLayerState(
        "layer-source",
        "TOP"
    );

    dynamicState.setLayerState(
        "layer-destination",
        "TOP"
    );

    dynamicState.setLayerState(
        "layer-shaded",
        "SHADED"
    );

    dynamicState.setLayerState(
        "layer-blocked",
        "TOP"
    );


    return new LevelState({
        board,
        objects,
        dynamicState
    });
}


/* ============================================================
 * VALIDACIÓN POSITIVA
 * ============================================================
 */

test(
    "MovementRules: acepta un movimiento válido entre estructuras distintas",
    () => {
        const levelState = createLevel();
        const rules = new MovementRules(levelState);

        const result = rules.validate({
            objectId: "object-a",
            destinationSlotId: "destination-0"
        });

        assert.equal(
            result.valid,
            true
        );

        assert.equal(
            result.reason,
            MovementRules.REASON.VALID
        );

        assert.equal(
            result.sourceSlotId,
            "source-0"
        );

        assert.equal(
            result.destinationSlotId,
            "destination-0"
        );

        assert.equal(
            result.sourceLayerId,
            "layer-source"
        );

        assert.equal(
            result.destinationLayerId,
            "layer-destination"
        );

        assert.equal(
            result.sourceShelfId,
            "shelf-source"
        );

        assert.equal(
            result.destinationShelfId,
            "shelf-destination"
        );

        assert.equal(
            result.sourceStructureId,
            "structure-source"
        );

        assert.equal(
            result.destinationStructureId,
            "structure-destination"
        );
    }
);


/* ============================================================
 * ORIGEN
 * ============================================================
 */

test(
    "MovementRules: solo permite mover desde una capa TOP",
    () => {
        const levelState = createLevel();

        levelState.dynamic.setLayerState(
            "layer-source",
            "SHADED"
        );

        const rules = new MovementRules(levelState);

        const result = rules.validate({
            objectId: "object-a",
            destinationSlotId: "destination-0"
        });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            MovementRules.REASON.SOURCE_NOT_TOP
        );
    }
);


test(
    "MovementRules: rechaza un objeto bloqueado aunque esté en TOP",
    () => {
        const levelState = createLevel();
        const rules = new MovementRules(levelState);

        const result = rules.validate({
            objectId: "object-blocked",
            destinationSlotId: "destination-0"
        });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            MovementRules.REASON.OBJECT_BLOCKED
        );
    }
);


test(
    "MovementRules: rechaza un objeto inexistente",
    () => {
        const levelState = createLevel();
        const rules = new MovementRules(levelState);

        const result = rules.validate({
            objectId: "does-not-exist",
            destinationSlotId: "destination-0"
        });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            MovementRules.REASON.OBJECT_NOT_FOUND
        );
    }
);


test(
    "MovementRules: rechaza un objeto registrado pero sin ubicación lógica",
    () => {
        const levelState = createLevel();
        const rules = new MovementRules(levelState);

        const result = rules.validate({
            objectId: "object-unused",
            destinationSlotId: "destination-0"
        });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            MovementRules.REASON.OBJECT_LOCATION_NOT_FOUND
        );
    }
);


/* ============================================================
 * DESTINO
 * ============================================================
 */

test(
    "MovementRules: rechaza un destino inexistente",
    () => {
        const levelState = createLevel();
        const rules = new MovementRules(levelState);

        const result = rules.validate({
            objectId: "object-a",
            destinationSlotId: "does-not-exist"
        });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            MovementRules.REASON.DESTINATION_NOT_FOUND
        );
    }
);


test(
    "MovementRules: rechaza un destino que no está en TOP",
    () => {
        const levelState = createLevel();
        const rules = new MovementRules(levelState);

        const result = rules.validate({
            objectId: "object-a",
            destinationSlotId: "shaded-0"
        });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            MovementRules.REASON.DESTINATION_NOT_TOP
        );
    }
);


test(
    "MovementRules: rechaza un destino ocupado",
    () => {
        const levelState = createLevel();
        const rules = new MovementRules(levelState);

        const destinationSlot =
            levelState.board
                .getStructureById(
                    "structure-destination"
                )
                .getShelfById(
                    "shelf-destination"
                )
                .getLayerById(
                    "layer-destination"
                )
                .getSlotById(
                    "destination-0"
                );

        destinationSlot.setObject(
            "object-blocked"
        );

        const result = rules.validate({
            objectId: "object-a",
            destinationSlotId: "destination-0"
        });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            MovementRules.REASON.DESTINATION_OCCUPIED
        );
    }
);


test(
    "MovementRules: rechaza mover al mismo Slot de origen",
    () => {
        const levelState = createLevel();
        const rules = new MovementRules(levelState);

        const result = rules.validate({
            objectId: "object-a",
            destinationSlotId: "source-0"
        });

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            MovementRules.REASON.SAME_SLOT
        );
    }
);


/* ============================================================
 * ESTRUCTURAS MÓVILES
 * ============================================================
 */

test(
    "MovementRules: permite destino TOP perteneciente a una estructura móvil",
    () => {
        const levelState = createLevel();

        const destinationStructure =
            levelState.board.getStructureById(
                "structure-destination"
            );

        destinationStructure.movement.enabled = true;
        destinationStructure.movement.direction = 1;
        destinationStructure.movement.speed = 100;

        const rules = new MovementRules(levelState);

        const result = rules.validate({
            objectId: "object-a",
            destinationSlotId: "destination-1"
        });

        assert.equal(
            result.valid,
            true
        );

        assert.equal(
            result.reason,
            MovementRules.REASON.VALID
        );
    }
);


/* ============================================================
 * PUREZA / NO MUTACIÓN
 * ============================================================
 */

test(
    "MovementRules: no modifica el estado al validar",
    () => {
        const levelState = createLevel();
        const rules = new MovementRules(levelState);

        const sourceSlot =
            levelState.board
                .getStructureById(
                    "structure-source"
                )
                .getShelfById(
                    "shelf-source"
                )
                .getLayerById(
                    "layer-source"
                )
                .getSlotById(
                    "source-0"
                );

        const destinationSlot =
            levelState.board
                .getStructureById(
                    "structure-destination"
                )
                .getShelfById(
                    "shelf-destination"
                )
                .getLayerById(
                    "layer-destination"
                )
                .getSlotById(
                    "destination-0"
                );

        const beforeSource =
            sourceSlot.objectId;

        const beforeDestination =
            destinationSlot.objectId;

        rules.validate({
            objectId: "object-a",
            destinationSlotId: "destination-0"
        });

        assert.equal(
            sourceSlot.objectId,
            beforeSource
        );

        assert.equal(
            destinationSlot.objectId,
            beforeDestination
        );
    }
);


/* ============================================================
 * API BOOLEAN
 * ============================================================
 */

test(
    "MovementRules: canMove devuelve solo el resultado booleano",
    () => {
        const levelState = createLevel();
        const rules = new MovementRules(levelState);

        assert.equal(
            rules.canMove({
                objectId: "object-a",
                destinationSlotId: "destination-0"
            }),
            true
        );

        assert.equal(
            rules.canMove({
                objectId: "object-a",
                destinationSlotId: "shaded-0"
            }),
            false
        );
    }
);