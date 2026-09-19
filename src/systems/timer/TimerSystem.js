/**

* TimerSystem
*
* Gestiona el temporizador del LevelState.
*
* Responsabilidades:
*
* * iniciar;
* * detener;
* * pausar;
* * reanudar;
* * actualizar mediante tiempo real transcurrido;
* * detectar agotamiento.
*
* IMPORTANTE:
*
* TimerSystem NO gestiona vidas.
*
* TimerSystem tampoco cambia GamePhase.
*
* Cuando el tiempo llega a cero produce:
*
* 
  TIME_EXPIRED
  
*
* Ese hecho será posteriormente coordinado por
* GameController para resolver la pérdida de vida.
*
* El tiempo se expresa en segundos.
*
* La actualización utiliza deltaTime real:
*
* 
  remainingTime -= deltaTime
  
*
* No depende del número de frames ni del número de movimientos.
  */

export default class TimerSystem {


static REASON = Object.freeze({

    TIMER_STARTED:
        "TIMER_STARTED",

    TIMER_STOPPED:
        "TIMER_STOPPED",

    TIMER_PAUSED:
        "TIMER_PAUSED",

    TIMER_RESUMED:
        "TIMER_RESUMED",

    TIMER_UPDATED:
        "TIMER_UPDATED",

    TIME_EXPIRED:
        "TIME_EXPIRED",

    INVALID_DELTA_TIME:
        "INVALID_DELTA_TIME",

    TIMER_NOT_CONFIGURED:
        "TIMER_NOT_CONFIGURED"
});


constructor(levelState) {

    if (!levelState) {
        throw new Error(
            "TimerSystem: levelState es obligatorio."
        );
    }


    this.levelState =
        levelState;
}


/**
 * Actualiza el temporizador mediante tiempo real
 * transcurrido.
 *
 * @param {number} deltaTime
 *
 * deltaTime debe ser:
 *
 *     número finito >= 0
 */
execute(deltaTime) {

    /*
     * La validación del deltaTime se realiza antes
     * de acceder o modificar el temporizador.
     */
    if (
        !Number.isFinite(deltaTime) ||
        deltaTime < 0
    ) {

        return {
            valid: false,
            executed: false,

            reason:
                TimerSystem.REASON.INVALID_DELTA_TIME,

            deltaTime
        };
    }


    const timer =
        this.#getValidTimer();


    if (!timer) {

        return {
            valid: false,
            executed: false,

            reason:
                TimerSystem.REASON.TIMER_NOT_CONFIGURED
        };
    }


    /*
     * Si el temporizador está detenido o pausado,
     * no se consume tiempo.
     */
    if (
        timer.running !== true ||
        timer.paused === true
    ) {

        return {
            valid: true,
            executed: false,

            reason:
                TimerSystem.REASON.TIMER_UPDATED,

            remainingTime:
                timer.remainingTime,

            running:
                timer.running,

            paused:
                timer.paused,

            expired:
                timer.remainingTime === 0,

            deltaTime
        };
    }


    const previousTime =
        timer.remainingTime;


    const nextTime =
        Math.max(
            0,
            previousTime - deltaTime
        );


    timer.remainingTime =
        nextTime;


    /*
     * El temporizador se detiene automáticamente
     * cuando llega exactamente a cero.
     */
    if (nextTime === 0) {

        timer.running = false;


        return {
            valid: true,
            executed: true,

            reason:
                TimerSystem.REASON.TIME_EXPIRED,

            previousTime,

            remainingTime: 0,

            running: false,

            paused:
                timer.paused,

            expired: true,

            deltaTime
        };
    }


    return {
        valid: true,
        executed: true,

        reason:
            TimerSystem.REASON.TIMER_UPDATED,

        previousTime,

        remainingTime:
            nextTime,

        running:
            timer.running,

        paused:
            timer.paused,

        expired: false,

        deltaTime
    };
}


/**
 * Inicia el temporizador.
 *
 * IMPORTANTE:
 * start() NO reinicia remainingTime.
 *
 * Para iniciar un nuevo intento debe construirse
 * un nuevo LevelState con su configuración inicial.
 */
start() {

    const timer =
        this.#getValidTimer();


    if (!timer) {

        return {
            valid: false,
            executed: false,

            reason:
                TimerSystem.REASON.TIMER_NOT_CONFIGURED
        };
    }


    timer.running = true;

    timer.paused = false;


    return this.#stateResult(
        TimerSystem.REASON.TIMER_STARTED,
        timer
    );
}


/**
 * Detiene el temporizador sin reiniciarlo.
 */
stop() {

    const timer =
        this.#getValidTimer();


    if (!timer) {

        return {
            valid: false,
            executed: false,

            reason:
                TimerSystem.REASON.TIMER_NOT_CONFIGURED
        };
    }


    timer.running = false;

    timer.paused = false;


    return this.#stateResult(
        TimerSystem.REASON.TIMER_STOPPED,
        timer
    );
}


/**
 * Pausa el temporizador.
 */
pause() {

    const timer =
        this.#getValidTimer();


    if (!timer) {

        return {
            valid: false,
            executed: false,

            reason:
                TimerSystem.REASON.TIMER_NOT_CONFIGURED
        };
    }


    timer.paused = true;


    return this.#stateResult(
        TimerSystem.REASON.TIMER_PAUSED,
        timer
    );
}


/**
 * Reanuda el temporizador.
 */
resume() {

    const timer =
        this.#getValidTimer();


    if (!timer) {

        return {
            valid: false,
            executed: false,

            reason:
                TimerSystem.REASON.TIMER_NOT_CONFIGURED
        };
    }


    timer.running = true;

    timer.paused = false;


    return this.#stateResult(
        TimerSystem.REASON.TIMER_RESUMED,
        timer
    );
}


/**
 * Alias semántico de execute().
 */
update(deltaTime) {

    return this.execute(
        deltaTime
    );
}


/**
 * Determina si el temporizador ha llegado a cero.
 */
isExpired() {

    const timer =
        this.levelState.timer;


    return (
        !!timer &&
        timer.remainingTime === 0
    );
}


/**
 * Obtiene el temporizador si cumple el contrato esperado.
 *
 * El sistema no intenta reparar un timer inválido.
 */
#getValidTimer() {

    const timer =
        this.levelState.timer;


    if (
        !timer ||
        typeof timer !== "object"
    ) {
        return null;
    }


    if (
        !Number.isFinite(timer.duration) ||
        timer.duration < 0
    ) {
        return null;
    }


    if (
        !Number.isFinite(timer.remainingTime) ||
        timer.remainingTime < 0 ||
        timer.remainingTime > timer.duration
    ) {
        return null;
    }


    if (
        typeof timer.running !== "boolean" ||
        typeof timer.paused !== "boolean"
    ) {
        return null;
    }


    return timer;
}


/**
 * Construye un resultado para operaciones de estado.
 */
#stateResult(
    reason,
    timer
) {

    return {
        valid: true,
        executed: true,

        reason,

        remainingTime:
            timer.remainingTime,

        running:
            timer.running,

        paused:
            timer.paused,

        expired:
            timer.remainingTime === 0
    };
}


}
