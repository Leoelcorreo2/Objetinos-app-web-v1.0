/**

* StructureMovementSystem
*
* Ejecuta el movimiento físico continuo de una Structure.
*
* Flujo:
*
* 
  StructureMovementRules
  
* 
           ↓
  
* 
     ¿Movimiento válido?
  
* 
           ↓
  
* 
  StructureMovementSystem
  
* 
           ↓
  
* 
     position +=
  
* 
     direction * speed * deltaTime
  
*
* IMPORTANTE:
*
* * No decide si una Structure puede moverse.
* * Delega esa decisión en StructureMovementRules.
* * No modifica Shelves.
* * No modifica Layers.
* * No modifica Slots.
* * No modifica Objects.
* * No modifica la identidad lógica de la Structure.
*
* La posición física pertenece a Structure.position.
*
* El sistema trabaja con movimiento continuo mediante deltaTime.
*
* El comportamiento de wrap-around visual se resolverá en la capa
* física/renderizada cuando existan los límites de representación.
  */

import StructureMovementRules
    from "../../rules/structure/StructureMovementRules.js";

export default class StructureMovementSystem {


static REASON = Object.freeze({

    MOVEMENT_EXECUTED:
        "MOVEMENT_EXECUTED",

    MOVEMENT_REJECTED:
        "MOVEMENT_REJECTED",

    INVALID_DELTA_TIME:
        "INVALID_DELTA_TIME",

    INVALID_DIRECTION:
        "INVALID_DIRECTION"
});


constructor(levelState) {

    if (!levelState) {

        throw new Error(
            "StructureMovementSystem: levelState es obligatorio."
        );
    }

    this.levelState =
        levelState;

    this.rules =
        new StructureMovementRules(
            levelState
        );
}


/**
 * Ejecuta un paso de movimiento.
 *
 * deltaTime representa el tiempo transcurrido,
 * en las mismas unidades utilizadas por speed.
 *
 * Ejemplo:
 *
 * position.x = 10
 * direction.x = 1
 * speed = 2
 * deltaTime = 0.5
 *
 * desplazamiento = 1 * 2 * 0.5
 * posición nueva = 11
 *
 * @param {Object} params
 * @param {string|number} params.structureId
 * @param {number} params.deltaTime
 *
 * @returns {Object}
 */
execute({
    structureId,
    deltaTime
}) {

    /*
     * deltaTime es responsabilidad del sistema.
     *
     * No aceptamos valores negativos, NaN,
     * Infinity ni tipos no numéricos.
     */
    if (
        !Number.isFinite(deltaTime) ||
        deltaTime < 0
    ) {

        return {

            valid: false,

            executed: false,

            reason:
                StructureMovementSystem.REASON
                    .INVALID_DELTA_TIME,

            structureId,

            deltaTime
        };
    }


    /*
     * Primero validamos las reglas.
     *
     * No se modifica el estado si falla.
     */
    const validation =
        this.rules.validate(
            structureId
        );


    if (!validation.valid) {

        return {

            valid: false,

            executed: false,

            reason:
                StructureMovementSystem.REASON
                    .MOVEMENT_REJECTED,

            validation
        };
    }


    /*
     * Volvemos a obtener la Structure desde el estado actual.
     *
     * La validación no proporciona una referencia que deba
     * utilizarse como fuente de verdad para la mutación.
     */
    const structure =
        this.levelState.board
            .getStructureById(
                structureId
            );


    /*
     * Protección frente a un estado inconsistente
     * entre validación y ejecución.
     */
    if (!structure) {

        return {

            valid: false,

            executed: false,

            reason:
                StructureMovementSystem.REASON
                    .MOVEMENT_REJECTED,

            validation: {

                valid: false,

                reason:
                    StructureMovementRules.REASON
                        .STRUCTURE_NOT_FOUND,

                structureId
            }
        };
    }


    /*
     * Convertimos la dirección lógica a un vector
     * de desplazamiento.
     *
     * La especificación todavía no fija una única
     * representación de direction.
     *
     * Los objetos vectoriales se utilizan directamente.
     *
     * Las cadenas cardinales se soportan como una
     * comodidad compatible con StructureMovementRules.
     */
    const direction =
        this.resolveDirection(
            structure.movement.direction
        );


    if (!direction) {

        return {

            valid: false,

            executed: false,

            reason:
                StructureMovementSystem.REASON
                    .INVALID_DIRECTION,

            validation
        };
    }


    /*
     * Calculamos el desplazamiento.
     *
     * Movimiento continuo:
     *
     * displacement =
     *     direction * speed * deltaTime
     */
    const displacement = {

        x:
            direction.x *
            structure.movement.speed *
            deltaTime,

        y:
            direction.y *
            structure.movement.speed *
            deltaTime,

        z:
            direction.z *
            structure.movement.speed *
            deltaTime
    };


    /*
     * Guardamos la posición anterior.
     *
     * Se devuelve como copia para evitar exponer
     * la referencia interna de Structure.position.
     */
    const previousPosition = {

        x: structure.position.x,

        y: structure.position.y,

        z: structure.position.z
    };


    /*
     * Calculamos la nueva posición.
     */
    const nextPosition = {

        x:
            previousPosition.x +
            displacement.x,

        y:
            previousPosition.y +
            displacement.y,

        z:
            previousPosition.z +
            displacement.z
    };


    /*
     * La posición resultante debe seguir siendo válida.
     *
     * Si el cálculo produjese NaN o Infinity,
     * no realizamos una mutación parcial.
     */
    if (
        !this.isValidPosition(
            nextPosition
        )
    ) {

        return {

            valid: false,

            executed: false,

            reason:
                StructureMovementSystem.REASON
                    .MOVEMENT_REJECTED,

            validation: {

                valid: false,

                reason:
                    "INVALID_RESULTING_POSITION",

                structureId
            }
        };
    }


    /*
     * ÚNICA mutación del sistema:
     *
     * actualizar la posición física de Structure.
     */
    structure.position = nextPosition;


    return {

        valid: true,

        executed: true,

        reason:
            StructureMovementSystem.REASON
                .MOVEMENT_EXECUTED,

        structureId,

        previousPosition,

        nextPosition: {

            x: nextPosition.x,

            y: nextPosition.y,

            z: nextPosition.z
        },

        displacement: {

            x: displacement.x,

            y: displacement.y,

            z: displacement.z
        },

        deltaTime,

        speed:
            structure.movement.speed,

        direction
    };
}


/**
 * Alias semántico para ejecutar un paso
 * de movimiento.
 */
move({
    structureId,
    deltaTime
}) {

    return this.execute({
        structureId,
        deltaTime
    });
}


/**
 * Convierte la dirección almacenada en Structure
 * en un vector físico.
 *
 * Representación soportada:
 *
 * {
 *     x,
 *     y,
 *     z
 * }
 *
 * y direcciones cardinales:
 *
 * RIGHT
 * LEFT
 * UP
 * DOWN
 * FORWARD
 * BACKWARD
 *
 * La representación vectorial es la principal.
 */
resolveDirection(direction) {

    if (
        direction &&
        typeof direction === "object"
    ) {

        const x =
            direction.x ?? 0;

        const y =
            direction.y ?? 0;

        const z =
            direction.z ?? 0;


        if (
            Number.isFinite(x) &&
            Number.isFinite(y) &&
            Number.isFinite(z)
        ) {

            return {
                x,
                y,
                z
            };
        }

        return null;
    }


    if (
        typeof direction !== "string"
    ) {

        return null;
    }


    switch (
        direction.trim().toUpperCase()
    ) {

        case "RIGHT":

            return {
                x: 1,
                y: 0,
                z: 0
            };


        case "LEFT":

            return {
                x: -1,
                y: 0,
                z: 0
            };


        case "UP":

            return {
                x: 0,
                y: 1,
                z: 0
            };


        case "DOWN":

            return {
                x: 0,
                y: -1,
                z: 0
            };


        case "FORWARD":

            return {
                x: 0,
                y: 0,
                z: 1
            };


        case "BACKWARD":

            return {
                x: 0,
                y: 0,
                z: -1
            };


        default:

            return null;
    }
}


/**
 * Comprueba que una posición contiene
 * coordenadas numéricas finitas.
 */
isValidPosition(position) {

    if (!position) {
        return false;
    }

    return (

        Number.isFinite(position.x) &&

        Number.isFinite(position.y) &&

        Number.isFinite(position.z)
    );
}


}
