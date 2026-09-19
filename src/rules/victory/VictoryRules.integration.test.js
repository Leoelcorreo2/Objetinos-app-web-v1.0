import assert from "node:assert/strict";

import Board from "../../model/Board.js";
import Structure from "../../model/Structure.js";
import Shelf from "../../model/Shelf.js";
import Layer from "../../model/Layer.js";
import Slot from "../../model/Slot.js";
import ObjectModel from "../../model/Object.js";

import LevelState from "../../state/LevelState.js";
import GamePhase from "../../state/GamePhase.js";

import VictoryRules
    from "../../rules/victory/VictoryRules.js";


function createLevel(objectIds = []) {

    const board = new Board();

    const structure = new Structure({
        id: "structure-1",
        orientation:
            Structure.ORIENTATION.HORIZONTAL
    });

    const shelf = new Shelf({
        id: "shelf-1",
        type: Shelf.TYPE.NORMAL,
        behavior: Shelf.BEHAVIOR.STANDARD
    });

    const layer = new Layer({
        id: "layer-1"
    });

    for (let index = 0; index < 3; index++) {
        layer.addSlot(
            new Slot({
                id: `slot-${index}`,
                index,
                objectId: objectIds[index] ?? null
            })
        );
    }

    shelf.addLayer(layer);
    structure.addShelf(shelf);
    board.addStructure(structure);

    const objects = objectIds.map(id =>
        new ObjectModel({
            id,
            type: "apple",
            color: "red"
        })
    );

    return {
        levelState: new LevelState({
            board,
            objects
        }),
        structure,
        shelf,
        layer
    };
}


function run() {

    let passed = 0;


    // ---------------------------------------------------------
    // 1. Cero Objects -> victoria
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        const rules =
            new VictoryRules(levelState);

        const result =
            rules.validate();

        assert.equal(
            result.valid,
            true
        );

        assert.equal(
            result.reason,
            VictoryRules.REASON.VICTORY
        );

        assert.equal(
            result.totalObjects,
            0
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 2. Un Object restante -> no victoria
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([
                "object-1"
            ]);

        const rules =
            new VictoryRules(levelState);

        const result =
            rules.validate();

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            VictoryRules.REASON.OBJECTS_REMAINING
        );

        assert.equal(
            result.totalObjects,
            1
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 3. Varios Objects restantes -> no victoria
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([
                "object-1",
                "object-2",
                "object-3"
            ]);

        const rules =
            new VictoryRules(levelState);

        assert.equal(
            rules.isVictory(),
            false
        );

        assert.equal(
            rules.validate().totalObjects,
            3
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 4. Los Objects bloqueados siguen contando
    // ---------------------------------------------------------

    {
        const board = new Board();

        const structure = new Structure({
            id: "structure-1",
            orientation:
                Structure.ORIENTATION.HORIZONTAL
        });

        const shelf = new Shelf({
            id: "shelf-1",
            type: Shelf.TYPE.NORMAL,
            behavior: Shelf.BEHAVIOR.STANDARD
        });

        const layer = new Layer({
            id: "layer-1"
        });

        layer.addSlot(
            new Slot({
                id: "slot-0",
                index: 0,
                objectId: "blocked-object"
            })
        );

        layer.addSlot(
            new Slot({
                id: "slot-1",
                index: 1
            })
        );

        layer.addSlot(
            new Slot({
                id: "slot-2",
                index: 2
            })
        );

        shelf.addLayer(layer);
        structure.addShelf(shelf);
        board.addStructure(structure);

        const blockedObject =
            new ObjectModel({
                id: "blocked-object",
                type: "apple",
                color: "red",
                blocked: true
            });

        const levelState =
            new LevelState({
                board,
                objects: [
                    blockedObject
                ]
            });

        const rules =
            new VictoryRules(levelState);

        assert.equal(
            rules.isVictory(),
            false
        );

        assert.equal(
            rules.validate().totalObjects,
            1
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 5. Los Objects especiales REWARD también cuentan
    // ---------------------------------------------------------

    {
        const board = new Board();

        const structure = new Structure({
            id: "structure-1",
            orientation:
                Structure.ORIENTATION.HORIZONTAL
        });

        const shelf = new Shelf({
            id: "shelf-1",
            type: Shelf.TYPE.SPECIAL,
            behavior: Shelf.BEHAVIOR.STANDARD
        });

        const layer = new Layer({
            id: "layer-1"
        });

        layer.addSlot(
            new Slot({
                id: "slot-0",
                index: 0,
                objectId: "reward-1"
            })
        );

        shelf.addLayer(layer);
        structure.addShelf(shelf);
        board.addStructure(structure);

        const reward =
            new ObjectModel({
                id: "reward-1",
                type: "reward",
                color: "gold",
                special: true,
                specialType:
                    ObjectModel.SPECIAL_TYPE.REWARD
            });

        const levelState =
            new LevelState({
                board,
                objects: [reward]
            });

        const rules =
            new VictoryRules(levelState);

        assert.equal(
            rules.isVictory(),
            false
        );

        assert.equal(
            rules.validate().totalObjects,
            1
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 6. La victoria no depende de la fase actual
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        levelState.setPhase(
            GamePhase.PLAYING
        );

        const rules =
            new VictoryRules(levelState);

        assert.equal(
            rules.isVictory(),
            true
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 7. No confunde bloqueo con victoria
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([
                "object-1"
            ]);

        const rules =
            new VictoryRules(levelState);

        /*
         * Aunque no hubiera movimientos posibles,
         * sigue existiendo un Object.
         */
        assert.equal(
            rules.isVictory(),
            false
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 8. También cuentan Objects registrados que todavía
    //    no estén colocados en un Slot
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        levelState.addObject(
            new ObjectModel({
                id: "unplaced-object",
                type: "apple",
                color: "blue"
            })
        );

        const rules =
            new VictoryRules(levelState);

        assert.equal(
            rules.isVictory(),
            false
        );

        assert.equal(
            rules.validate().totalObjects,
            1
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 9. VictoryRules no modifica el registro de Objects
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([
                "object-1",
                "object-2"
            ]);

        const objectsBefore =
            [...levelState.objects];

        const rules =
            new VictoryRules(levelState);

        rules.validate();

        assert.deepEqual(
            levelState.objects,
            objectsBefore
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 10. Solo totalObjects = 0 produce victoria
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        const rules =
            new VictoryRules(levelState);

        assert.equal(
            rules.validate().totalObjects,
            0
        );

        assert.equal(
            rules.validate().valid,
            true
        );

        /*
         * Añadimos posteriormente un Object.
         * La misma regla debe pasar inmediatamente
         * a indicar que ya no hay victoria.
         */
        levelState.addObject(
            new ObjectModel({
                id: "object-after-check",
                type: "apple",
                color: "green"
            })
        );

        assert.equal(
            rules.validate().valid,
            false
        );

        passed++;
    }


    console.log(
        `VictoryRules integration: ${passed}/10 OK`
    );
}


run();