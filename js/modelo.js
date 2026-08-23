/* ============================================================
   OBJETINOS CONTRARELOJ
   MODELO DEL JUEGO
   V1.4.1 - MOTOR CORREGIDO
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

        this.dragging = false;

    }

}


/* ============================================================
   LAYER
   ============================================================ */

class Layer {

    constructor(index = 0) {

        this.index = index;

        /*
         * SIEMPRE exactamente 3 huecos.
         */
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

        return this.count === 3;

    }


    get(slot) {

        if (
            slot < 0 ||
            slot > 2
        ) {
            return null;
        }

        return this.slots[slot];

    }


    hasObjectAt(slot) {

        return this.slots[slot] !== null;

    }


    addTo(slot, object) {

        /*
         * Un slot concreto.
         */
        if (
            slot < 0 ||
            slot > 2
        ) {
            return false;
        }


        /*
         * No se puede ocupar un hueco ocupado.
         */
        if (
            this.slots[slot] !== null
        ) {
            return false;
        }


        this.slots[slot] = object;

        object.slot = slot;

        return true;

    }


    /*
     * Busca automáticamente el primer hueco libre.
     */
    addFirstFree(object) {

        for (
            let slot = 0;
            slot < 3;
            slot++
        ) {

            if (
                this.slots[slot] === null
            ) {

                return this.addTo(
                    slot,
                    object
                );

            }

        }

        return false;

    }


    removeFrom(slot) {

        if (
            slot < 0 ||
            slot > 2
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


    firstFreeSlot() {

        for (
            let i = 0;
            i < 3;
            i++
        ) {

            if (
                this.slots[i] === null
            ) {

                return i;

            }

        }


        return -1;

    }


    isTriple() {

        if (
            !this.full
        ) {

            return false;

        }


        const a = this.slots[0];
        const b = this.slots[1];
        const c = this.slots[2];


        return (
            a &&
            b &&
            c &&
            a.trioKey === b.trioKey &&
            b.trioKey === c.trioKey
        );

    }


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
   COMPARTMENT = ESTANTE
   ============================================================ */

class Compartment {

    constructor(element) {

        this.element =
            element || null;

        this.id =
            "shelf_" +
            Math.random()
                .toString(36)
                .substring(2, 9);

        this.layers = [];

        this.locked = false;

        this.unlockAfterTriples = 0;

        this.triplesCompleted = 0;

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
     * La capa frontal es la primera capa
     * que tenga objetos.
     *
     * NO eliminamos físicamente las capas
     * aquí. Solo buscamos la frontal.
     *
     * Esto evita problemas con las referencias
     * de los objetos.
     */

    activeLayer() {

        for (
            let i = 0;
            i < this.layers.length;
            i++
        ) {

            if (
                !this.layers[i].empty
            ) {

                return this.layers[i];

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
            layer => layer.empty
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

        if (!this.locked) {

            return false;

        }


        this.triplesCompleted++;


        if (
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

        this.remainingTime = 30;

        this.running = false;

        this.gameOver = false;

    }


    clear() {

        this.compartments = [];

        this.objects = [];

        this.combo = 0;

        this.lastTripleTime = 0;

        this.gameOver = false;

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
            this.activeObjects().length > 0
        );

    }


    registerTriple() {

        const now = Date.now();


        if (
            this.lastTripleTime > 0 &&
            now - this.lastTripleTime
                <= CONFIG.VENTANA_COMBO
        ) {

            this.combo++;

        } else {

            this.combo = 1;

        }


        this.lastTripleTime = now;


        return this.combo;

    }


    resetCombo() {

        this.combo = 0;

        this.lastTripleTime = 0;

    }

}


const GAME_MODEL =
    new GameModel();