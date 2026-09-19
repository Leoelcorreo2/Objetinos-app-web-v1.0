import assert from "node:assert/strict";

import Board from "../../model/Board.js";
import Structure from "../../model/Structure.js";
import Shelf from "../../model/Shelf.js";
import Layer from "../../model/Layer.js";
import Slot from "../../model/Slot.js";
import LevelState from "../../state/LevelState.js";

import StructureMovementSystem
from "./StructureMovementSystem.js";

function createStructure({
id = "structure-1",
position = {
x: 10,
y: 20,
z: 30
},
movement = {
enabled: true,
direction: {
x: 1,
y: 0,
z: 0
},
speed: 2
}
} = {}) {


const structure =
    new Structure({
        id,
        orientation:
            Structure.ORIENTATION.HORIZONTAL,
        position,
        movement
    });


const shelf =
    new Shelf({
        id: `${id}-shelf`,
        type: Shelf.TYPE.NORMAL,
        behavior: Shelf.BEHAVIOR.STANDARD
    });


const layer =
    new Layer({
        id: `${id}-layer`
    });


const slot =
    new Slot({
        id: `${id}-slot-0`,
        index: 0,
        objectId: null
    });

const slot1 =
    new Slot({
        id: `${id}-slot-1`,
        index: 1,
        objectId: null
    });

const slot2 =
    new Slot({
        id: `${id}-slot-2`,
        index: 2,
        objectId: null
    });

layer.addSlot(slot);
layer.addSlot(slot1);
layer.addSlot(slot2);

shelf.addLayer(layer);
structure.addShelf(shelf);


return {
    structure,
    shelf,
    layer,
    slot
};


}

function createLevel(options = {}) {


const {
    structure,
    shelf,
    layer,
    slot
} = createStructure(options);


const board =
    new Board([
        structure
    ]);


const levelState =
    new LevelState({
        board
    });


return {
    levelState,
    board,
    structure,
    shelf,
    layer,
    slot
};


}

// -------------------------------------------------------------
// 1. Movimiento válido
//
// x = 10
// direction.x = 1
// speed = 2
// deltaTime = 0.5
//
// desplazamiento = 1
// x final = 11
// -------------------------------------------------------------

{
const {
levelState,
structure
} = createLevel();


const system =
    new StructureMovementSystem(
        levelState
    );


const result =
    system.execute({
        structureId: "structure-1",
        deltaTime: 0.5
    });


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
    StructureMovementSystem.REASON
        .MOVEMENT_EXECUTED
);

assert.deepEqual(
    result.previousPosition,
    {
        x: 10,
        y: 20,
        z: 30
    }
);

assert.deepEqual(
    result.nextPosition,
    {
        x: 11,
        y: 20,
        z: 30
    }
);

assert.deepEqual(
    structure.position,
    {
        x: 11,
        y: 20,
        z: 30
    }
);


}

// -------------------------------------------------------------
// 2. deltaTime = 0
//
// El movimiento es válido pero la posición no cambia.
// -------------------------------------------------------------

{
const {
levelState,
structure
} = createLevel();


const system =
    new StructureMovementSystem(
        levelState
    );


const result =
    system.execute({
        structureId: "structure-1",
        deltaTime: 0
    });


assert.equal(
    result.valid,
    true
);

assert.equal(
    result.executed,
    true
);

assert.deepEqual(
    structure.position,
    {
        x: 10,
        y: 20,
        z: 30
    }
);

assert.deepEqual(
    result.displacement,
    {
        x: 0,
        y: 0,
        z: 0
    }
);


}

// -------------------------------------------------------------
// 3. Movimiento en dirección negativa
// -------------------------------------------------------------

{
const {
levelState,
structure
} = createLevel({
movement: {
enabled: true,
direction: {
x: -1,
y: 0,
z: 0
},
speed: 4
}
});


const system =
    new StructureMovementSystem(
        levelState
    );


const result =
    system.execute({
        structureId: "structure-1",
        deltaTime: 0.5
    });


assert.equal(
    result.executed,
    true
);

assert.deepEqual(
    structure.position,
    {
        x: 8,
        y: 20,
        z: 30
    }
);

assert.deepEqual(
    result.displacement,
    {
        x: -2,
        y: 0,
        z: 0
    }
);


}

// -------------------------------------------------------------
// 4. Dirección cardinal
// -------------------------------------------------------------

{
const {
levelState,
structure
} = createLevel({
movement: {
enabled: true,
direction: "UP",
speed: 3
}
});


const system =
    new StructureMovementSystem(
        levelState
    );


const result =
    system.execute({
        structureId: "structure-1",
        deltaTime: 2
    });


assert.equal(
    result.executed,
    true
);

assert.deepEqual(
    result.direction,
    {
        x: 0,
        y: 1,
        z: 0
    }
);

assert.deepEqual(
    structure.position,
    {
        x: 10,
        y: 26,
        z: 30
    }
);


}

// -------------------------------------------------------------
// 5. Structure inexistente
// -------------------------------------------------------------

{
const {
levelState
} = createLevel();


const system =
    new StructureMovementSystem(
        levelState
    );


const result =
    system.execute({
        structureId:
            "does-not-exist",
        deltaTime: 1
    });


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
    StructureMovementSystem.REASON
        .MOVEMENT_REJECTED
);

assert.equal(
    result.validation.reason,
    "STRUCTURE_NOT_FOUND"
);


}

// -------------------------------------------------------------
// 6. Movimiento deshabilitado
// -------------------------------------------------------------

{
const {
levelState,
structure
} = createLevel({
movement: {
enabled: false,
direction: {
x: 1,
y: 0,
z: 0
},
speed: 2
}
});


const positionBefore =
    { ...structure.position };


const system =
    new StructureMovementSystem(
        levelState
    );


const result =
    system.execute({
        structureId: "structure-1",
        deltaTime: 1
    });


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
    StructureMovementSystem.REASON
        .MOVEMENT_REJECTED
);

assert.deepEqual(
    structure.position,
    positionBefore
);


}

// -------------------------------------------------------------
// 7. deltaTime inválido
//
// No se debe producir ninguna mutación.
// -------------------------------------------------------------

{
const {
levelState,
structure
} = createLevel();


const positionBefore =
    { ...structure.position };


const system =
    new StructureMovementSystem(
        levelState
    );


const invalidValues = [
    -1,
    NaN,
    Infinity,
    -Infinity
];


for (const deltaTime of invalidValues) {

    const result =
        system.execute({
            structureId:
                "structure-1",
            deltaTime
        });


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
        StructureMovementSystem.REASON
            .INVALID_DELTA_TIME
    );

    assert.deepEqual(
        structure.position,
        positionBefore
    );
}


}

// -------------------------------------------------------------
// 8. El movimiento NO modifica Shelves, Layers ni Slots
// -------------------------------------------------------------

{
const {
levelState,
structure,
shelf,
layer,
slot
} = createLevel();


const shelvesBefore =
    [...structure.shelves];

const layersBefore =
    [...shelf.layers];

const slotsBefore =
    [...layer.slots];


const system =
    new StructureMovementSystem(
        levelState
    );


const result =
    system.execute({
        structureId: "structure-1",
        deltaTime: 1
    });


assert.equal(
    result.executed,
    true
);


assert.deepEqual(
    structure.shelves,
    shelvesBefore
);

assert.deepEqual(
    shelf.layers,
    layersBefore
);

assert.deepEqual(
    layer.slots,
    slotsBefore
);


assert.equal(
    structure.shelves[0],
    shelf
);

assert.equal(
    structure.shelves[0].layers[0],
    layer
);

assert.equal(
    structure.shelves[0].layers[0].slots[0],
    slot
);


}

// -------------------------------------------------------------
// 9. La identidad de Structure permanece intacta
// -------------------------------------------------------------

{
const {
levelState,
board,
structure
} = createLevel();


const system =
    new StructureMovementSystem(
        levelState
    );


system.execute({
    structureId: "structure-1",
    deltaTime: 1
});


assert.equal(
    board.getStructureById(
        "structure-1"
    ),
    structure
);


assert.equal(
    structure.id,
    "structure-1"
);


}

// -------------------------------------------------------------
// 10. previousPosition y nextPosition
//     son copias independientes
// -------------------------------------------------------------

{
const {
levelState,
structure
} = createLevel();


const system =
    new StructureMovementSystem(
        levelState
    );


const result =
    system.execute({
        structureId: "structure-1",
        deltaTime: 1
    });


assert.notEqual(
    result.previousPosition,
    structure.position
);

assert.notEqual(
    result.nextPosition,
    structure.position
);

assert.notEqual(
    result.previousPosition,
    result.nextPosition
);


result.previousPosition.x =
    999;


result.nextPosition.x =
    888;


assert.equal(
    structure.position.x,
    12
);


}

// -------------------------------------------------------------
// 11. move() es alias funcional de execute()
// -------------------------------------------------------------

{
const {
levelState,
structure
} = createLevel();


const system =
    new StructureMovementSystem(
        levelState
    );


const result =
    system.move({
        structureId: "structure-1",
        deltaTime: 0.5
    });


assert.equal(
    result.valid,
    true
);

assert.equal(
    result.executed,
    true
);

assert.deepEqual(
    structure.position,
    {
        x: 11,
        y: 20,
        z: 30
    }
);


}

// -------------------------------------------------------------
// 12. Estado completamente inalterado cuando falla
// -------------------------------------------------------------

{
const {
levelState,
structure,
shelf,
layer,
slot
} = createLevel();


const positionBefore =
    { ...structure.position };

const movementBefore =
    { ...structure.movement };

const shelvesBefore =
    [...structure.shelves];

const layersBefore =
    [...shelf.layers];

const slotsBefore =
    [...layer.slots];

const objectsBefore =
    [...levelState.objects];


const system =
    new StructureMovementSystem(
        levelState
    );


const result =
    system.execute({
        structureId: "structure-1",
        deltaTime: -1
    });


assert.equal(
    result.executed,
    false
);


assert.deepEqual(
    structure.position,
    positionBefore
);

assert.deepEqual(
    structure.movement,
    movementBefore
);

assert.deepEqual(
    structure.shelves,
    shelvesBefore
);

assert.deepEqual(
    shelf.layers,
    layersBefore
);

assert.deepEqual(
    layer.slots,
    slotsBefore
);

assert.deepEqual(
    levelState.objects,
    objectsBefore
);


assert.equal(
    structure.shelves[0],
    shelf
);

assert.equal(
    shelf.layers[0],
    layer
);

assert.equal(
    layer.slots[0],
    slot
);


}

console.log(
"StructureMovementSystem integration: 12/12 OK"
);
