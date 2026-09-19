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

import BlockDetectionSystem
from "./BlockDetectionSystem.js";

/**

* Crea un Layer NORMAL con exactamente 3 Slots.
*
* objectIds debe contener hasta 3 posiciones.
* Las posiciones ausentes se completan con null.
  */
  function createNormalLayer(
  id,
  objectIds = []
  ) {

  const ids = [
  objectIds[0] ?? null,
  objectIds[1] ?? null,
  objectIds[2] ?? null
  ];

  const slots = ids.map(
  (objectId, index) =>
  new Slot({
  id:
  `${id}-slot-${index}`,

  
           index,

           objectId
       })
  

  );

  return new Layer({
  id,
  slots
  });
  }

/**

* Crea una Shelf NORMAL.
*
* Cada Layer debe contener exactamente 3 Slots.
  */
  function createNormalShelf(
  id,
  layers
  ) {

  return new Shelf({
  id,

  
   type:
       Shelf.TYPE.NORMAL,

   behavior:
       Shelf.BEHAVIOR.STANDARD,

   layers
  

  });
  }

/**

* Crea un Object de prueba.
  */
  function createObject(
  id,
  index = 0
  ) {

  return new ObjectModel({
  id,

  
   type:
       "TYPE",

   color:
       String(index),

   blocked:
       false
  

  });
  }

/**

* Crea un LevelState sencillo para las pruebas.
*
* La estructura principal contiene una Shelf NORMAL con
* un Layer TOP.
*
* additionalShelves permite crear destinos TOP adicionales.
  */
  function createLevel({
  topObjectIds = [
  null,
  null,
  null
  ],

  topState = "TOP",

  additionalShelves = []
  }) {

  const topLayer =
  createNormalLayer(
  "top",
  topObjectIds
  );

  const mainShelf =
  createNormalShelf(
  "shelf",
  [
  topLayer
  ]
  );

  const structure =
  new Structure({
  id:
  "structure",

  
       orientation:
           Structure.ORIENTATION.HORIZONTAL,

       shelves: [
           mainShelf,
           ...additionalShelves
       ]
   });
  

  const board =
  new Board([
  structure
  ]);

  /*

  * Registramos únicamente los Objects que realmente
  * aparecen en los Slots del Board.
    */
    const objectIds =
    topObjectIds.filter(
    objectId =>
    objectId !== null
    );

  const objects =
  objectIds.map(
  (id, index) =>
  createObject(
  id,
  index
  )
  );

  /*

  * También registramos Objects que puedan estar en
  * Shelves adicionales.
    */
    for (
    const shelf
    of additionalShelves
    ) {

    for (
    const layer
    of shelf.layers
    ) {

    
     for (
         const slot
         of layer.slots
     ) {

         if (
             slot.objectId !== null &&
             slot.objectId !== undefined &&
             !objects.some(
                 object =>
                     object.id ===
                     slot.objectId
             )
         ) {

             objects.push(
                 createObject(
                     slot.objectId,
                     objects.length
                 )
             );
         }
     }
    

    }
    }

  const dynamicState =
  new DynamicState();

  dynamicState.setLayerState(
  "top",
  topState
  );

  /*

  * Las capas de las Shelves adicionales se consideran
  * TOP salvo que el propio escenario indique otro estado.
    */
    for (
    const shelf
    of additionalShelves
    ) {

    for (
    const layer
    of shelf.layers
    ) {

    
     if (
         !dynamicState.layerStates.has(
             layer.id
         )
     ) {

         dynamicState.setLayerState(
             layer.id,
             "TOP"
         );
     }
    

    }
    }

  const levelState =
  new LevelState({
  board,

  
       objects,

       dynamicState
   });
  

  return {
  levelState,
  board,
  structure,
  shelf: mainShelf,
  topLayer
  };
  }

/**

* Captura referencias del modelo para comprobar que
* BlockDetectionSystem no realiza mutaciones.
  */
  function snapshot(
  levelState
  ) {

  const structures =
  [...levelState.board.structures];

  const shelves =
  structures.flatMap(
  structure =>
  [...structure.shelves]
  );

  const layers =
  shelves.flatMap(
  shelf =>
  [...shelf.layers]
  );

  const slots =
  layers.flatMap(
  layer =>
  [...layer.slots]
  );

  return {
  board:
  levelState.board,

  
   structures,

   shelves,

   layers,

   slots,

   objects:
       [...levelState.objects],

   phase:
       levelState.getPhase()
  

  };
  }

/* ============================================================

* 1. NO BLOQUEADO
* ============================================================
  */

test(
"BlockDetectionSystem: detecta que existe movimiento válido",
() => {


    /*
     * A está en TOP.
     *
     * Los otros dos Slots del Layer están vacíos.
     *
     * El propio Layer proporciona un Slot TOP vacío,
     * pero el Slot de origen de A no puede ser su propio
     * destino.
     *
     * Por tanto, existe movimiento válido.
     */
    const {
        levelState
    } =
        createLevel({
            topObjectIds: [
                "object-a",
                null,
                null
            ]
        });


    const system =
        new BlockDetectionSystem(
            levelState
        );


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
        result.blocked,
        false
    );

    assert.equal(
        result.reason,
        BlockDetectionSystem.REASON.NO_BLOCK
    );

    assert.ok(
        result.validMove
    );

    assert.equal(
        result.remainingObjects,
        1
    );
}


);

/* ============================================================

* 2. BLOQUEO
* ============================================================
  */

test(
"BlockDetectionSystem: detecta bloqueo real",
() => {


    /*
     * Todos los Slots TOP están ocupados.
     *
     * Además, todos los Objects están bloqueados.
     *
     * No existe Object movible ni destino vacío.
     */
    const {
        levelState
    } =
        createLevel({
            topObjectIds: [
                "object-a",
                "object-b",
                "object-c"
            ]
        });


    levelState
        .getObjectById(
            "object-a"
        )
        .blocked = true;


    levelState
        .getObjectById(
            "object-b"
        )
        .blocked = true;


    levelState
        .getObjectById(
            "object-c"
        )
        .blocked = true;


    const system =
        new BlockDetectionSystem(
            levelState
        );


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
        result.blocked,
        true
    );

    assert.equal(
        result.reason,
        BlockDetectionSystem.REASON.BLOCK_DETECTED
    );

    assert.equal(
        result.validMove,
        null
    );

    assert.equal(
        result.remainingObjects,
        3
    );
}


);

/* ============================================================

* 3. VICTORIA TIENE PRIORIDAD
* ============================================================
  */

test(
"BlockDetectionSystem: cero Objects produce estado VICTORY y no BLOCKED",
() => {


    /*
     * Un Layer NORMAL sigue necesitando sus 3 Slots.
     *
     * Los tres están vacíos, por lo que el número de Objects
     * registrados es cero.
     */
    const {
        levelState
    } =
        createLevel({
            topObjectIds: [
                null,
                null,
                null
            ]
        });


    const system =
        new BlockDetectionSystem(
            levelState
        );


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
        result.blocked,
        false
    );

    assert.equal(
        result.reason,
        BlockDetectionSystem.REASON.VICTORY
    );

    assert.equal(
        result.remainingObjects,
        0
    );

    assert.equal(
        result.validMove,
        null
    );
}


);

/* ============================================================

* 4. SHADED
* ============================================================
  */

test(
"BlockDetectionSystem: Objects en SHADED no permiten movimiento normal",
() => {


    /*
     * El único Layer está en SHADED.
     *
     * Aunque existan Objects y Slots vacíos, los Objects
     * no son candidatos válidos para un movimiento normal.
     */
    const {
        levelState
    } =
        createLevel({
            topObjectIds: [
                "object-a",
                null,
                null
            ],

            topState:
                "SHADED"
        });


    const system =
        new BlockDetectionSystem(
            levelState
        );


    const result =
        system.execute();


    assert.equal(
        result.blocked,
        true
    );

    assert.equal(
        result.reason,
        BlockDetectionSystem.REASON.BLOCK_DETECTED
    );

    assert.equal(
        result.validMove,
        null
    );
}


);

/* ============================================================

* 5. UN OBJECT LIBRE CON DESTINO DISPONIBLE
* ============================================================
  */

test(
"BlockDetectionSystem: un Object libre con un destino TOP vacío evita el bloqueo",
() => {


    /*
     * Shelf principal:
     *
     *     [A][B][C]
     *
     * Segunda Shelf:
     *
     *     [ ][ ][ ]
     *
     * A y B están bloqueados.
     * C está libre.
     *
     * Existe al menos un destino TOP vacío en la segunda
     * Shelf, por lo que C debe generar un movimiento válido.
     */

    const destinationLayer =
        createNormalLayer(
            "destination-top",
            [
                null,
                null,
                null
            ]
        );


    const destinationShelf =
        createNormalShelf(
            "destination-shelf",
            [
                destinationLayer
            ]
        );


    const {
        levelState
    } =
        createLevel({
            topObjectIds: [
                "object-a",
                "object-b",
                "object-c"
            ],

            additionalShelves: [
                destinationShelf
            ]
        });


    levelState
        .getObjectById(
            "object-a"
        )
        .blocked = true;


    levelState
        .getObjectById(
            "object-b"
        )
        .blocked = true;


    /*
     * object-c permanece libre.
     */
    const system =
        new BlockDetectionSystem(
            levelState
        );


    const result =
        system.execute();


    assert.equal(
        result.blocked,
        false
    );

    assert.equal(
        result.reason,
        BlockDetectionSystem.REASON.NO_BLOCK
    );

    assert.ok(
        result.validMove
    );

    assert.equal(
        result.validMove.objectId,
        "object-c"
    );

    assert.equal(
        result.remainingObjects,
        3
    );
}


);

/* ============================================================

* 6. NO CAMBIA LA FASE
* ============================================================
  */

test(
"BlockDetectionSystem: no convierte automáticamente BLOCKED en LOST",
() => {


    const {
        levelState
    } =
        createLevel({
            topObjectIds: [
                "object-a",
                "object-b",
                "object-c"
            ]
        });


    levelState
        .getObjectById(
            "object-a"
        )
        .blocked = true;


    levelState
        .getObjectById(
            "object-b"
        )
        .blocked = true;


    levelState
        .getObjectById(
            "object-c"
        )
        .blocked = true;


    const previousPhase =
        levelState.getPhase();


    const system =
        new BlockDetectionSystem(
            levelState
        );


    const result =
        system.execute();


    assert.equal(
        result.blocked,
        true
    );

    assert.equal(
        levelState.getPhase(),
        previousPhase
    );
}


);

/* ============================================================

* 7. NO MUTACIÓN DEL MODELO
* ============================================================
  */

test(
"BlockDetectionSystem: no modifica Board, Structure, Shelf, Layer ni Slots",
() => {


    const {
        levelState,
        board,
        structure,
        shelf,
        topLayer
    } =
        createLevel({
            topObjectIds: [
                "object-a",
                null,
                null
            ]
        });


    const before =
        snapshot(
            levelState
        );


    const system =
        new BlockDetectionSystem(
            levelState
        );


    system.execute();


    const after =
        snapshot(
            levelState
        );


    /*
     * Board.
     */
    assert.equal(
        after.board,
        board
    );


    /*
     * Structure.
     */
    assert.equal(
        after.structures[0],
        structure
    );


    /*
     * Shelf.
     */
    assert.equal(
        after.shelves[0],
        shelf
    );


    /*
     * Layer.
     */
    assert.equal(
        after.layers[0],
        topLayer
    );


    /*
     * Los mismos Slots permanecen intactos.
     */
    assert.deepEqual(
        after.slots,
        before.slots
    );


    /*
     * Los Objects tampoco cambian.
     */
    assert.deepEqual(
        after.objects,
        before.objects
    );


    /*
     * El único estado que podría cambiar en otros sistemas
     * tampoco es modificado aquí.
     */
    assert.equal(
        after.phase,
        before.phase
    );
}


);

/* ============================================================

* 8. ALIAS Y CONSULTA DIRECTA
* ============================================================
  */

test(
"BlockDetectionSystem: detect() e isBlocked() delegan correctamente",
() => {


    const {
        levelState
    } =
        createLevel({
            topObjectIds: [
                "object-a",
                "object-b",
                "object-c"
            ]
        });


    levelState
        .getObjectById(
            "object-a"
        )
        .blocked = true;


    levelState
        .getObjectById(
            "object-b"
        )
        .blocked = true;


    levelState
        .getObjectById(
            "object-c"
        )
        .blocked = true;


    const system =
        new BlockDetectionSystem(
            levelState
        );


    const result =
        system.detect();


    assert.equal(
        result.blocked,
        true
    );


    assert.equal(
        system.isBlocked(),
        true
    );


    /*
     * detect() no debe alterar el estado.
     */
    assert.equal(
        levelState.getObjectCount(),
        3
    );
}


);
