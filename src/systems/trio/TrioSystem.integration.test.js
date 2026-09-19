import assert from "node:assert/strict";
import test from "node:test";

import Board from "../../model/Board.js";
import Layer from "../../model/Layer.js";
import ObjectModel from "../../model/Object.js";
import Shelf from "../../model/Shelf.js";
import Slot from "../../model/Slot.js";
import Structure from "../../model/Structure.js";

import DynamicState from "../../state/DynamicState.js";
import LevelState from "../../state/LevelState.js";
import StateQueries from "../../state/StateQueries.js";

import TrioSystem from "../../systems/trio/TrioSystem.js";

/**

* Helpers
  */

/**

* Crea una LevelState respetando la arquitectura real:
*
* Board
* -> Structure
*
   -> Shelf
  
* 
      -> Layer
  
* 
         -> Slot
  
*
* Los Objects se registran directamente en LevelState.
  */
  function createLevelState({
  structures = [],
  objects = [],
  dynamicState = new DynamicState()
  } = {}) {
  const board = new Board(structures);

  return new LevelState({
  board,
  objects,
  dynamicState
  });
  }

/**

* Crea una Layer NORMAL con tres Slots.
  */
  function createNormalLayer({
  layerId,
  objectIds = [null, null, null]
  }) {
  return new Layer({
  id: layerId,
  slots: [
  new Slot({
  id: `${layerId}-slot-1`,
  index: 0,
  objectId: objectIds[0]
  }),
  new Slot({
  id: `${layerId}-slot-2`,
  index: 1,
  objectId: objectIds[1]
  }),
  new Slot({
  id: `${layerId}-slot-3`,
  index: 2,
  objectId: objectIds[2]
  })
  ]
  });
  }

/**

* Crea un nivel mínimo con una Shelf NORMAL,
* una Layer TOP y tres Objects.
  */
  function createTrioLevel({
  blocked = false,
  type = "fruit",
  color = "red"
  } = {}) {
  const object1 = new ObjectModel({
  id: "object-1",
  type,
  color,
  blocked
  });

  const object2 = new ObjectModel({
  id: "object-2",
  type,
  color,
  blocked
  });

  const object3 = new ObjectModel({
  id: "object-3",
  type,
  color,
  blocked
  });

  const layer = createNormalLayer({
  layerId: "layer-1",
  objectIds: [
  object1.id,
  object2.id,
  object3.id
  ]
  });

  const shelf = new Shelf({
  id: "shelf-1",
  type: Shelf.TYPE.NORMAL,
  behavior: Shelf.BEHAVIOR.STANDARD,
  layers: [
  layer
  ]
  });

  const structure = new Structure({
  id: "structure-1",
  orientation: Structure.ORIENTATION.HORIZONTAL,
  shelves: [
  shelf
  ]
  });

  const dynamicState = new DynamicState();

  dynamicState.setLayerState(
  layer.id,
  "TOP"
  );

  const levelState = createLevelState({
  structures: [
  structure
  ],
  objects: [
  object1,
  object2,
  object3
  ],
  dynamicState
  });

  return {
  levelState,
  structure,
  shelf,
  layer,
  slots: [
  layer.getSlotById("layer-1-slot-1"),
  layer.getSlotById("layer-1-slot-2"),
  layer.getSlotById("layer-1-slot-3")
  ],
  objects: [
  object1,
  object2,
  object3
  ]
  };
  }

/**

* 1. Resuelve un trío válido.
     */
     test("TrioSystem: resuelve un trío válido", () => {
     const {
     levelState,
     slots,
     objects
     } = createTrioLevel();

  const system = new TrioSystem(levelState);

  const result = system.execute({
  destinationSlotId: "layer-1-slot-1"
  });

  assert.equal(result.valid, true);
  assert.equal(result.executed, true);

  assert.equal(
  result.reason,
  TrioSystem.REASON.TRIO_EXECUTED
  );

  assert.deepEqual(
  result.objectIds,
  [
  "object-1",
  "object-2",
  "object-3"
  ]
  );

  for (const slot of slots) {
  assert.equal(
  slot.objectId,
  null
  );
  }

  for (const object of objects) {
  assert.equal(
  levelState.getObjectById(object.id),
  null
  );
  }
  });

/**

* 2. No resuelve cuando no existe un trío.
*
* Se utiliza una segunda Layer NORMAL con tres Objects
* que no coinciden entre sí.
  */
  test("TrioSystem: rechaza cuando no existe un trío", () => {
  const {
  levelState
  } = createTrioLevel();

  const object4 = new ObjectModel({
  id: "object-4",
  type: "different",
  color: "blue"
  });

  const object5 = new ObjectModel({
  id: "object-5",
  type: "different",
  color: "blue"
  });

  const object6 = new ObjectModel({
  id: "object-6",
  type: "another",
  color: "green"
  });

  const layer2 = createNormalLayer({
  layerId: "layer-2",
  objectIds: [
  object4.id,
  object5.id,
  object6.id
  ]
  });

  const shelf = levelState.board
  .getStructureById("structure-1")
  .getShelfById("shelf-1");

  shelf.addLayer(layer2);

  levelState.addObject(object4);
  levelState.addObject(object5);
  levelState.addObject(object6);

  levelState.dynamic.setLayerState(
  layer2.id,
  "TOP"
  );

  const system = new TrioSystem(levelState);

  const result = system.execute({
  destinationSlotId: "layer-2-slot-1"
  });

  assert.equal(result.valid, false);
  assert.equal(result.executed, false);

  assert.equal(
  result.reason,
  TrioSystem.REASON.TRIO_REJECTED
  );

  assert.notEqual(
  levelState.getObjectById("object-4"),
  null
  );

  assert.notEqual(
  levelState.getObjectById("object-5"),
  null
  );

  assert.notEqual(
  levelState.getObjectById("object-6"),
  null
  );

  assert.equal(
  layer2.getSlotById("layer-2-slot-1").objectId,
  "object-4"
  );
  });

/**

* 3. La resolución se limita a exactamente tres Objects.
*
* Una Layer NORMAL solamente puede contener tres Slots.
* Por tanto, un cuarto Object coincidente en otra Layer
* no debe participar en el trío.
  */
  test("TrioSystem: mantiene la resolución limitada a tres Objects", () => {
  const {
  levelState,
  slots
  } = createTrioLevel();

  const object4 = new ObjectModel({
  id: "object-4",
  type: "fruit",
  color: "red"
  });

  const layer2 = createNormalLayer({
  layerId: "layer-2",
  objectIds: [
  object4.id,
  null,
  null
  ]
  });

  const shelf = levelState.board
  .getStructureById("structure-1")
  .getShelfById("shelf-1");

  shelf.addLayer(layer2);

  levelState.addObject(object4);

  levelState.dynamic.setLayerState(
  layer2.id,
  "TOP"
  );

  const system = new TrioSystem(levelState);

  const result = system.execute({
  destinationSlotId: "layer-1-slot-1"
  });

  assert.equal(result.valid, true);
  assert.equal(result.executed, true);

  assert.equal(
  result.objectIds.length,
  3
  );

  assert.deepEqual(
  result.objectIds,
  [
  "object-1",
  "object-2",
  "object-3"
  ]
  );

  assert.equal(
  levelState.getObjectById("object-4"),
  object4
  );

  assert.equal(
  layer2.getSlotById("layer-2-slot-1").objectId,
  "object-4"
  );

  for (const slot of slots) {
  assert.equal(
  slot.objectId,
  null
  );
  }
  });

/**

* 4. El trío se resuelve independientemente de que
* los Objects estén bloqueados.
  */
  test("TrioSystem: resuelve también un trío bloqueado", () => {
  const {
  levelState,
  slots,
  objects
  } = createTrioLevel({
  blocked: true
  });


const system = new TrioSystem(levelState);



const result = system.execute({
    destinationSlotId: "layer-1-slot-1"
});

assert.equal(result.valid, true);
assert.equal(result.executed, true);

for (const slot of slots) {
    assert.equal(
        slot.objectId,
        null
    );
}

for (const object of objects) {
    assert.equal(
        levelState.getObjectById(object.id),
        null
    );
}


});

/**

* 5. Mantiene la identidad de los Slots.
  */
  test("TrioSystem: no elimina ni sustituye los Slots", () => {
  const {
  levelState,
  layer,
  slots
  } = createTrioLevel();

  const queries = new StateQueries(levelState);

  const system = new TrioSystem(levelState);

  system.execute({
  destinationSlotId: "layer-1-slot-1"
  });

  for (const slot of slots) {
  assert.equal(
  queries.getSlot(slot.id),
  slot
  );

  
   assert.equal(
       layer.getSlotById(slot.id),
       slot
   );
  

  }
  });

/**

* 6. Mantiene la identidad de la Layer.
  */
  test("TrioSystem: no modifica ni sustituye la Layer", () => {
  const {
  levelState,
  layer
  } = createTrioLevel();

  const queries = new StateQueries(levelState);

  const system = new TrioSystem(levelState);

  system.execute({
  destinationSlotId: "layer-1-slot-1"
  });

  assert.equal(
  queries.getLayer(layer.id),
  layer
  );
  });

/**

* 7. Mantiene la identidad de la Shelf.
  */
  test("TrioSystem: no modifica ni sustituye la Shelf", () => {
  const {
  levelState,
  shelf
  } = createTrioLevel();

  const queries = new StateQueries(levelState);

  const system = new TrioSystem(levelState);

  system.execute({
  destinationSlotId: "layer-1-slot-1"
  });

  assert.equal(
  queries.getShelf(shelf.id),
  shelf
  );
  });

/**

* 8. No realiza una resolución parcial si el estado
* necesario no es válido.
  */
  test("TrioSystem: no realiza resolución parcial ante estado inválido", () => {
  const {
  levelState,
  slots,
  objects
  } = createTrioLevel();


/*



 * Eliminamos deliberadamente el registro de uno
 * de los Objects, dejando un estado inconsistente.
 *
 * El Slot sigue apuntando al Object eliminado.
 */
levelState.removeObject("object-3");

const system = new TrioSystem(levelState);

const result = system.execute({
    destinationSlotId: "layer-1-slot-1"
});

assert.equal(result.valid, false);
assert.equal(result.executed, false);

/*
 * Los Slots deben permanecer intactos.
 */
assert.equal(
    slots[0].objectId,
    objects[0].id
);

assert.equal(
    slots[1].objectId,
    objects[1].id
);

assert.equal(
    slots[2].objectId,
    objects[2].id
);

/*
 * Los Objects que siguen registrados tampoco
 * deben haber sido eliminados.
 */
assert.equal(
    levelState.getObjectById("object-1"),
    objects[0]
);

assert.equal(
    levelState.getObjectById("object-2"),
    objects[1]
);

assert.equal(
    levelState.getObjectById("object-3"),
    null
);


});

/**

* 9. resolve() utiliza el mismo contrato que execute().
  */
  test("TrioSystem: resolve() utiliza destinationSlotId", () => {
  const {
  levelState
  } = createTrioLevel();

  const system = new TrioSystem(levelState);

  const result = system.resolve({
  destinationSlotId: "layer-1-slot-1"
  });

  assert.equal(result.valid, true);
  assert.equal(result.executed, true);

  assert.deepEqual(
  result.objectIds,
  [
  "object-1",
  "object-2",
  "object-3"
  ]
  );
  });

/**

* 10. advance() utiliza el mismo contrato que execute().
  */
  test("TrioSystem: advance() utiliza destinationSlotId", () => {
  const {
  levelState
  } = createTrioLevel();

  const system = new TrioSystem(levelState);

  const result = system.advance({
  destinationSlotId: "layer-1-slot-1"
  });

  assert.equal(result.valid, true);
  assert.equal(result.executed, true);

  assert.deepEqual(
  result.objectIds,
  [
  "object-1",
  "object-2",
  "object-3"
  ]
  );
  });