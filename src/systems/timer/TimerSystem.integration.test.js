import test from "node:test";
import assert from "node:assert/strict";

import Board from "../../model/Board.js";
import LevelState from "../../state/LevelState.js";
import GamePhase from "../../state/GamePhase.js";

import TimerSystem from "./TimerSystem.js";

function createLevel(
timer,
phase = GamePhase.PLAYING
) {


return new LevelState({
    board:
        new Board(),

    phase,

    timer
});


}

/* ============================================================

* 1. START
* ============================================================
  */

test(
"TimerSystem: start activa el temporizador",
() => {


    const levelState =
        createLevel({
            duration: 10
        });


    const system =
        new TimerSystem(
            levelState
        );


    const result =
        system.start();


    assert.equal(
        result.valid,
        true
    );

    assert.equal(
        result.executed,
        true
    );

    assert.equal(
        result.reason,
        TimerSystem.REASON.TIMER_STARTED
    );

    assert.equal(
        levelState.timer.running,
        true
    );

    assert.equal(
        levelState.timer.remainingTime,
        10
    );
}


);

/* ============================================================

* 2. ACTUALIZACIÓN
* ============================================================
  */

test(
"TimerSystem: update descuenta tiempo real",
() => {


    const levelState =
        createLevel({
            duration: 10,
            running: true
        });


    const system =
        new TimerSystem(
            levelState
        );


    const result =
        system.update(2.5);


    assert.equal(
        result.valid,
        true
    );

    assert.equal(
        result.executed,
        true
    );

    assert.equal(
        result.reason,
        TimerSystem.REASON.TIMER_UPDATED
    );

    assert.equal(
        result.previousTime,
        10
    );

    assert.equal(
        result.remainingTime,
        7.5
    );

    assert.equal(
        levelState.timer.remainingTime,
        7.5
    );
}


);

/* ============================================================

* 3. DELTA TIME = 0
* ============================================================
  */

test(
"TimerSystem: deltaTime cero no cambia el tiempo",
() => {


    const levelState =
        createLevel({
            duration: 10,
            running: true
        });


    const system =
        new TimerSystem(
            levelState
        );


    const result =
        system.execute(0);


    assert.equal(
        result.valid,
        true
    );

    assert.equal(
        result.remainingTime,
        10
    );

    assert.equal(
        levelState.timer.remainingTime,
        10
    );
}


);

/* ============================================================

* 4. EXPIRACIÓN
* ============================================================
  */

test(
"TimerSystem: nunca baja de cero y detecta TIME_EXPIRED",
() => {


    const levelState =
        createLevel({
            duration: 10,
            running: true
        });


    const system =
        new TimerSystem(
            levelState
        );


    const result =
        system.execute(12);


    assert.equal(
        result.valid,
        true
    );

    assert.equal(
        result.executed,
        true
    );

    assert.equal(
        result.reason,
        TimerSystem.REASON.TIME_EXPIRED
    );

    assert.equal(
        result.remainingTime,
        0
    );

    assert.equal(
        levelState.timer.remainingTime,
        0
    );

    assert.equal(
        levelState.timer.running,
        false
    );

    assert.equal(
        system.isExpired(),
        true
    );
}


);

/* ============================================================

* 5. DELTA TIME INVÁLIDO
* ============================================================
  */

test(
"TimerSystem: deltaTime inválido no muta el temporizador",
() => {


    const invalidValues = [
        -1,
        NaN,
        Infinity,
        -Infinity
    ];


    for (
        const value
        of invalidValues
    ) {

        const levelState =
            createLevel({
                duration: 10,
                running: true
            });


        const system =
            new TimerSystem(
                levelState
            );


        const result =
            system.execute(
                value
            );


        assert.equal(
            result.valid,
            false
        );

        assert.equal(
            result.executed,
            false
        );

        assert.equal(
            result.reason,
            TimerSystem.REASON.INVALID_DELTA_TIME
        );

        assert.equal(
            levelState.timer.remainingTime,
            10
        );

        assert.equal(
            levelState.timer.running,
            true
        );
    }
}


);

/* ============================================================

* 6. PAUSA
* ============================================================
  */

test(
"TimerSystem: pause impide el descuento",
() => {


    const levelState =
        createLevel({
            duration: 10,
            running: true
        });


    const system =
        new TimerSystem(
            levelState
        );


    const pauseResult =
        system.pause();


    assert.equal(
        pauseResult.valid,
        true
    );

    assert.equal(
        pauseResult.reason,
        TimerSystem.REASON.TIMER_PAUSED
    );


    const result =
        system.execute(3);


    assert.equal(
        result.valid,
        true
    );

    assert.equal(
        result.executed,
        false
    );

    assert.equal(
        levelState.timer.remainingTime,
        10
    );

    assert.equal(
        levelState.timer.paused,
        true
    );
}


);

/* ============================================================

* 7. REANUDACIÓN
* ============================================================
  */

test(
"TimerSystem: resume reactiva el descuento",
() => {


    const levelState =
        createLevel({
            duration: 10,

            running: true,

            paused: true
        });


    const system =
        new TimerSystem(
            levelState
        );


    const resumeResult =
        system.resume();


    assert.equal(
        resumeResult.valid,
        true
    );

    assert.equal(
        resumeResult.reason,
        TimerSystem.REASON.TIMER_RESUMED
    );


    system.execute(3);


    assert.equal(
        levelState.timer.remainingTime,
        7
    );

    assert.equal(
        levelState.timer.running,
        true
    );

    assert.equal(
        levelState.timer.paused,
        false
    );
}


);

/* ============================================================

* 8. STOP
* ============================================================
  */

test(
"TimerSystem: stop detiene el temporizador sin reiniciarlo",
() => {


    const levelState =
        createLevel({
            duration: 10,

            remainingTime: 6,

            running: true
        });


    const system =
        new TimerSystem(
            levelState
        );


    const result =
        system.stop();


    assert.equal(
        result.valid,
        true
    );

    assert.equal(
        result.reason,
        TimerSystem.REASON.TIMER_STOPPED
    );

    assert.equal(
        levelState.timer.running,
        false
    );

    assert.equal(
        levelState.timer.remainingTime,
        6
    );
}


);

/* ============================================================

* 9. NO CAMBIA GAME PHASE
* ============================================================
  */

test(
"TimerSystem: no cambia GamePhase al expirar",
() => {


    const levelState =
        createLevel(
            {
                duration: 1,

                running: true
            },

            GamePhase.PLAYING
        );


    const system =
        new TimerSystem(
            levelState
        );


    const result =
        system.execute(1);


    assert.equal(
        result.reason,
        TimerSystem.REASON.TIME_EXPIRED
    );

    assert.equal(
        levelState.getPhase(),
        GamePhase.PLAYING
    );
}


);

/* ============================================================

* 10. TIMER NO CONFIGURADO
* ============================================================
  */

test(
"TimerSystem: timer no configurado es rechazado",
() => {


    const levelState =
        createLevel(null);


    const system =
        new TimerSystem(
            levelState
        );


    const result =
        system.execute(1);


    assert.equal(
        result.valid,
        false
    );

    assert.equal(
        result.executed,
        false
    );

    assert.equal(
        result.reason,
        TimerSystem.REASON.TIMER_NOT_CONFIGURED
    );
}


);

/* ============================================================

* 11. ALIAS UPDATE
* ============================================================
  */

test(
"TimerSystem: update es alias de execute",
() => {


    const levelState =
        createLevel({
            duration: 5,

            running: true
        });


    const system =
        new TimerSystem(
            levelState
        );


    const result =
        system.update(1);


    assert.equal(
        result.valid,
        true
    );

    assert.equal(
        result.remainingTime,
        4
    );
}


);

/* ============================================================

* 12. START NO REINICIA
* ============================================================
  */

test(
"TimerSystem: start no reinicia el tiempo restante",
() => {


    const levelState =
        createLevel({
            duration: 10,

            remainingTime: 4
        });


    const system =
        new TimerSystem(
            levelState
        );


    system.start();


    assert.equal(
        levelState.timer.remainingTime,
        4
    );

    assert.equal(
        levelState.timer.running,
        true
    );
}


);
