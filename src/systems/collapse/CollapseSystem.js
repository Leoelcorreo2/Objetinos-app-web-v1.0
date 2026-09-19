/**

* CollapseSystem
*
* Ejecuta el colapso de una Shelf previamente validada
* por CollapseRules.
*
* Responsabilidades:
*
* * solicitar a CollapseRules la validación del colapso;
* * localizar la Structure que contiene la Shelf;
* * retirar la Shelf de la Structure;
* * conservar la identidad lógica de la Shelf, sus Layers
* y sus Slots;
* * devolver información suficiente para que una capa superior
* pueda producir el evento correspondiente.
*
* NO es responsabilidad de CollapseSystem:
*
* * decidir si una Shelf puede colapsar;
* * eliminar Layers;
* * eliminar Slots;
* * eliminar Objects;
* * modificar Objects de LevelState;
* * modificar otras Shelves;
* * avanzar Layers;
* * comprobar victoria;
* * comprobar bloqueo.
*
* Flujo:
*
* 
  CollapseRules
  
* 
       ↓
  
* 
  validate()
  
* 
       ↓
  
* 
  CollapseSystem
  
* 
       ↓
  
* 
  Structure.removeShelf()
  
* 
       ↓
  
* 
  SHELF_COLLAPSED
  

*/

import CollapseRules from "../../rules/collapse/CollapseRules.js";
import StateQueries from "../../state/StateQueries.js";

export default class CollapseSystem {
static REASON = Object.freeze({
SHELF_COLLAPSED: "SHELF_COLLAPSED",
COLLAPSE_REJECTED: "COLLAPSE_REJECTED"
});


constructor(levelState) {
    if (!levelState) {
        throw new Error(
            "CollapseSystem: levelState es obligatorio."
        );
    }

    this.levelState = levelState;

    this.rules =
        new CollapseRules(levelState);

    this.queries =
        new StateQueries(levelState);
}

/**
 * Ejecuta el colapso de una Shelf.
 *
 * La operación:
 *
 * 1. valida la Shelf mediante CollapseRules;
 * 2. localiza su Structure;
 * 3. comprueba que la Shelf sigue presente;
 * 4. elimina la Shelf de la colección de la Structure.
 *
 * Si cualquiera de las comprobaciones falla,
 * el estado permanece sin modificar.
 *
 * @param {string|number} shelfId
 *
 * @returns {Object}
 */
execute(shelfId) {
    /*
     * 1. Validación de reglas.
     *
     * CollapseRules no modifica el estado.
     */
    const validation =
        this.rules.validate(shelfId);

    if (!validation.valid) {
        return {
            valid: false,
            executed: false,
            reason:
                CollapseSystem.REASON.COLLAPSE_REJECTED,
            validation
        };
    }

    /*
     * 2. Localizamos la Structure propietaria.
     */
    const structure =
        this.queries.getStructureForShelf(
            shelfId
        );

    /*
     * La validación anterior ha encontrado la Shelf,
     * por lo que no debería ser posible llegar aquí
     * sin Structure.
     *
     * Aun así, mantenemos la comprobación para evitar
     * cualquier mutación parcial ante un estado inconsistente.
     */
    if (!structure) {
        return {
            valid: false,
            executed: false,
            reason:
                CollapseSystem.REASON.COLLAPSE_REJECTED,
            validation: {
                valid: false,
                reason:
                    "STRUCTURE_NOT_FOUND",
                shelfId
            }
        };
    }

    /*
     * 3. Verificamos que la Shelf sigue presente
     * dentro de la Structure antes de modificarla.
     */
    const shelf =
        structure.getShelfById(shelfId);

    if (!shelf) {
        return {
            valid: false,
            executed: false,
            reason:
                CollapseSystem.REASON.COLLAPSE_REJECTED,
            validation: {
                valid: false,
                reason:
                    "SHELF_NOT_FOUND_IN_STRUCTURE",
                shelfId,
                structureId:
                    structure.id
            }
        };
    }

    /*
     * Guardamos las referencias antes de retirar
     * la Shelf de la Structure.
     *
     * La Shelf, sus Layers y sus Slots siguen siendo
     * exactamente las mismas instancias.
     */
    const collapsedShelf = shelf;

    const layerIds =
        collapsedShelf.layers.map(
            layer => layer.id
        );

    /*
     * 4. Ejecutamos la única mutación propia
     * de CollapseSystem:
     *
     * retirar la Shelf de su Structure.
     */
    const removed =
        structure.removeShelf(shelfId);

    /*
     * Una eliminación fallida no debe presentarse
     * como un colapso ejecutado.
     */
    if (!removed) {
        return {
            valid: false,
            executed: false,
            reason:
                CollapseSystem.REASON.COLLAPSE_REJECTED,
            validation: {
                valid: false,
                reason:
                    "SHELF_REMOVE_FAILED",
                shelfId,
                structureId:
                    structure.id
            }
        };
    }

    /*
     * 5. Resultado del colapso.
     *
     * No eliminamos la Shelf de memoria.
     * La referencia sigue siendo válida y conserva
     * toda su identidad interna.
     */
    return {
        valid: true,
        executed: true,
        reason:
            CollapseSystem.REASON.SHELF_COLLAPSED,

        shelfId,

        structureId:
            structure.id,

        layerIds,

        shelf:
            collapsedShelf
    };
}

/**
 * Alias semántico.
 */
collapse(shelfId) {
    return this.execute(shelfId);
}

}
