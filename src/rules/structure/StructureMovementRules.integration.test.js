import assert from "node:assert/strict";

import Board from "../../model/Board.js";
import Structure from "../../model/Structure.js";
import LevelState from "../../state/LevelState.js";

import StructureMovementRules from "./StructureMovementRules.js";

function createLevel({
structureId = "structure-1",
position = { x: 10, y: 20, z: 30 },
movement = {
enabled: true,
direction: { x: 1, y: 0, z: 0 },
speed: 2
}
} = {}) {
const structure = new Structure({
id: structureId,
orientation: Structure.ORIENTATION.HORIZONTAL,
position,
movement
});


const board = new Board([structure]);

const levelState = new LevelState({
    board
});

return {
    levelState,
    board,
    structure
};


}

// -------------------------------------------------------------
// 1. Structure válida
// -------------------------------------------------------------

{
const { levelState } = createLevel();


const rules = new StructureMovementRules(levelState);
const result = rules.validate("structure-1");

assert.equal(result.valid, true);

assert.equal(
    result.reason,
    StructureMovementRules.REASON.VALID_MOVEMENT
);

assert.equal(
    result.structureId,
    "structure-1"
);

assert.deepEqual(
    result.position,
    {
        x: 10,
        y: 20,
        z: 30
    }
);

assert.deepEqual(
    result.direction,
    {
        x: 1,
        y: 0,
        z: 0
    }
);

assert.equal(
    result.speed,
    2
);


}

// -------------------------------------------------------------
// 2. Structure inexistente
// -------------------------------------------------------------

{
const { levelState } = createLevel();


const rules =
    new StructureMovementRules(levelState);

const result =
    rules.validate("does-not-exist");

assert.equal(
    result.valid,
    false
);

assert.equal(
    result.reason,
    StructureMovementRules.REASON
        .STRUCTURE_NOT_FOUND
);

assert.equal(
    result.structureId,
    "does-not-exist"
);


}

// -------------------------------------------------------------
// 3. Movimiento deshabilitado
// -------------------------------------------------------------

{
const { levelState } =
createLevel({
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


const rules =
    new StructureMovementRules(levelState);

const result =
    rules.validate("structure-1");

assert.equal(
    result.valid,
    false
);

assert.equal(
    result.reason,
    StructureMovementRules.REASON
        .MOVEMENT_NOT_ENABLED
);


}

// -------------------------------------------------------------
// 4. Posición inválida
// -------------------------------------------------------------

{
const { levelState } =
createLevel({
position: {
x: NaN,
y: 20,
z: 30
}
});


const rules =
    new StructureMovementRules(levelState);

const result =
    rules.validate("structure-1");

assert.equal(
    result.valid,
    false
);

assert.equal(
    result.reason,
    StructureMovementRules.REASON
        .INVALID_POSITION
);


}

// -------------------------------------------------------------
// 5. Dirección inválida
// -------------------------------------------------------------

{
const { levelState } =
createLevel({
movement: {
enabled: true,
direction: null,
speed: 2
}
});


const rules =
    new StructureMovementRules(levelState);

const result =
    rules.validate("structure-1");

assert.equal(
    result.valid,
    false
);

assert.equal(
    result.reason,
    StructureMovementRules.REASON
        .INVALID_DIRECTION
);


}

// -------------------------------------------------------------
// 6. Velocidad inválida
// -------------------------------------------------------------

{
const { levelState } =
createLevel({
movement: {
enabled: true,
direction: {
x: 1,
y: 0,
z: 0
},
speed: 0
}
});


const rules =
    new StructureMovementRules(levelState);

const result =
    rules.validate("structure-1");

assert.equal(
    result.valid,
    false
);

assert.equal(
    result.reason,
    StructureMovementRules.REASON
        .INVALID_SPEED
);


}

// -------------------------------------------------------------
// 7. canMove() coincide con validate().valid
// -------------------------------------------------------------

{
const { levelState } = createLevel();


const rules =
    new StructureMovementRules(levelState);

assert.equal(
    rules.canMove("structure-1"),
    true
);

assert.equal(
    rules.canMove("does-not-exist"),
    false
);


}

// -------------------------------------------------------------
// 8. validate() no muta la Structure
// -------------------------------------------------------------

{
const {
levelState,
structure
} = createLevel();


const positionBefore =
    { ...structure.position };

const movementBefore =
    { ...structure.movement };

const rules =
    new StructureMovementRules(levelState);

rules.validate("structure-1");

assert.deepEqual(
    structure.position,
    positionBefore
);

assert.deepEqual(
    structure.movement,
    movementBefore
);


}

// -------------------------------------------------------------
// 9. El resultado devuelve una copia de position
// -------------------------------------------------------------

{
const {
levelState,
structure
} = createLevel();


const rules =
    new StructureMovementRules(levelState);

const result =
    rules.validate("structure-1");

assert.notEqual(
    result.position,
    structure.position
);

result.position.x = 999;

assert.equal(
    structure.position.x,
    10
);


}

// -------------------------------------------------------------
// 10. Identidad de Structure preservada y direcciones válidas
// -------------------------------------------------------------

{
const {
levelState,
structure
} = createLevel({
movement: {
enabled: true,
direction: "RIGHT",
speed: 3
}
});


const rules =
    new StructureMovementRules(levelState);

const result =
    rules.validate("structure-1");

assert.equal(
    result.valid,
    true
);

assert.equal(
    result.direction,
    "RIGHT"
);

assert.equal(
    result.speed,
    3
);

assert.equal(
    levelState.board.getStructureById(
        "structure-1"
    ),
    structure
);


}

console.log(
"StructureMovementRules integration: 10/10 OK"
);
