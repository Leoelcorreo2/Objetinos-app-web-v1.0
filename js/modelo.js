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

        this.type = tipo.id;

        this.trioKey = tipo.id;

        this.emoji = tipo.emoji;

        this.nombre = tipo.nombre;

        this.compartment = null;

        this.layer = null;

        this.slot = null;

        this.element = null;

        this.removed = false;

        this.selected = false;

        this.dragging = false;
    }
}


/* ============================================================
   LAYER
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


    objects() {

        return this.slots.filter(
            object => object !== null
        );
    }


    get count() {

        return this.objects().length;
    }


    get empty() {

        return this.count === 0;
    }


    get full() {

        return this.count ===
            CONFIG.HUECOS_POR_ESTANTE;
    }


    get(slot) {

        if (
            slot < 0 ||
            slot >= CONFIG.HUECOS_POR_ESTANTE
        ) {

            return null;
        }

        return this.slots[slot];
    }


    hasObjectAt(slot) {

        return this.get(slot) !== null;
    }


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


    clear() {

        this.slots = [
            null,
            null,
            null
        ];
    }


    isTriple() {

        const objects =
            this.objects();


        if (
            objects.length !== 3
        ) {

            return false;
        }


        return (
            objects[0].trioKey ===
            objects[1].trioKey &&

            objects[1].trioKey ===
            objects[2].trioKey
        );
    }


    getTriple() {

        if (
            !this.isTriple()
        ) {

            return [];
        }


        return this.objects();
    }
}


/* ============================================================
   COMPARTMENT / ESTANTE
   ============================================================ */

class Compartment {

    constructor(element) {

        this.element =
            element || null;

        this.layers = [];

        this.locked = false;

        this.unlockAfterTriples = 0;

        this.triplesCompleted = 0;

        this.id =
            "shelf_" +
            Math.random()
                .toString(36)
                .substring(2, 9);
    }


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


    /*
     * IMPORTANTE:
     *
     * NO eliminamos capas vacías.
     *
     * Buscamos la primera capa que
     * todavía contiene objetos.
     */

    activeLayer() {

        for (
            const layer of this.layers
        ) {

            if (
                !layer.empty
            ) {

                return layer;
            }
        }


        return null;
    }


    addLayer() {

        return this.ensureLayer(
            this.layers.length
        );
    }


    isEmpty() {

        return this.layers.every(
            layer =>
                layer.empty
        );
    }


    hasMoreLayers() {

        const activeIndex =
            this.layers.findIndex(
                layer =>
                    !layer.empty
            );


        if (
            activeIndex === -1
        ) {

            return false;
        }


        return this.layers
            .slice(activeIndex + 1)
            .some(
                layer =>
                    !layer.empty
            );
    }


    lock(
        triplesRequired = 1
    ) {

        this.locked = true;

        this.unlockAfterTriples =
            triplesRequired;

        this.updateLockedVisual();
    }


    unlock() {

        this.locked = false;

        this.unlockAfterTriples = 0;

        this.triplesCompleted = 0;

        this.updateLockedVisual();
    }


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


    updateLockedVisual() {

        if (
            !this.element
        ) {

            return;
        }


        this.element.classList.toggle(
            "lockedShelf",
            this.locked
        );
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

        this.moves = 0;
    }


    clear() {

        this.compartments = [];

        this.objects = [];

        this.combo = 0;

        this.lastTripleTime = 0;

        this.gameOver = false;

        this.moves = 0;
    }


    addCompartment(compartment) {

        this.compartments.push(
            compartment
        );

        return compartment;
    }


    addObject(object) {

        this.objects.push(
            object
        );

        return object;
    }


    activeObjects() {

        return this.objects.filter(
            object =>
                !object.removed
        );
    }


    hasObjects() {

        return (
            this.activeObjects()
                .length > 0
        );
    }


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


    resetCombo() {

        this.combo = 0;

        this.lastTripleTime = 0;
    }
}


/* ============================================================
   INSTANCIA GLOBAL
   ============================================================ */

const GAME_MODEL =
    new GameModel();