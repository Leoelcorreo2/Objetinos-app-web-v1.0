import assert from "node:assert/strict";

import Board from "../../model/Board.js";
import Structure from "../../model/Structure.js";
import Shelf from "../../model/Shelf.js";
import Layer from "../../model/Layer.js";
import Slot from "../../model/Slot.js";
import ObjectModel from "../../model/Object.js";

import LevelState from "../../state/LevelState.js";
import GamePhase from "../../state/GamePhase.js";

import VictorySystem from "./VictorySystem.js";


function createLevel(
    objectIds = [],
    phase = GamePhase.READY
) {
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

    /*
     * Un Layer NORMAL debe tener sus 3 Slots.
     */
    for (let index = 0; index < 3; index++) {
        layer.addSlot(
            new Slot({
                id: `slot-${index}`,
                index,
                objectId:
                    objectIds[index] ?? null
            })
        );
    }

    shelf.addLayer(layer);
    structure.addShelf(shelf);
    board.addStructure(structure);

    const objects =
        objectIds.map(id =>
            new ObjectModel({
                id,
                type: "apple",
                color: "red"
            })
        );

    const levelState =
        new LevelState({
            board,
            objects,
            phase
        });

    return {
        levelState,
        board,
        structure,
        shelf,
        layer
    };
}


/**
 * Captura referencias relevantes para comprobar
 * que VictorySystem no modifica la estructura lógica.
 */
function snapshot(levelState) {
    return {
        phase:
            levelState.getPhase(),

        objects:
            [...levelState.objects],

        structures:
            [...levelState.board.structures],

        shelves:
            levelState.board.structures.flatMap(
                structure =>
                    [...structure.shelves]
            ),

        layers:
            levelState.board.structures.flatMap(
                structure =>
                    structure.shelves.flatMap(
                        shelf =>
                            [...shelf.layers]
                    )
            ),

        slots:
            levelState.board.structures.flatMap(
                structure =>
                    structure.shelves.flatMap(
                        shelf =>
                            shelf.layers.flatMap(
                                layer =>
                                    [...layer.slots]
                            )
                    )
            )
    };
}


function run() {

    let passed = 0;


    // ---------------------------------------------------------
    // 1. Cero Objects -> ejecuta victoria y cambia fase a WON.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        const system =
            new VictorySystem(levelState);

        const result =
            system.execute();

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
            VictorySystem.REASON.VICTORY_EXECUTED
        );

        assert.equal(
            result.totalObjects,
            0
        );

        assert.equal(
            levelState.getPhase(),
            GamePhase.WON
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 2. Objects restantes -> rechaza y no cambia fase.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel(
                ["object-1"],
                GamePhase.PLAYING
            );

        const system =
            new VictorySystem(levelState);

        const result =
            system.execute();

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.executed,
            false
        );

        assert.equal(
            result.reason,
            VictorySystem.REASON.VICTORY_REJECTED
        );

        assert.equal(
            result.validation.totalObjects,
            1
        );

        assert.equal(
            levelState.getPhase(),
            GamePhase.PLAYING
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 3. La victoria puede producirse independientemente
    //    de la fase actual.
    // ---------------------------------------------------------

    {
        const phases = [
            GamePhase.READY,
            GamePhase.PLAYING,
            GamePhase.LOST
        ];

        for (const phase of phases) {

            const { levelState } =
                createLevel(
                    [],
                    phase
                );

            const system =
                new VictorySystem(levelState);

            const result =
                system.execute();

            assert.equal(
                result.valid,
                true
            );

            assert.equal(
                levelState.getPhase(),
                GamePhase.WON
            );
        }

        passed++;
    }


    // ---------------------------------------------------------
    // 4. Los Objects no se eliminan ni modifican.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([
                "object-1",
                "object-2"
            ]);

        const objectsBefore =
            [...levelState.objects];

        const system =
            new VictorySystem(levelState);

        system.execute();

        assert.deepEqual(
            levelState.objects,
            objectsBefore
        );

        assert.equal(
            levelState.getObjectCount(),
            2
        );

        assert.equal(
            levelState.getPhase(),
            GamePhase.READY
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 5. VictorySystem no modifica Board/Shelf/Layer/Slot.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        const before =
            snapshot(levelState);

        const system =
            new VictorySystem(levelState);

        system.execute();

        const after =
            snapshot(levelState);

        assert.equal(
            after.structures[0],
            before.structures[0]
        );

        assert.equal(
            after.shelves[0],
            before.shelves[0]
        );

        assert.equal(
            after.layers[0],
            before.layers[0]
        );

        assert.deepEqual(
            after.slots,
            before.slots
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 6. La identidad de LevelState permanece intacta.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        const stateReference =
            levelState;

        const system =
            new VictorySystem(levelState);

        system.execute();

        assert.equal(
            system.levelState,
            stateReference
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 7. Comprobar victoria dos veces sigue siendo válido.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        const system =
            new VictorySystem(levelState);

        const first =
            system.execute();

        const second =
            system.execute();

        assert.equal(
            first.valid,
            true
        );

        assert.equal(
            second.valid,
            true
        );

        assert.equal(
            second.executed,
            true
        );

        assert.equal(
            levelState.getPhase(),
            GamePhase.WON
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 8. El alias check() ejecuta la misma consecuencia.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        const system =
            new VictorySystem(levelState);

        const result =
            system.check();

        assert.equal(
            result.valid,
            true
        );

        assert.equal(
            levelState.getPhase(),
            GamePhase.WON
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 9. El alias win() ejecuta la misma consecuencia.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        const system =
            new VictorySystem(levelState);

        const result =
            system.win();

        assert.equal(
            result.valid,
            true
        );

        assert.equal(
            levelState.getPhase(),
            GamePhase.WON
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 10. Una victoria rechazada mantiene intacta la fase.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel(
                ["object-1"],
                GamePhase.LOST
            );

        const system =
            new VictorySystem(levelState);

        const before =
            snapshot(levelState);

        const result =
            system.execute();

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.executed,
            false
        );

        assert.equal(
            levelState.getPhase(),
            GamePhase.LOST
        );

        assert.deepEqual(
            levelState.objects,
            before.objects
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 11. VictorySystem delega la decisión a VictoryRules.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        const system =
            new VictorySystem(levelState);

        let calls = 0;

        const originalValidate =
            system.rules.validate.bind(
                system.rules
            );

        system.rules.validate =
            () => {
                calls++;

                return originalValidate();
            };

        system.execute();

        assert.equal(
            calls,
            1
        );

        assert.equal(
            levelState.getPhase(),
            GamePhase.WON
        );

        passed++;
    }


    // ---------------------------------------------------------
    // 12. El resultado informa correctamente de la fase.
    // ---------------------------------------------------------

    {
        const { levelState } =
            createLevel([]);

        const system =
            new VictorySystem(levelState);

        const result =
            system.execute();

        assert.equal(
            result.phase,
            GamePhase.WON
        );

        assert.equal(
            result.previousPhase,
            GamePhase.READY
        );

        passed++;
    }


    console.log(
        `VictorySystem integration: ${passed}/12 OK`
    );
}


run();