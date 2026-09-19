import assert from "node:assert/strict";

import Board from "../../model/Board.js";
import Layer from "../../model/Layer.js";
import ObjectModel from "../../model/Object.js";
import Shelf from "../../model/Shelf.js";
import Slot from "../../model/Slot.js";
import Structure from "../../model/Structure.js";

import LevelState from "../../state/LevelState.js";

import CollapseSystem from "./CollapseSystem.js";
import CollapseRules from "../../rules/collapse/CollapseRules.js";


function createLayer(
    id,
    slotCount,
    objectIds = []
) {
    const layer = new Layer({
        id
    });

    for (let i = 0; i < slotCount; i++) {
        layer.addSlot(
            new Slot({
                id: `${id}-slot-${i}`,
                index: i,
                objectId: objectIds[i] ?? null
            })
        );
    }

    return layer;
}


function createLevel({
    shelfId = "shelf-1",
    shelfType = Shelf.TYPE.NORMAL,
    behavior = Shelf.BEHAVIOR.COLLAPSIBLE,
    layerObjects = [[], []]
} = {}) {

    const board = new Board();

    const structure = new Structure({
        id: "structure-1",
        orientation:
            Structure.ORIENTATION.HORIZONTAL
    });

    const shelf = new Shelf({
        id: shelfId,
        type: shelfType,
        behavior
    });

    const slotCount =
        shelf.getSlotCountPerLayer();

    layerObjects.forEach(
        (objectIds, index) => {

            shelf.addLayer(
                createLayer(
                    `layer-${index + 1}`,
                    slotCount,
                    objectIds
                )
            );
        }
    );

    structure.addShelf(shelf);
    board.addStructure(structure);

    const objects = [];

    for (const ids of layerObjects) {

        for (const objectId of ids) {

            if (
                objectId !== null &&
                objectId !== undefined
            ) {
                objects.push(
                    new ObjectModel({
                        id: objectId,
                        type: "apple",
                        color: "red"
                    })
                );
            }
        }
    }

    return {
        levelState:
            new LevelState({
                board,
                objects
            }),

        board,
        structure,
        shelf
    };
}


function run() {

    let passed = 0;


    // ---------------------------------------------------------
    // 1. Colapso válido
    //
    // COLLAPSIBLE + todas las Layers vacías
    // ---------------------------------------------------------

    {
        const {
            levelState,
            structure,
            shelf
        } = createLevel();

        const system =
            new CollapseSystem(levelState);

        const result =
            system.execute("shelf-1");

        assert.equal(
            result.valid,
            true
        );

        assert.equal(
            result.executed,
            true
        );

        assert.equal(
            result.reason,
            CollapseSystem.REASON
                .SHELF_COLLAPSED
        );

        assert.equal(
            result.shelf,
            shelf
        );

        assert.equal(
            result.structureId,
            "structure-1"
        );

        assert.equal(
            structure.getShelfById(
                "shelf-1"
            ),
            null
        );

        assert.equal(
            structure.getShelfCount(),
            0
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 2. STANDARD no colapsa
    //
    // Y el estado permanece intacto.
    // ---------------------------------------------------------

    {
        const {
            levelState,
            structure,
            shelf
        } = createLevel({
            behavior:
                Shelf.BEHAVIOR.STANDARD
        });

        const beforeShelves =
            [...structure.shelves];

        const system =
            new CollapseSystem(levelState);

        const result =
            system.execute("shelf-1");

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.executed,
            false
        );

        assert.equal(
            result.validation.reason,
            CollapseRules.REASON
                .NOT_COLLAPSIBLE
        );

        assert.deepEqual(
            structure.shelves,
            beforeShelves
        );

        assert.equal(
            structure.getShelfById(
                "shelf-1"
            ),
            shelf
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 3. Shelf ocupada no colapsa
    // ---------------------------------------------------------

    {
        const {
            levelState,
            structure,
            shelf
        } = createLevel({
            layerObjects: [
                [],
                ["obj-1"]
            ]
        });

        const beforeShelves =
            [...structure.shelves];

        const system =
            new CollapseSystem(levelState);

        const result =
            system.execute("shelf-1");

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.executed,
            false
        );

        assert.equal(
            result.validation.reason,
            CollapseRules.REASON
                .SHELF_NOT_EMPTY
        );

        assert.deepEqual(
            structure.shelves,
            beforeShelves
        );

        assert.equal(
            structure.getShelfById(
                "shelf-1"
            ),
            shelf
        );

        assert.equal(
            levelState.getObjectById(
                "obj-1"
            )?.id,
            "obj-1"
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 4. Shelf inexistente
    //
    // No modifica la Structure.
    // ---------------------------------------------------------

    {
        const {
            levelState,
            structure
        } = createLevel();

        const beforeShelves =
            [...structure.shelves];

        const system =
            new CollapseSystem(levelState);

        const result =
            system.execute(
                "does-not-exist"
            );

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.executed,
            false
        );

        assert.equal(
            result.validation.reason,
            CollapseRules.REASON
                .SHELF_NOT_FOUND
        );

        assert.deepEqual(
            structure.shelves,
            beforeShelves
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 5. Identidad de Layers y Slots
    //
    // El colapso retira la Shelf de Structure,
    // pero NO recrea ni modifica sus Layers/Slots.
    // ---------------------------------------------------------

    {
        const {
            levelState,
            structure,
            shelf
        } = createLevel({
            layerObjects: [
                [],
                [],
                []
            ]
        });

        const layers =
            [...shelf.layers];

        const slots =
            layers.map(
                layer => [...layer.slots]
            );

        const system =
            new CollapseSystem(levelState);

        const result =
            system.execute("shelf-1");

        assert.equal(
            result.valid,
            true
        );

        assert.equal(
            result.shelf,
            shelf
        );

        assert.deepEqual(
            result.layerIds,
            layers.map(
                layer => layer.id
            )
        );

        assert.equal(
            result.shelf.layers[0],
            layers[0]
        );

        assert.equal(
            result.shelf.layers[1],
            layers[1]
        );

        assert.equal(
            result.shelf.layers[2],
            layers[2]
        );

        assert.equal(
            result.shelf.layers[0].slots[0],
            slots[0][0]
        );

        assert.equal(
            result.shelf.layers[1].slots[1],
            slots[1][1]
        );

        assert.equal(
            result.shelf.layers[2].slots[2],
            slots[2][2]
        );

        assert.equal(
            structure.getShelfById(
                "shelf-1"
            ),
            null
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 6. Los Objects registrados no se eliminan
    //
    // CollapseSystem no es responsable de eliminar Objects.
    // ---------------------------------------------------------

    {
        const {
            levelState
        } = createLevel({
            layerObjects: [
                [],
                ["obj-1"]
            ]
        });

        const beforeObjects =
            [...levelState.objects];

        const system =
            new CollapseSystem(levelState);

        const result =
            system.execute("shelf-1");

        assert.equal(
            result.executed,
            false
        );

        assert.deepEqual(
            levelState.objects,
            beforeObjects
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 7. collapse() es alias de execute()
    // ---------------------------------------------------------

    {
        const {
            levelState,
            structure
        } = createLevel();

        const system =
            new CollapseSystem(levelState);

        const result =
            system.collapse("shelf-1");

        assert.equal(
            result.valid,
            true
        );

        assert.equal(
            result.executed,
            true
        );

        assert.equal(
            structure.getShelfCount(),
            0
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 8. Segundo intento
    //
    // Una Shelf ya colapsada no puede volver a colapsarse.
    // ---------------------------------------------------------

    {
        const {
            levelState,
            structure
        } = createLevel();

        const system =
            new CollapseSystem(levelState);

        const first =
            system.execute("shelf-1");

        const second =
            system.execute("shelf-1");

        assert.equal(
            first.executed,
            true
        );

        assert.equal(
            second.executed,
            false
        );

        assert.equal(
            second.validation.reason,
            CollapseRules.REASON
                .SHELF_NOT_FOUND
        );

        assert.equal(
            structure.getShelfCount(),
            0
        );

        passed++;
    }


    console.log(
        `CollapseSystem integration: ${passed}/8 OK`
    );
}


run();