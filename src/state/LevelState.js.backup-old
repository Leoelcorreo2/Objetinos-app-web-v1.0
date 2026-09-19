/**
 * LevelState
 *
 * Representa el estado completo de una partida sobre un Board.
 *
 * Estructura:
 *
 * LevelState
 *   ├── board
 *   ├── objects
 *   ├── phase
 *   └── dynamic
 *
 * Board:
 *   Contiene la estructura jerárquica del nivel.
 *
 * objects:
 *   Registro de las instancias Object utilizadas por el nivel.
 *
 * phase:
 *   Estado global de la partida.
 *
 * dynamic:
 *   Estado que cambia durante la ejecución.
 *
 * IMPORTANTE:
 * LevelState NO ejecuta reglas de juego.
 */

import GamePhase from "./GamePhase.js";
import DynamicState from "./DynamicState.js";

export default class LevelState {
    constructor({
        board,
        objects = [],
        phase = GamePhase.READY,
        dynamicState = new DynamicState()
    }) {
        if (!board) {
            throw new Error(
                "LevelState: el Board es obligatorio."
            );
        }

        if (!GamePhase.isValid(phase)) {
            throw new Error(
                `LevelState: fase no válida "${phase}".`
            );
        }

        if (!dynamicState) {
            throw new Error(
                "LevelState: dynamicState es obligatorio."
            );
        }

        this.board = board;
        this.objects = [];

        for (const object of objects) {
            this.addObject(object);
        }

        this.phase = phase;
        this.dynamic = dynamicState;
    }

    /**
     * Registra un Object en el estado del nivel.
     *
     * El Object se mantiene fuera del Board.
     * Los Slots solamente almacenan su objectId.
     */
    addObject(object) {
        if (!object) {
            throw new Error(
                "LevelState: el Object no puede ser null o undefined."
            );
        }

        if (this.getObjectById(object.id)) {
            throw new Error(
                `LevelState: ya existe un Object con id "${object.id}".`
            );
        }

        this.objects.push(object);

        return object;
    }

    /**
     * Elimina un Object del registro.
     *
     * IMPORTANTE:
     * Esta operación no modifica ningún Slot.
     *
     * Las reglas responsables de eliminar objetos deberán mantener
     * la consistencia entre Slot y registro de Objects.
     */
    removeObject(objectId) {
        const index = this.objects.findIndex(
            object => object.id === objectId
        );

        if (index === -1) {
            return false;
        }

        this.objects.splice(index, 1);

        return true;
    }

    /**
     * Busca un Object por ID.
     */
    getObjectById(objectId) {
        return this.objects.find(
            object => object.id === objectId
        ) ?? null;
    }

    /**
     * Devuelve el número de Objects registrados.
     */
    getObjectCount() {
        return this.objects.length;
    }

    /**
     * Cambia la fase global de la partida.
     */
    setPhase(phase) {
        if (!GamePhase.isValid(phase)) {
            throw new Error(
                `LevelState: fase no válida "${phase}".`
            );
        }

        this.phase = phase;
    }

    getPhase() {
        return this.phase;
    }

    isReady() {
        return this.phase === GamePhase.READY;
    }

    isPlaying() {
        return this.phase === GamePhase.PLAYING;
    }

    isWon() {
        return this.phase === GamePhase.WON;
    }

    isLost() {
        return this.phase === GamePhase.LOST;
    }
}