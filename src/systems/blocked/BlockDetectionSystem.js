/**

* BlockDetectionSystem
*
* Ejecuta la detección de bloqueo del nivel a partir de
* BlockDetectionRules.
*
* Responsabilidad:
*
* * consultar BlockDetectionRules;
* * devolver el resultado de la detección;
* * no modificar el estado del juego.
*
* IMPORTANTE:
*
* BlockDetectionSystem NO convierte automáticamente un bloqueo
* en GamePhase.LOST.
*
* BLOQUEO y DERROTA son conceptos diferentes:
*
* 
  BLOCKED
  
* 
     ↓
  
* 
  coordinación del juego
  
* 
     ├── power-up
  
* 
     ├── salir
  
* 
     └── perder vida
  
*
* La decisión de cambiar la fase a LOST pertenece a una capa
* superior de coordinación del flujo del juego.
*
* La victoria tiene prioridad y es determinada por
* BlockDetectionRules.
  */

import BlockDetectionRules
from "../../rules/blocked/BlockDetectionRules.js";

export default class BlockDetectionSystem {


static REASON = Object.freeze({
    BLOCK_DETECTED:
        "BLOCK_DETECTED",

    NO_BLOCK:
        "NO_BLOCK",

    VICTORY:
        "VICTORY"
});


constructor(levelState) {

    if (!levelState) {
        throw new Error(
            "BlockDetectionSystem: levelState es obligatorio."
        );
    }

    this.levelState =
        levelState;

    this.rules =
        new BlockDetectionRules(
            levelState
        );
}


/**
 * Ejecuta la detección de bloqueo.
 *
 * No realiza ninguna mutación.
 *
 * @returns {{
 *   blocked: boolean,
 *   reason: string,
 *   remainingObjects: number,
 *   movableObjectIds: Array,
 *   candidateDestinationSlotIds: Array,
 *   validMove: Object|null
 * }}
 */
execute() {

    const validation =
        this.rules.validate();


    /*
     * Victoria.
     *
     * No quedan Objects y, por tanto,
     * el estado no se considera bloqueado.
     */
    if (
        validation.reason ===
        BlockDetectionRules.REASON.VICTORY
    ) {

        return {
            valid: true,
            executed: true,

            blocked: false,

            reason:
                BlockDetectionSystem.REASON.VICTORY,

            validation,

            remainingObjects:
                validation.remainingObjects,

            movableObjectIds:
                [...validation.movableObjectIds],

            candidateDestinationSlotIds:
                [...validation.candidateDestinationSlotIds],

            validMove:
                validation.validMove
        };
    }


    /*
     * Existe un bloqueo real.
     */
    if (
        validation.blocked === true
    ) {

        return {
            valid: true,
            executed: true,

            blocked: true,

            reason:
                BlockDetectionSystem.REASON.BLOCK_DETECTED,

            validation,

            remainingObjects:
                validation.remainingObjects,

            movableObjectIds:
                [...validation.movableObjectIds],

            candidateDestinationSlotIds:
                [...validation.candidateDestinationSlotIds],

            validMove:
                validation.validMove
        };
    }


    /*
     * Existe al menos un movimiento normal válido.
     */
    return {
        valid: true,
        executed: true,

        blocked: false,

        reason:
            BlockDetectionSystem.REASON.NO_BLOCK,

        validation,

        remainingObjects:
            validation.remainingObjects,

        movableObjectIds:
            [...validation.movableObjectIds],

        candidateDestinationSlotIds:
            [...validation.candidateDestinationSlotIds],

        validMove:
            validation.validMove
    };
}


/**
 * Alias semántico.
 */
detect() {
    return this.execute();
}


/**
 * Devuelve true cuando el nivel está bloqueado.
 */
isBlocked() {

    return this.execute().blocked === true;
}


}
