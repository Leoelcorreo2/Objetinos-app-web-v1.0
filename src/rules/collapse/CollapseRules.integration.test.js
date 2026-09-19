import assert from "node:assert/strict";

import Board from "../../model/Board.js";
import Layer from "../../model/Layer.js";
import ObjectModel from "../../model/Object.js";
import Shelf from "../../model/Shelf.js";
import Slot from "../../model/Slot.js";
import Structure from "../../model/Structure.js"


import LevelState from "../../state/LevelState.js";

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
        orientation: Structure.ORIENTATION.HORIZONTAL
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
        levelState: new LevelState({
            board,
            objects
        }),
        shelf
    };
}


function run() {

    let passed = 0;


    // ---------------------------------------------------------
    // 1. COLLAPSIBLE + todas las Layers vacías
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel({
                layerObjects: [[], []]
            });

        const rules =
            new CollapseRules(levelState);

        const result =
            rules.validate("shelf-1");

        assert.equal(result.valid, true);

        assert.equal(
            result.reason,
            CollapseRules.REASON.VALID_COLLAPSE
        );

        assert.deepEqual(
            result.layerIds,
            [
                "layer-1",
                "layer-2"
            ]
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 2. STANDARD vacío
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel({
                behavior:
                    Shelf.BEHAVIOR.STANDARD,

                layerObjects: [
                    [],
                    []
                ]
            });

        const rules =
            new CollapseRules(levelState);

        assert.equal(
            rules.canCollapse("shelf-1"),
            false
        );

        assert.equal(
            rules.validate("shelf-1").reason,
            CollapseRules.REASON.NOT_COLLAPSIBLE
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 3. Una Layer ocupada
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel({
                layerObjects: [
                    [],
                    ["obj-1"]
                ]
            });

        const rules =
            new CollapseRules(levelState);

        const result =
            rules.validate("shelf-1");

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            CollapseRules.REASON.SHELF_NOT_EMPTY
        );

        assert.deepEqual(
            result.occupiedLayerIds,
            ["layer-2"]
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 4. Una Layer no TOP ocupada también impide el colapso
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel({
                layerObjects: [
                    ["obj-1"],
                    []
                ]
            });

        const rules =
            new CollapseRules(levelState);

        assert.equal(
            rules.canCollapse("shelf-1"),
            false
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 5. Número variable de Layers
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel({
                layerObjects: [
                    [],
                    [],
                    [],
                    []
                ]
            });

        const rules =
            new CollapseRules(levelState);

        assert.equal(
            rules.canCollapse("shelf-1"),
            true
        );

        assert.equal(
            rules.areAllLayersEmpty("shelf-1"),
            true
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 6. SPECIAL vacío + STANDARD
    //
    // No tomamos aquí ninguna decisión sobre el comportamiento
    // provisional del SPECIAL vacío.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel({
                shelfType:
                    Shelf.TYPE.SPECIAL,

                behavior:
                    Shelf.BEHAVIOR.STANDARD,

                layerObjects: [
                    []
                ]
            });

        const rules =
            new CollapseRules(levelState);

        assert.equal(
            rules.canCollapse("shelf-1"),
            false
        );

        assert.equal(
            rules.validate("shelf-1").reason,
            CollapseRules.REASON.NOT_COLLAPSIBLE
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 7. Shelf inexistente
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel();

        const rules =
            new CollapseRules(levelState);

        const result =
            rules.validate(
                "does-not-exist"
            );

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            CollapseRules.REASON.SHELF_NOT_FOUND
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 8. Shelf sin Layers
    // ---------------------------------------------------------

    {
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
                id: "shelf-empty",
                type: Shelf.TYPE.NORMAL,
                behavior:
                    Shelf.BEHAVIOR.COLLAPSIBLE
            });

        structure.addShelf(shelf);
        board.addStructure(structure);

        const levelState =
            new LevelState({
                board
            });

        const rules =
            new CollapseRules(levelState);

        const result =
            rules.validate(
                "shelf-empty"
            );

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            CollapseRules.REASON.NO_LAYERS
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 9. CollapseRules no modifica el estado
    // ---------------------------------------------------------

    {
        const {
            levelState,
            shelf
        } = createLevel({
            layerObjects: [
                [],
                []
            ]
        });

        const beforeLayers =
            [...shelf.layers];

        const beforeSlots =
            shelf.layers.map(
                layer => [...layer.slots]
            );

        const beforeObjects =
            [...levelState.objects];

        const rules =
            new CollapseRules(levelState);

        rules.validate("shelf-1");

        assert.deepEqual(
            shelf.layers,
            beforeLayers
        );

        assert.deepEqual(
            shelf.layers.map(
                layer => layer.slots
            ),
            beforeSlots
        );

        assert.deepEqual(
            levelState.objects,
            beforeObjects
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 10. areAllLayersEmpty() comprueba TODAS las Layers
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel({
                layerObjects: [
                    [],
                    ["obj-1"],
                    []
                ]
            });

        const rules =
            new CollapseRules(levelState);

        assert.equal(
            rules.areAllLayersEmpty("shelf-1"),
            false
        );

        passed++;
    }


    console.log(
        `CollapseRules integration: ${passed}/10 OK`
    );
}


run();