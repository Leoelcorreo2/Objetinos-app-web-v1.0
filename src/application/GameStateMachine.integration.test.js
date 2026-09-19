import assert from "node:assert/strict";

import GameStateMachine from "./GameStateMachine.js";


let passed = 0;
let failed = 0;


function test(name, fn) {

    try {

        fn();

        console.log(
            `✓ ${name}`
        );

        passed += 1;

    } catch (error) {

        console.error(
            `✗ ${name}`
        );

        console.error(
            error
        );

        failed += 1;
    }
}


// -----------------------------------------------------------------------------
// 1. Estados
// -----------------------------------------------------------------------------

test(
    "define todos los estados conceptuales",
    () => {

        const expected = [
            "BOOT",
            "MENU",
            "LOADING_LEVEL",
            "READY",
            "DRAGGING",
            "RESOLVING",
            "BLOCKED",
            "PAUSED",
            "VICTORY",
            "TIME_OUT",
            "LIFE_LOST",
            "GAME_OVER"
        ];


        assert.deepEqual(
            GameStateMachine.VALUES,
            expected
        );
    }
);


// -----------------------------------------------------------------------------
// 2. Estado inicial
// -----------------------------------------------------------------------------

test(
    "comienza en BOOT por defecto",
    () => {

        const machine =
            new GameStateMachine();


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.BOOT
        );
    }
);


test(
    "permite comenzar en un estado válido",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.READY
            );


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.READY
        );
    }
);


// -----------------------------------------------------------------------------
// 3. Validación de estados
// -----------------------------------------------------------------------------

test(
    "isValid reconoce únicamente estados válidos",
    () => {

        assert.equal(
            GameStateMachine.isValid(
                GameStateMachine.STATE.BOOT
            ),
            true
        );


        assert.equal(
            GameStateMachine.isValid(
                "UNKNOWN"
            ),
            false
        );
    }
);


// -----------------------------------------------------------------------------
// 4. Flujo principal
// -----------------------------------------------------------------------------

test(
    "permite el flujo principal BOOT → MENU → LOADING_LEVEL → READY",
    () => {

        const machine =
            new GameStateMachine();


        assert.equal(
            machine.transitionTo(
                GameStateMachine.STATE.MENU
            ).transitioned,
            true
        );


        assert.equal(
            machine.transitionTo(
                GameStateMachine.STATE.LOADING_LEVEL
            ).transitioned,
            true
        );


        assert.equal(
            machine.transitionTo(
                GameStateMachine.STATE.READY
            ).transitioned,
            true
        );


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.READY
        );
    }
);


// -----------------------------------------------------------------------------
// 5. Movimiento
// -----------------------------------------------------------------------------

test(
    "permite READY → DRAGGING → RESOLVING → READY",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.READY
            );


        assert.equal(
            machine.transitionTo(
                GameStateMachine.STATE.DRAGGING
            ).transitioned,
            true
        );


        assert.equal(
            machine.transitionTo(
                GameStateMachine.STATE.RESOLVING
            ).transitioned,
            true
        );


        assert.equal(
            machine.transitionTo(
                GameStateMachine.STATE.READY
            ).transitioned,
            true
        );
    }
);


// -----------------------------------------------------------------------------
// 6. Resolving bloquea nuevos movimientos
// -----------------------------------------------------------------------------

test(
    "RESOLVING no permite iniciar otro DRAGGING",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.RESOLVING
            );


        assert.equal(
            machine.canTransitionTo(
                GameStateMachine.STATE.DRAGGING
            ),
            false
        );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.DRAGGING
            );


        assert.equal(
            result.transitioned,
            false
        );


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.RESOLVING
        );
    }
);


// -----------------------------------------------------------------------------
// 7. Bloqueo
// -----------------------------------------------------------------------------

test(
    "RESOLVING → BLOCKED es una transición válida",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.RESOLVING
            );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.BLOCKED
            );


        assert.equal(
            result.transitioned,
            true
        );


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.BLOCKED
        );
    }
);


// -----------------------------------------------------------------------------
// 8. Victoria
// -----------------------------------------------------------------------------

test(
    "RESOLVING → VICTORY es una transición válida",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.RESOLVING
            );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.VICTORY
            );


        assert.equal(
            result.transitioned,
            true
        );


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.VICTORY
        );
    }
);


test(
    "VICTORY no vuelve directamente a READY",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.VICTORY
            );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.READY
            );


        assert.equal(
            result.transitioned,
            false
        );


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.VICTORY
        );
    }
);


// -----------------------------------------------------------------------------
// 9. Timeout
// -----------------------------------------------------------------------------

test(
    "RESOLVING → TIME_OUT es una transición válida",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.RESOLVING
            );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.TIME_OUT
            );


        assert.equal(
            result.transitioned,
            true
        );
    }
);


test(
    "TIME_OUT → LIFE_LOST es una transición válida",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.TIME_OUT
            );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.LIFE_LOST
            );


        assert.equal(
            result.transitioned,
            true
        );
    }
);


// -----------------------------------------------------------------------------
// 10. Game Over
// -----------------------------------------------------------------------------

test(
    "LIFE_LOST → GAME_OVER es una transición válida",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.LIFE_LOST
            );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.GAME_OVER
            );


        assert.equal(
            result.transitioned,
            true
        );


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.GAME_OVER
        );
    }
);


test(
    "GAME_OVER → MENU permite comenzar otra partida",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.GAME_OVER
            );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.MENU
            );


        assert.equal(
            result.transitioned,
            true
        );


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.MENU
        );
    }
);


// -----------------------------------------------------------------------------
// 11. Pausa
// -----------------------------------------------------------------------------

test(
    "READY → PAUSED es válida",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.READY
            );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.PAUSED
            );


        assert.equal(
            result.transitioned,
            true
        );
    }
);


test(
    "PAUSED → READY es válida",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.PAUSED
            );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.READY
            );


        assert.equal(
            result.transitioned,
            true
        );
    }
);


// -----------------------------------------------------------------------------
// 12. Transiciones inválidas
// -----------------------------------------------------------------------------

test(
    "rechaza una transición hacia un estado inexistente",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.READY
            );


        const result =
            machine.transitionTo(
                "UNKNOWN"
            );


        assert.equal(
            result.transitioned,
            false
        );


        assert.equal(
            result.reason,
            GameStateMachine.REASON.INVALID_STATE
        );


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.READY
        );
    }
);


test(
    "rechaza READY → VICTORY",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.READY
            );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.VICTORY
            );


        assert.equal(
            result.transitioned,
            false
        );


        assert.equal(
            result.reason,
            GameStateMachine.REASON.INVALID_TRANSITION
        );


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.READY
        );
    }
);


test(
    "rechaza una transición al mismo estado",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.READY
            );


        const result =
            machine.transitionTo(
                GameStateMachine.STATE.READY
            );


        assert.equal(
            result.transitioned,
            false
        );


        assert.equal(
            result.reason,
            GameStateMachine.REASON.SAME_STATE
        );
    }
);


// -----------------------------------------------------------------------------
// 13. No mutación al validar
// -----------------------------------------------------------------------------

test(
    "validateTransition no modifica el estado",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.READY
            );


        const result =
            machine.validateTransition(
                GameStateMachine.STATE.DRAGGING
            );


        assert.equal(
            result.valid,
            true
        );


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.READY
        );
    }
);


// -----------------------------------------------------------------------------
// 14. Transiciones disponibles
// -----------------------------------------------------------------------------

test(
    "getAvailableTransitions devuelve las transiciones permitidas",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.READY
            );


        assert.deepEqual(
            machine.getAvailableTransitions(),
            [
                GameStateMachine.STATE.DRAGGING,
                GameStateMachine.STATE.PAUSED
            ]
        );
    }
);


// -----------------------------------------------------------------------------
// 15. Reset
// -----------------------------------------------------------------------------

test(
    "reset devuelve la máquina a BOOT",
    () => {

        const machine =
            new GameStateMachine(
                GameStateMachine.STATE.VICTORY
            );


        const result =
            machine.reset();


        assert.equal(
            machine.getState(),
            GameStateMachine.STATE.BOOT
        );


        assert.equal(
            result.previousState,
            GameStateMachine.STATE.VICTORY
        );


        assert.equal(
            result.state,
            GameStateMachine.STATE.BOOT
        );
    }
);


// -----------------------------------------------------------------------------
// Resultado
// -----------------------------------------------------------------------------

console.log("");

console.log(
    `GameStateMachine: ${passed}/${passed + failed} tests PASS`
);


if (failed > 0) {

    process.exitCode = 1;
}