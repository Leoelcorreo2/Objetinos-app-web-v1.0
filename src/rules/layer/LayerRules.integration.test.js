import test from "node:test";
import assert from "node:assert/strict";

import Board from "../../model/Board.js";
import ObjectModel from "../../model/Object.js";
import Shelf from "../../model/Shelf.js";
import Slot from "../../model/Slot.js";
import Structure from "../../model/Structure.js"
import Layer from "../../model/Layer.js";

import DynamicState from "../../state/DynamicState.js";
import LevelState from "../../state/LevelState.js";

import LayerRules
    from "../../rules/layer/LayerRules.js";


function createLayer(
    id,
    objectId = null
) {
    return new Layer({
        id,
        slots: [
            new Slot({
                id: `${id}-0`,
                index: 0,
                objectId
            }),
            new Slot({
                id: `${id}-1`,
                index: 1,
                objectId: null
            }),
            new Slot({
                id: `${id}-2`,
                index: 2,
                objectId: null
            })
        ]
    });
}


function createLevel({
    layerCount = 4,
    topEmpty = true
} = {}) {

    const layers = [];
    const dynamicState =
        new DynamicState();

    for (
        let index = 0;
        index < layerCount;
        index += 1
    ) {

        const objectId =
            index === 0 && !topEmpty
                ? "top-object"
                : null;

        const layer =
            createLayer(
                `layer-${index}`,
                objectId
            );

        layers.push(layer);

        let state;

        if (index === 0) {
            state = "TOP";
        } else if (index === 1) {
            state = "SHADED";
        } else {
            state = "INVISIBLE";
        }

        dynamicState.setLayerState(
            layer.id,
            state
        );
    }

    const shelf =
        new Shelf({
            id: "shelf-1",
            type: Shelf.TYPE.NORMAL,
            behavior: Shelf.BEHAVIOR.STANDARD,
            layers
        });

    const structure =
        new Structure({
            id: "structure-1",
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

    return new LevelState({
        board,
        objects: [],
        dynamicState
    });
}


/* ============================================================
 * TOP
 * ============================================================
 */

test(
    "LayerRules: identifica correctamente la TOP",
    () => {

        const levelState =
            createLevel();

        const rules =
            new LayerRules(levelState);

        assert.equal(
            rules.getTopLayer("shelf-1").id,
            "layer-0"
        );
    }
);


/* ============================================================
 * EXPOSICIÓN
 * ============================================================
 */

test(
    "LayerRules: identifica TOP, SHADED e INVISIBLE",
    () => {

        const levelState =
            createLevel();

        const rules =
            new LayerRules(levelState);

        assert.deepEqual(
            rules.getExposure("shelf-1"),
            [
                {
                    layerId: "layer-0",
                    state: "TOP"
                },
                {
                    layerId: "layer-1",
                    state: "SHADED"
                },
                {
                    layerId: "layer-2",
                    state: "INVISIBLE"
                },
                {
                    layerId: "layer-3",
                    state: "INVISIBLE"
                }
            ]
        );
    }
);


/* ============================================================
 * TOP OCUPADA
 * ============================================================
 */

test(
    "LayerRules: no permite avanzar si la TOP no está vacía",
    () => {

        const levelState =
            createLevel({
                topEmpty: false
            });

        const rules =
            new LayerRules(levelState);

        const result =
            rules.validateAdvance(
                "shelf-1"
            );

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            LayerRules.REASON.TOP_NOT_EMPTY
        );
    }
);


/* ============================================================
 * AVANCE
 * ============================================================
 */

test(
    "LayerRules: permite avanzar cuando TOP está vacía y existen capas posteriores",
    () => {

        const levelState =
            createLevel();

        const rules =
            new LayerRules(levelState);

        const result =
            rules.validateAdvance(
                "shelf-1"
            );

        assert.equal(
            result.valid,
            true
        );

        assert.equal(
            result.reason,
            LayerRules.REASON.VALID_ADVANCE
        );
    }
);


/* ============================================================
 * TRANSICIÓN
 * ============================================================
 */

test(
    "LayerRules: calcula TOP → INVISIBLE, SHADED → TOP e INVISIBLE → SHADED",
    () => {

        const levelState =
            createLevel();

        const rules =
            new LayerRules(levelState);

        const result =
            rules.validateAdvance(
                "shelf-1"
            );

        assert.deepEqual(
            result.nextExposure,
            [
                {
                    layerId: "layer-0",
                    state: "INVISIBLE"
                },
                {
                    layerId: "layer-1",
                    state: "TOP"
                },
                {
                    layerId: "layer-2",
                    state: "SHADED"
                },
                {
                    layerId: "layer-3",
                    state: "INVISIBLE"
                }
            ]
        );
    }
);


/* ============================================================
 * NÚMERO VARIABLE DE LAYERS
 * ============================================================
 */

test(
    "LayerRules: funciona con un número arbitrario de Layers",
    () => {

        const levelState =
            createLevel({
                layerCount: 6
            });

        const rules =
            new LayerRules(levelState);

        const result =
            rules.validateAdvance(
                "shelf-1"
            );

        assert.equal(
            result.valid,
            true
        );

        assert.deepEqual(
            result.nextExposure.map(
                item => item.state
            ),
            [
                "INVISIBLE",
                "TOP",
                "SHADED",
                "INVISIBLE",
                "INVISIBLE",
                "INVISIBLE"
            ]
        );
    }
);


/* ============================================================
 * ÚLTIMA LAYER
 * ============================================================
 */

test(
    "LayerRules: una única Layer TOP vacía no avanza",
    () => {

        const levelState =
            createLevel({
                layerCount: 1
            });

        const rules =
            new LayerRules(levelState);

        const result =
            rules.validateAdvance(
                "shelf-1"
            );

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            LayerRules.REASON.LAST_LAYER
        );
    }
);


/* ============================================================
 * SEPARACIÓN DE RESPONSABILIDADES
 * ============================================================
 */

test(
    "LayerRules: una última TOP vacía no se interpreta como colapso",
    () => {

        const levelState =
            createLevel({
                layerCount: 1
            });

        const rules =
            new LayerRules(levelState);

        assert.equal(
            rules.isTopEmpty("shelf-1"),
            true
        );

        assert.equal(
            rules.canAdvance("shelf-1"),
            false
        );

        /*
         * El comportamiento de colapso se decidirá
         * en CollapseRules.
         */
        assert.equal(
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .behavior,
            Shelf.BEHAVIOR.STANDARD
        );
    }
);


/* ============================================================
 * SHELF INEXISTENTE
 * ============================================================
 */

test(
    "LayerRules: una Shelf inexistente produce resultado inválido",
    () => {

        const levelState =
            createLevel();

        const rules =
            new LayerRules(levelState);

        const result =
            rules.validateAdvance(
                "does-not-exist"
            );

        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.reason,
            LayerRules.REASON.SHELF_NOT_FOUND
        );
    }
);


/* ============================================================
 * PUREZA
 * ============================================================
 */

test(
    "LayerRules: no modifica DynamicState ni las Layers",
    () => {

        const levelState =
            createLevel();

        const rules =
            new LayerRules(levelState);

        const beforeExposure =
            rules.getExposure("shelf-1");

        const beforeLayerIds =
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .layers
                .map(layer => layer.id);

        rules.validateAdvance(
            "shelf-1"
        );

        assert.deepEqual(
            rules.getExposure("shelf-1"),
            beforeExposure
        );

        assert.deepEqual(
            levelState.board
                .getStructureById("structure-1")
                .getShelfById("shelf-1")
                .layers
                .map(layer => layer.id),
            beforeLayerIds
        );
    }
);