/**

* LevelState
*
* Representa el estado completo de una partida sobre un Board.
*
* Estructura:
*
* LevelState
* ├── board
* ├── objects
* ├── phase
* ├── timer
* └── dynamic
*
* Board:
* Contiene la estructura jerárquica del nivel.
*
* objects:
* Registro de las instancias Object utilizadas por el nivel.
*
* phase:
* Estado global de la partida.
*
* timer:
* Estado del temporizador del nivel.
*
* dynamic:
* Estado que cambia durante la ejecución.
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
    dynamicState = new DynamicState(),
    timer = null
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


    /*
     * El temporizador pertenece al LevelState.
     *
     * Si no se proporciona timer, el nivel queda sin
     * temporizador configurado.
     *
     * Esto permite que la configuración temporal se
     * determine posteriormente por el generador/configuración
     * del nivel.
     */
    if (timer === null) {

        this.timer = null;

    } else {

        if (
            !timer ||
            typeof timer !== "object"
        ) {
            throw new Error(
                "LevelState: timer debe ser un objeto o null."
            );
        }


        if (
            !Number.isFinite(timer.duration) ||
            timer.duration < 0
        ) {
            throw new Error(
                "LevelState: timer.duration debe ser un número >= 0."
            );
        }


        const remainingTime =
            timer.remainingTime ??
            timer.duration;


        if (
            !Number.isFinite(remainingTime) ||
            remainingTime < 0 ||
            remainingTime > timer.duration
        ) {
            throw new Error(
                "LevelState: timer.remainingTime no es válido."
            );
        }


        const running =
            timer.running ?? false;


        const paused =
            timer.paused ?? false;


        if (
            typeof running !== "boolean" ||
            typeof paused !== "boolean"
        ) {
            throw new Error(
                "LevelState: timer.running y timer.paused deben ser booleanos."
            );
        }


        this.timer = {
            duration:
                timer.duration,

            remainingTime,

            running,

            paused
        };
    }
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

    const index =
        this.objects.findIndex(
            object =>
                object.id === objectId
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
        object =>
            object.id === objectId
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
