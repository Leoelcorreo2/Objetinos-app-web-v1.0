/* ============================================================
   OBJETINOS CONTRARELOJ
   MODELO DEL JUEGO
   ============================================================ */


/* ============================================================
   GAME OBJECT
   ============================================================ */

class GameObject {

    constructor(tipo) {

        this.id =
            "obj_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 9);


        /* ----------------------------------------------------
           TIPO
           ---------------------------------------------------- */

        this.type = tipo.id;

        this.trioKey = tipo.id;

        this.emoji = tipo.emoji;

        this.nombre = tipo.nombre;


        /* ----------------------------------------------------
           POSICIÓN LÓGICA
           ---------------------------------------------------- */

        this.compartment = null;

        this.layer = null;

        this.slot = null;


        /* ----------------------------------------------------
           ELEMENTO HTML
           ---------------------------------------------------- */

        this.element = null;


        /* ----------------------------------------------------
           ESTADO
           ---------------------------------------------------- */

        this.removed = false;

        this.selected = false;

        this.dragging = false;

    }

}


/* ============================================================
   LAYER
   ============================================================

   Cada capa tiene SIEMPRE 3 posiciones:

       slots[0]
       slots[1]
       slots[2]

   Puede haber:

       [🍎][  ][🍌]

   o:

       [  ][  ][  ]

   o:

       [🍎][🍎][🍎]

   ============================================================ */

class Layer {

    constructor(index = 0) {

        this.index = index;


        this.slots = [

            null,

            null,

            null

        ];

    }


    /* --------------------------------------------------------
       OBJETOS DE LA CAPA
       -------------------------------------------------------- */

    objects() {

        return this.slots.filter(
            object => object !== null
        );

    }


    /* --------------------------------------------------------
       NÚMERO DE OBJETOS
       -------------------------------------------------------- */

    get count() {

        return this.objects().length;

    }


    /* --------------------------------------------------------
       CAPA VACÍA
       -------------------------------------------------------- */

    get empty() {

        return this.count === 0;

    }


    /* --------------------------------------------------------
       CAPA COMPLETA
       -------------------------------------------------------- */

    get full() {

        return this.count ===
            CONFIG.HUECOS_POR_ESTANTE;

    }


    /* --------------------------------------------------------
       OBTENER OBJETO DE UN HUECO
       -------------------------------------------------------- */

    get(slot) {

        if (
            slot < 0 ||
            slot >= CONFIG.HUECOS_POR_ESTANTE
        ) {

            return null;

        }

        return this.slots[slot];

    }


    /* --------------------------------------------------------
       ¿ESTÁ OCUPADO?
       -------------------------------------------------------- */

    hasObjectAt(slot) {

        return this.get(slot) !== null;

    }


    /* --------------------------------------------------------
       AÑADIR OBJETO
       -------------------------------------------------------- */

    addTo(slot, object) {

        if (
            slot < 0 ||
            slot >= CONFIG.HUECOS_POR_ESTANTE
        ) {

            return false;

        }


        if (
            this.slots[slot] !== null
        ) {

            return false;

        }


        this.slots[slot] = object;


        object.slot = slot;

        return true;

    }


    /* --------------------------------------------------------
       QUITAR OBJETO
       -------------------------------------------------------- */

    removeFrom(slot) {

        if (
            slot < 0 ||
            slot >= CONFIG.HUECOS_POR_ESTANTE
        ) {

            return null;

        }


        const object =
            this.slots[slot];


        this.slots[slot] = null;


        if (object) {

            object.slot = null;

        }


        return object;

    }


    /* --------------------------------------------------------
       LIMPIAR CAPA
       -------------------------------------------------------- */

    clear() {

        this.slots = [

            null,
            null,
            null

        ];

    }


    /* --------------------------------------------------------
       COMPROBAR TRÍO
       -------------------------------------------------------- */

    isTriple() {

        if (
            !this.full
        ) {

            return false;

        }


        const a =
            this.slots[0];

        const b =
            this.slots[1];

        const c =
            this.slots[2];


        return (

            a &&
            b &&
            c &&

            a.trioKey === b.trioKey &&

            b.trioKey === c.trioKey

        );

    }


    /* --------------------------------------------------------
       OBTENER TRÍO
       -------------------------------------------------------- */

    getTriple() {

        if (
            !this.isTriple()
        ) {

            return [];

        }


        return [

            this.slots[0],

            this.slots[1],

            this.slots[2]

        ];

    }

}


/* ============================================================
   COMPARTMENT
   ============================================================

   Un Compartment es un ESTANTE.

   Cada estante puede tener:

       1 capa
       2 capas
       3 capas
       N capas

   Pero TODAS las capas tienen exactamente 3 huecos.

   ============================================================ */

class Compartment {

    constructor(element) {

        this.element =
            element || null;


        /* ----------------------------------------------------
           CAPAS
           ---------------------------------------------------- */

        this.layers = [];


        /* ----------------------------------------------------
           ESTANTE BLOQUEADO
           ---------------------------------------------------- */

        this.locked = false;


        /* ----------------------------------------------------
           TRÍOS NECESARIOS PARA DESBLOQUEAR
           ---------------------------------------------------- */

        this.unlockAfterTriples = 0;


        /* ----------------------------------------------------
           TRÍOS CONSEGUIDOS
           ---------------------------------------------------- */

        this.triplesCompleted = 0;


        /* ----------------------------------------------------
           ID
           ---------------------------------------------------- */

        this.id =
            "shelf_" +
            Math.random()
                .toString(36)
                .substring(2, 9);

    }


    /* --------------------------------------------------------
       CREAR CAPA
       -------------------------------------------------------- */

    ensureLayer(index) {

        while (
            this.layers.length <= index
        ) {

            this.layers.push(
                new Layer(
                    this.layers.length
                )
            );

        }


        return this.layers[index];

    }


    /* --------------------------------------------------------
       CAPA FRONTAL
       --------------------------------------------------------

       La capa frontal es siempre la primera
       capa que contiene objetos.

       Las capas vacías se eliminan
       automáticamente del frente.

       -------------------------------------------------------- */

    activeLayer() {

        while (

            this.layers.length > 0 &&

            this.layers[0].empty

        ) {

            this.layers.shift();

        }


        // Reindexamos

        this.layers.forEach(
            (layer, index) => {

                layer.index = index;

            }
        );


        return this.layers[0] || null;

    }


    /* --------------------------------------------------------
       AÑADIR CAPA
       -------------------------------------------------------- */

    addLayer() {

        const layer =
            new Layer(
                this.layers.length
            );

        this.layers.push(layer);

        return layer;

    }


    /* --------------------------------------------------------
       ¿ESTÁ VACÍO EL ESTANTE?
       -------------------------------------------------------- */

    isEmpty() {

        return this.layers.every(
            layer => layer.empty
        );

    }


    /* --------------------------------------------------------
       ¿TIENE MÁS CAPAS?
       -------------------------------------------------------- */

    hasMoreLayers() {

        return this.layers.length > 1;

    }


    /* --------------------------------------------------------
       BLOQUEAR
       -------------------------------------------------------- */

    lock(
        triplesRequired = 0
    ) {

        this.locked = true;

        this.unlockAfterTriples =
            triplesRequired;

        this.updateLockedVisual();

    }


    /* --------------------------------------------------------
       DESBLOQUEAR
       -------------------------------------------------------- */

    unlock() {

        this.locked = false;

        this.unlockAfterTriples = 0;

        this.triplesCompleted = 0;

        this.updateLockedVisual();

    }


    /* --------------------------------------------------------
       REGISTRAR TRÍO
       -------------------------------------------------------- */

    registerTriple() {

        this.triplesCompleted++;


        if (

            this.locked &&

            this.triplesCompleted >=
            this.unlockAfterTriples

        ) {

            this.unlock();

            return true;

        }


        return false;

    }


    /* --------------------------------------------------------
       ASPECTO VISUAL DEL BLOQUEO
       -------------------------------------------------------- */

    updateLockedVisual() {

        if (
            !this.element
        ) {

            return;

        }


        if (
            this.locked
        ) {

            this.element
                .classList
                .add(
                    "lockedShelf"
                );

        }

        else {

            this.element
                .classList
                .remove(
                    "lockedShelf"
                );

        }

    }

}


/* ============================================================
   GAME MODEL
   ============================================================ */

class GameModel {

    constructor() {

        this.compartments = [];

        this.objects = [];

        this.level = 1;

        this.score = 0;

        this.coins = 0;

        this.combo = 0;

        this.lastTripleTime = 0;

        this.remainingTime =
            CONFIG.TIEMPO_INICIAL;

        this.running = false;

        this.gameOver = false;

    }


    /* --------------------------------------------------------
       LIMPIAR TABLERO
       -------------------------------------------------------- */

    clear() {

        this.compartments = [];

        this.objects = [];

        this.combo = 0;

        this.lastTripleTime = 0;

        this.gameOver = false;

    }


    /* --------------------------------------------------------
       REGISTRAR ESTANTE
       -------------------------------------------------------- */

    addCompartment(compartment) {

        this.compartments.push(
            compartment
        );

        return compartment;

    }


    /* --------------------------------------------------------
       REGISTRAR OBJETO
       -------------------------------------------------------- */

    addObject(object) {

        this.objects.push(
            object
        );

        return object;

    }


    /* --------------------------------------------------------
       OBJETOS ACTIVOS
       -------------------------------------------------------- */

    activeObjects() {

        return this.objects.filter(
            object =>
                !object.removed
        );

    }


    /* --------------------------------------------------------
       ¿QUEDAN OBJETOS?
       -------------------------------------------------------- */

    hasObjects() {

        return this.activeObjects()
            .length > 0;

    }


    /* --------------------------------------------------------
       INCREMENTAR COMBO
       -------------------------------------------------------- */

    registerTriple() {

        const now =
            Date.now();


        if (

            now -
            this.lastTripleTime
            <= CONFIG.VENTANA_COMBO

        ) {

            this.combo++;

        }

        else {

            this.combo = 1;

        }


        this.lastTripleTime =
            now;


        return this.combo;

    }


    /* --------------------------------------------------------
       REINICIAR COMBO
       -------------------------------------------------------- */

    resetCombo() {

        this.combo = 0;

        this.lastTripleTime = 0;

    }

}


/* ============================================================
   INSTANCIA GLOBAL DEL MODELO
   ============================================================ */

const GAME_MODEL =
    new GameModel();