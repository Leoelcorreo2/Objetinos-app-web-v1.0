/**
 * GamePhase
 *
 * Define las fases globales de una partida/nivel.
 *
 * Las fases representan el estado global del flujo de juego.
 * No contienen lógica de transición.
 */

export default class GamePhase {
    static READY = "READY";
    static PLAYING = "PLAYING";
    static WON = "WON";
    static LOST = "LOST";

    static VALUES = Object.freeze([
        GamePhase.READY,
        GamePhase.PLAYING,
        GamePhase.WON,
        GamePhase.LOST
    ]);

    static isValid(phase) {
        return GamePhase.VALUES.includes(phase);
    }
}