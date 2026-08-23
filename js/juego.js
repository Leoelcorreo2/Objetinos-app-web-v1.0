/* ============================================================
   OBJETINOS CONTRARELOJ
   MOTOR PRINCIPAL
   ============================================================ */

let gameTimer = null;


/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initInteraction();

        updateInterface();

        showHomeScreen();

    }
);


/* ============================================================
   COMENZAR JUEGO
   ============================================================ */

function startGame() {

    hideHomeScreen();

    GAME_MODEL.level = 1;

    GAME_MODEL.score = 0;

    GAME_MODEL.coins = 0;

    GAME_MODEL.running = true;

    GAME_MODEL.gameOver = false;


    if (
        !generateLevel(
            GAME_MODEL.level
        )
    ) {

        console.error(
            "No se pudo generar el nivel."
        );

        GAME_MODEL.running =
            false;

        return;
    }


    updateInterface();


    startTimer();


    setTimeout(
        () => {

            showTutorial();

        },
        500
    );
}


/* ============================================================
   TEMPORIZADOR
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

                    loseLevel();
                }

            },
            1000
        );
}


/* ============================================================
   PARAR TEMPORIZADOR
   ============================================================ */

function stopTimer() {

    if (
        gameTimer
    ) {

        clearInterval(
            gameTimer
        );

        gameTimer =
            null;
    }
}


/* ============================================================
   REINICIAR NIVEL
   ============================================================ */

function restartLevel() {

    stopTimer();


    GAME_MODEL.running =
        true;


    GAME_MODEL.gameOver =
        false;


    if (
        !generateLevel(
            GAME_MODEL.level
        )
    ) {

        console.error(
            "No se pudo regenerar el nivel."
        );

        return;
    }


    updateInterface();


    startTimer();
}


/* ============================================================
   NIVEL COMPLETADO
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


    showVictory();


    /*
     * Siguiente nivel después
     * de una pequeña pausa.
     */

    setTimeout(
        () => {

            nextLevel();

        },
        1600
    );
}


/* ============================================================
   SIGUIENTE NIVEL
   ============================================================ */

function nextLevel() {

    GAME_MODEL.level++;


    GAME_MODEL.gameOver =
        false;


    GAME_MODEL.running =
        true;


    if (
        !generateLevel(
            GAME_MODEL.level
        )
    ) {

        /*
         * Si todavía no existe configuración
         * para ese nivel, volvemos al último
         * nivel disponible.
         */

        GAME_MODEL.level =
            CONFIG_NIVELES[
                CONFIG_NIVELES.length - 1
            ].nivel;


        generateLevel(
            GAME_MODEL.level
        );
    }


    updateInterface();


    startTimer();
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


    showDefeat();
}


/* ============================================================
   VICTORIA / DERROTA PÚBLICAS
   ============================================================ */

window.startGame =
    startGame;


window.restartLevel =
    restartLevel;


window.winLevel =
    winLevel;


window.loseLevel =
    loseLevel;