/* ============================================================
   OBJETINOS CONTRARELOJ
   JUEGO
   V1.4.1
   ============================================================ */


/* ============================================================
   TIMER
   ============================================================ */

let gameTimer = null;


/* ============================================================
   INICIAR JUEGO
   ============================================================ */

function startGame() {

    stopTimer();


    const level =
        GAME_MODEL.level || 1;


    try {

        const config =
            generateLevel(
                level
            );


        GAME_MODEL.running =
            true;


        GAME_MODEL.gameOver =
            false;


        GAME_MODEL.remainingTime =
            config.tiempo;


        updateInterface();


        startTimer();


        /*
         * IMPORTANTE:
         *
         * La interacción se inicializa
         * una sola vez.
         */

    }

    catch (error) {

        console.error(
            "ERROR GENERANDO NIVEL:",
            error
        );


        alert(
            "Error al generar el nivel. " +
            "Mira la consola del navegador."
        );

    }

}


/* ============================================================
   TIMER
   ============================================================ */

function startTimer() {

    stopTimer();


    gameTimer =
        setInterval(
            () => {

                if (
                    !GAME_MODEL.running
                ) {

                    return;

                }


                GAME_MODEL.remainingTime--;


                updateInterface();


                if (
                    GAME_MODEL.remainingTime <= 0
                ) {

                    GAME_MODEL.remainingTime =
                        0;


                    timeOutLevel();

                }

            },

            1000
        );

}


/* ============================================================
   PARAR TIMER
   ============================================================ */

function stopTimer() {

    if (
        gameTimer
    ) {

        clearInterval(
            gameTimer
        );

        gameTimer = null;

    }

}


/* ============================================================
   TIEMPO AGOTADO
   ============================================================ */

function timeOutLevel() {

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


    if (
        typeof playDefeatSound ===
        "function"
    ) {

        playDefeatSound();

    }


    const modal =
        document.getElementById(
            "levelTimeoutTip"
        );


    if (
        modal
    ) {

        modal.classList.add(
            "show"
        );

    }

}


/* ============================================================
   NIVEL COMPLETADO
   ============================================================ */

function levelCompleted() {

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


    if (
        typeof playVictorySound ===
        "function"
    ) {

        playVictorySound();

    }


    GAME_MODEL.level++;


    updateInterface();


    setTimeout(
        () => {

            GAME_MODEL.gameOver =
                false;


            startGame();

        },

        900
    );

}


/* ============================================================
   REINTENTAR NIVEL
   ============================================================ */

function retryCurrentLevel() {

    const modal =
        document.getElementById(
            "levelTimeoutTip"
        );


    if (
        modal
    ) {

        modal.classList.remove(
            "show"
        );

    }


    GAME_MODEL.gameOver =
        false;


    GAME_MODEL.running =
        false;


    startGame();

}


/* ============================================================
   SALIR
   ============================================================ */

function exitGame() {

    stopTimer();


    GAME_MODEL.running =
        false;


    GAME_MODEL.gameOver =
        true;


    const modal =
        document.getElementById(
            "levelTimeoutTip"
        );


    if (
        modal
    ) {

        modal.classList.remove(
            "show"
        );

    }

}


/* ============================================================
   BOTONES
   ============================================================ */

function initGameButtons() {

    const retry =
        document.getElementById(
            "retryLevelBtn"
        );


    if (retry) {

        retry.addEventListener(
            "click",
            retryCurrentLevel
        );

    }


    const exit =
        document.getElementById(
            "exitLevelBtn"
        );


    if (exit) {

        exit.addEventListener(
            "click",
            exitGame
        );

    }

}


/* ============================================================
   ARRANQUE
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initInteraction();

        initGameButtons();


        /*
         * Primer nivel.
         */

        GAME_MODEL.level = 1;


        startGame();

    }
);