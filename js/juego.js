/* ============================================================
   OBJETINOS CONTRARELOJ
   MOTOR PRINCIPAL DEL JUEGO
   ============================================================ */


/* ============================================================
   ESTADO DEL MOTOR
   ============================================================ */

const GAME_STATE = {

    timerInterval: null,

    lastTick: 0,

    currentLevelConfig: null,

    initialized: false

};


/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

function initGame() {

    if (
        GAME_STATE.initialized
    ) {
        return;
    }


    GAME_STATE.initialized =
        true;


    /*
     * Nivel guardado.
     */

    const savedLevel =
        loadSavedLevel();


    GAME_MODEL.level =
        savedLevel;


    /*
     * Preparamos el nivel.
     */

    const config =
        prepareLevel(
            savedLevel
        );


    GAME_STATE.currentLevelConfig =
        config;


    /*
     * Pantalla inicial.
     */

    showLevelStart(
        config
    );


    updateUI();

}


/* ============================================================
   CARGAR NIVEL GUARDADO
   ============================================================ */

function loadSavedLevel() {

    try {

        const saved =
            localStorage.getItem(
                "objetinos_level"
            );


        if (!saved) {

            return 1;

        }


        const level =
            parseInt(
                saved,
                10
            );


        if (
            !Number.isFinite(level) ||
            level < 1
        ) {

            return 1;

        }


        return level;

    }

    catch (error) {

        return 1;

    }

}


/* ============================================================
   GUARDAR NIVEL
   ============================================================ */

function saveCurrentLevel() {

    try {

        localStorage.setItem(
            "objetinos_level",
            String(
                GAME_MODEL.level
            )
        );

    }

    catch (error) {

        console.warn(
            "No se pudo guardar el nivel.",
            error
        );

    }

}


/* ============================================================
   GUARDAR MONEDAS Y PUNTUACIÓN
   ============================================================ */

function saveProgress() {

    try {

        localStorage.setItem(
            "objetinos_coins",
            String(
                GAME_MODEL.coins
            )
        );


        localStorage.setItem(
            "objetinos_score",
            String(
                GAME_MODEL.score
            )
        );

    }

    catch (error) {

        console.warn(
            "No se pudo guardar el progreso.",
            error
        );

    }

}


/* ============================================================
   CARGAR PROGRESO
   ============================================================ */

function loadProgress() {

    try {

        const coins =
            parseInt(
                localStorage.getItem(
                    "objetinos_coins"
                ),
                10
            );


        const score =
            parseInt(
                localStorage.getItem(
                    "objetinos_score"
                ),
                10
            );


        if (
            Number.isFinite(coins)
        ) {

            GAME_MODEL.coins =
                Math.max(
                    0,
                    coins
                );

        }


        if (
            Number.isFinite(score)
        ) {

            GAME_MODEL.score =
                Math.max(
                    0,
                    score
                );

        }

    }

    catch (error) {

        console.warn(
            "No se pudo cargar el progreso.",
            error
        );

    }

}


/* ============================================================
   COMENZAR NIVEL ACTUAL
   ============================================================ */

function startCurrentLevel() {

    hideHomeScreen();

    hideTimeoutTip();


    /*
     * El nivel debe estar preparado
     * antes de comenzar el reloj.
     */

    if (
        !GAME_STATE.currentLevelConfig
    ) {

        GAME_STATE.currentLevelConfig =
            prepareLevel(
                GAME_MODEL.level
            );

    }


    GAME_MODEL.running =
        true;


    GAME_MODEL.gameOver =
        false;


    GAME_STATE.lastTick =
        performance.now();


    startTimer();


    /*
     * Tutorial únicamente para el primer nivel.
     */

    if (
        GAME_MODEL.level === 1
    ) {

        setTimeout(
            () => {

                if (
                    GAME_MODEL.running
                ) {

                    showTutorial();

                }

            },
            CONFIG.TIEMPO_TUTORIAL
        );

    }


    setHint(
        "Junta 3 objetos iguales para eliminarlos."
    );


    updateUI();

}


/* ============================================================
   INICIAR TEMPORIZADOR
   ============================================================ */

function startTimer() {

    stopTimer();


    GAME_STATE.lastTick =
        performance.now();


    GAME_STATE.timerInterval =
        setInterval(
            timerTick,
            100
        );

}


/* ============================================================
   DETENER TEMPORIZADOR
   ============================================================ */

function stopTimer() {

    if (
        GAME_STATE.timerInterval
    ) {

        clearInterval(
            GAME_STATE.timerInterval
        );


        GAME_STATE.timerInterval =
            null;

    }

}


/* ============================================================
   TICK DEL TEMPORIZADOR
   ============================================================ */

function timerTick() {

    if (
        !GAME_MODEL.running
    ) {
        return;
    }


    if (
        GAME_MODEL.gameOver
    ) {
        return;
    }


    const now =
        performance.now();


    const elapsed =
        (
            now -
            GAME_STATE.lastTick
        ) / 1000;


    GAME_STATE.lastTick =
        now;


    GAME_MODEL.remainingTime -=
        elapsed;


    updateTimerUI(
        GAME_MODEL.remainingTime
    );


    /*
     * Cuenta atrás sonora.
     */

    const remaining =
        Math.ceil(
            GAME_MODEL.remainingTime
        );


    if (
        remaining <= 5 &&
        remaining > 0 &&
        Math.abs(
            GAME_MODEL.remainingTime -
            remaining
        ) < 0.11
    ) {

        playCountdownSound();

    }


    /*
     * Tiempo agotado.
     */

    if (
        GAME_MODEL.remainingTime <= 0
    ) {

        GAME_MODEL.remainingTime =
            0;


        loseLevel();

    }

}


/* ============================================================
   VICTORIA
   ============================================================ */

function winLevel() {

    if (
        GAME_MODEL.gameOver
    ) {
        return;
    }


    GAME_MODEL.gameOver =
        true;


    GAME_MODEL.running =
        false;


    stopTimer();


    hideTutorial();


    /*
     * Guardamos el progreso.
     *
     * IMPORTANTE:
     * guardamos el nivel siguiente,
     * no el actual.
     */

    const next =
        GAME_MODEL.level + 1;


    try {

        localStorage.setItem(
            "objetinos_level",
            String(next)
        );

    }

    catch (error) {

        console.warn(
            "No se pudo guardar el siguiente nivel.",
            error
        );

    }


    /*
     * Sonido.
     */

    playVictorySound();


    /*
     * Efectos.

     */

    victoryEffect();


    /*
     * Pequeño mensaje.

     */

    setHint(
        "🎉 ¡Nivel superado!"
    );


    /*
     * Mostrar pantalla.
     */

    setTimeout(
        () => {

            showVictoryScreen();

        },
        700
    );

}


/* ============================================================
   DERROTA
   ============================================================ */

function loseLevel() {

    if (
        GAME_MODEL.gameOver
    ) {
        return;
    }


    GAME_MODEL.gameOver =
        true;


    GAME_MODEL.running =
        false;


    stopTimer();


    hideTutorial();


    playDefeatSound();


    setHint(
        "⏱️ Tiempo agotado."
    );


    /*
     * Mostrar modal.

     */

    showTimeoutTip();


    /*
     * También dejamos preparada
     * la pantalla de derrota.
     */

    setTimeout(
        () => {

            hideTimeoutTip();

            showDefeatScreen();

        },
        1200
    );

}


/* ============================================================
   REINICIAR NIVEL
   ============================================================ */

function restartCurrentLevel() {

    stopTimer();

    hideHomeScreen();

    hideTimeoutTip();

    hideTutorial();


    /*
     * Volvemos a generar el nivel.
     *
     * Esto es importante:
     * no reutilizamos los objetos anteriores.
     */

    const config =
        prepareLevel(
            GAME_MODEL.level
        );


    GAME_STATE.currentLevelConfig =
        config;


    GAME_MODEL.remainingTime =
        config.tiempo;


    updateUI();


    /*
     * Comenzamos directamente.

     */

    startCurrentLevel();

}


/* ============================================================
   SIGUIENTE NIVEL
   ============================================================ */

function nextLevel() {

    stopTimer();

    hideHomeScreen();

    hideTutorial();


    const newLevel =
        GAME_MODEL.level + 1;


    GAME_MODEL.level =
        newLevel;


    /*
     * Guardamos inmediatamente.
     */

    saveCurrentLevel();


    /*
     * Generamos el nuevo nivel.

     */

    const config =
        prepareLevel(
            newLevel
        );


    GAME_STATE.currentLevelConfig =
        config;


    /*
     * Mostramos pantalla de inicio
     * del nuevo nivel.

     */

    showLevelStart(
        config
    );

}


/* ============================================================
   SALIR DEL NIVEL
   ============================================================ */

function exitGame() {

    stopTimer();


    GAME_MODEL.running =
        false;


    GAME_MODEL.gameOver =
        true;


    hideTimeoutTip();

    hideTutorial();


    setHint(
        "Nivel detenido."
    );


    /*
     * Regresamos a la pantalla
     * de inicio del nivel actual.
     */

    showLevelStart(
        GAME_STATE.currentLevelConfig ||
        getLevelConfig(
            GAME_MODEL.level
        )
    );

}


/* ============================================================
   REINICIAR PARTIDA COMPLETA
   ============================================================ */

function resetEntireGame() {

    stopTimer();


    try {

        localStorage.removeItem(
            "objetinos_level"
        );


        localStorage.removeItem(
            "objetinos_coins"
        );


        localStorage.removeItem(
            "objetinos_score"
        );

    }

    catch (error) {

        console.warn(
            "No se pudo limpiar el progreso.",
            error
        );

    }


    GAME_MODEL.level =
        1;


    GAME_MODEL.score =
        0;


    GAME_MODEL.coins =
        0;


    GAME_MODEL.remainingTime =
        CONFIG.TIEMPO_INICIAL;


    GAME_MODEL.running =
        false;


    GAME_MODEL.gameOver =
        false;


    GAME_STATE.currentLevelConfig =
        prepareLevel(
            1
        );


    updateUI();


    showLevelStart(
        GAME_STATE.currentLevelConfig
    );

}


/* ============================================================
   GUARDAR PROGRESO AL SALIR
   ============================================================ */

window.addEventListener(
    "beforeunload",
    () => {

        saveCurrentLevel();

        saveProgress();

    }
);


/* ============================================================
   INICIO DEL JUEGO
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProgress();

        initGame();

    }
);