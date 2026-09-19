import assert from "node:assert/strict";

import Board from "../../model/Board.js";
import Layer from "../../model/Layer.js";
import ObjectModel from "../../model/Object.js";
import Shelf from "../../model/Shelf.js";
import Slot from "../../model/Slot.js";
import Structure from "../../model/Structure.js"

import LevelState from "../../state/LevelState.js";

import MovementSystem
    from "../../systems/movement/MovementSystem.js";


function createLevel({
    objectId = "object-1",
    blocked = false,
    destinationOccupied = false
} = {}) {

    const board =
        new Board();

    const structure =
        new Structure({
            id: "structure-1",
            orientation:
                Structure.ORIENTATION.HORIZONTAL
        });

    const shelf =
        new Shelf({
            id: "shelf-1",
            type: Shelf.TYPE.NORMAL,
            behavior:
                Shelf.BEHAVIOR.STANDARD
        });

    const layer =
        new Layer({
            id: "layer-1"
        });

    layer.addSlot(
        new Slot({
            id: "source-slot",
            index: 0,
            objectId
        })
    );

    layer.addSlot(
        new Slot({
            id: "destination-slot",
            index: 1,
            objectId:
                destinationOccupied
                    ? "destination-object"
                    : null
        })
    );

    layer.addSlot(
        new Slot({
            id: "other-slot",
            index: 2
        })
    );

    shelf.addLayer(layer);
    structure.addShelf(shelf);
    board.addStructure(structure);

    const objects = [
        new ObjectModel({
            id: objectId,
            type: "apple",
            color: "red",
            blocked
        })
    ];

    if (destinationOccupied) {
        objects.push(
            new ObjectModel({
                id: "destination-object",
                type: "pear",
                color: "green"
            })
        );
    }

    const levelState =
        new LevelState({
            board,
            objects
        });

    /*
     * MovementRules necesita conocer que el Layer es TOP.
     *
     * El estado dinámico se inicializa explícitamente.
     */
    levelState.dynamic.setLayerState(
        "layer-1",
        "TOP"
    );

    return {
        levelState,
        structure,
        shelf,
        layer
    };
}


function run() {

    let passed = 0;


    // ---------------------------------------------------------
    // 1. Movimiento válido
    // ---------------------------------------------------------

    {
        const {
            levelState
        } = createLevel();

        const system =
            new MovementSystem(levelState);

        const result =
            system.execute({
                objectId: "object-1",
                destinationSlotId:
                    "destination-slot"
            });

        assert.equal(
            result.executed,
            true
        );

        assert.equal(
            result.reason,
            MovementSystem.REASON
                .MOVEMENT_EXECUTED
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 2. El Object queda en el destino
    // ---------------------------------------------------------

    {
        const {
            levelState
        } = createLevel();

        const system =
            new MovementSystem(levelState);

        system.execute({
            objectId: "object-1",
            destinationSlotId:
                "destination-slot"
        });

        const destination =
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .getLayerById("layer-1")
                .getSlotById("destination-slot");

        assert.equal(
            destination.objectId,
            "object-1"
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 3. El Slot origen queda vacío
    // ---------------------------------------------------------

    {
        const {
            levelState
        } = createLevel();

        const system =
            new MovementSystem(levelState);

        system.execute({
            objectId: "object-1",
            destinationSlotId:
                "destination-slot"
        });

        const source =
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .getLayerById("layer-1")
                .getSlotById("source-slot");

        assert.equal(
            source.isEmpty(),
            true
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 4. La identidad del Object permanece intacta
    // ---------------------------------------------------------

    {
        const {
            levelState
        } = createLevel();

        const object =
            levelState.getObjectById(
                "object-1"
            );

        const originalType =
            object.type;

        const originalColor =
            object.color;

        const system =
            new MovementSystem(levelState);

        system.execute({
            objectId: "object-1",
            destinationSlotId:
                "destination-slot"
        });

        const movedObject =
            levelState.getObjectById(
                "object-1"
            );

        assert.equal(
            movedObject,
            object
        );

        assert.equal(
            movedObject.type,
            originalType
        );

        assert.equal(
            movedObject.color,
            originalColor
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 5. Movimiento bloqueado -> no modifica estado
    // ---------------------------------------------------------

    {
        const {
            levelState
        } = createLevel({
            blocked: true
        });

        const system =
            new MovementSystem(levelState);

        const result =
            system.execute({
                objectId: "object-1",
                destinationSlotId:
                    "destination-slot"
            });

        assert.equal(
            result.executed,
            false
        );

        const source =
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .getLayerById("layer-1")
                .getSlotById("source-slot");

        const destination =
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .getLayerById("layer-1")
                .getSlotById("destination-slot");

        assert.equal(
            source.objectId,
            "object-1"
        );

        assert.equal(
            destination.isEmpty(),
            true
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 6. Destino ocupado -> no modifica estado
    // ---------------------------------------------------------

    {
        const {
            levelState
        } = createLevel({
            destinationOccupied: true
        });

        const system =
            new MovementSystem(levelState);

        const result =
            system.execute({
                objectId: "object-1",
                destinationSlotId:
                    "destination-slot"
            });

        assert.equal(
            result.executed,
            false
        );

        const source =
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .getLayerById("layer-1")
                .getSlotById("source-slot");

        const destination =
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .getLayerById("layer-1")
                .getSlotById("destination-slot");

        assert.equal(
            source.objectId,
            "object-1"
        );

        assert.equal(
            destination.objectId,
            "destination-object"
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 7. Object inexistente -> no modifica estado
    // ---------------------------------------------------------

    {
        const {
            levelState
        } = createLevel();

        const system =
            new MovementSystem(levelState);

        const result =
            system.execute({
                objectId: "does-not-exist",
                destinationSlotId:
                    "destination-slot"
            });

        assert.equal(
            result.executed,
            false
        );

        const source =
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .getLayerById("layer-1")
                .getSlotById("source-slot");

        assert.equal(
            source.objectId,
            "object-1"
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 8. El sistema utiliza MovementRules
    // ---------------------------------------------------------

    {
        const {
            levelState
        } = createLevel();

        const system =
            new MovementSystem(levelState);

        let rulesCalled = false;

        const originalValidate =
            system.rules.validate.bind(
                system.rules
            );

        system.rules.validate =
            (...args) => {
                rulesCalled = true;

                return originalValidate(...args);
            };

        system.execute({
            objectId: "object-1",
            destinationSlotId:
                "destination-slot"
        });

        assert.equal(
            rulesCalled,
            true
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 9. La estructura lógica no cambia
    // ---------------------------------------------------------

    {
        const {
            levelState,
            structure,
            shelf,
            layer
        } = createLevel();

        const system =
            new MovementSystem(levelState);

        system.execute({
            objectId: "object-1",
            destinationSlotId:
                "destination-slot"
        });

        assert.equal(
            levelState.board
                .getStructureById("structure-1"),
            structure
        );

        assert.equal(
            structure.getShelfById("shelf-1"),
            shelf
        );

        assert.equal(
            shelf.getLayerById("layer-1"),
            layer
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 10. El movimiento es reversible
    //
    // Demuestra que el sistema solamente modifica las
    // referencias objectId de los Slots.
    // ---------------------------------------------------------

    {
        const {
            levelState
        } = createLevel();

        const system =
            new MovementSystem(levelState);

        system.execute({
            objectId: "object-1",
            destinationSlotId:
                "destination-slot"
        });

        const reverse =
            system.execute({
                objectId: "object-1",
                destinationSlotId:
                    "source-slot"
            });

        assert.equal(
            reverse.executed,
            true
        );

        const source =
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .getLayerById("layer-1")
                .getSlotById("source-slot");

        const destination =
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .getLayerById("layer-1")
                .getSlotById("destination-slot");

        assert.equal(
            source.objectId,
            "object-1"
        );

        assert.equal(
            destination.isEmpty(),
            true
        );

        passed++;
    }


    console.log(
        `MovementSystem integration: ${passed}/10 OK`
    );
}


run();