/* ============================================================
   OBJETINOS CONTRARELOJ
   INTERFAZ
   ============================================================ */


/* ============================================================
   ACTUALIZAR INTERFAZ
   ============================================================ */

function updateInterface() {

    const score =
        document.getElementById(
            "score"
        );


    const coins =
        document.getElementById(
            "coins"
        );


    const level =
        document.getElementById(
            "level"
        );


    const timer =
        document.getElementById(
            "timer"
        );


    if (score) {

        score.textContent =
            GAME_MODEL.score;
    }


    if (coins) {

        coins.textContent =
            GAME_MODEL.coins;
    }


    if (level) {

        level.textContent =
            GAME_MODEL.level;
    }


    if (timer) {

        timer.textContent =
            `${Math.max(
                0,
                GAME_MODEL.remainingTime
            )}s`;
    }
}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            1800
        );
}


/* ============================================================
   PANTALLA INICIAL
   ============================================================ */

function showHomeScreen() {

    const screen =
        document.getElementById(
            "homeScreen"
        );


    if (!screen) {

        return;
    }


    screen.style.display =
        "block";


    const text =
        document.getElementById(
            "homeText"
        );


    if (text) {

        text.innerHTML = `
            Junta los objetos iguales
            de tres en tres.<br><br>
            Completa todos los tríos
            antes de que se acabe el tiempo.
        `;
    }


    const buttons =
        document.getElementById(
            "homeButtons"
        );


    if (buttons) {

        buttons.innerHTML = `
            <button id="startGameButton">
                ▶ Comenzar
            </button>
        `;


        document
            .getElementById(
                "startGameButton"
            )
            .addEventListener(
                "click",
                () => {

                    screen.style.display =
                        "none";

                    startGame();
                }
            );
    }
}


/* ============================================================
   OCULTAR INICIO
   ============================================================ */

function hideHomeScreen() {

    const screen =
        document.getElementById(
            "homeScreen"
        );


    if (screen) {

        screen.style.display =
            "none";
    }
}


/* ============================================================
   TIEMPO AGOTADO
   ============================================================ */

function showTimeoutScreen() {

    const screen =
        document.getElementById(
            "levelTimeoutTip"
        );


    if (!screen) {

        return;
    }


    screen.classList.add(
        "show"
    );


    const retry =
        document.getElementById(
            "retryLevelBtn"
        );


    const exit =
        document.getElementById(
            "exitLevelBtn"
        );


    if (retry) {

        retry.onclick =
            () => {

                screen.classList.remove(
                    "show"
                );

                restartLevel();
            };
    }


    if (exit) {

        exit.onclick =
            () => {

                screen.classList.remove(
                    "show"
                );

                showHomeScreen();
            };
    }
}


/* ============================================================
   OCULTAR TIMEOUT
   ============================================================ */

function hideTimeoutScreen() {

    const screen =
        document.getElementById(
            "levelTimeoutTip"
        );


    if (screen) {

        screen.classList.remove(
            "show"
        );
    }
}


/* ============================================================
   VICTORIA
   ============================================================ */

function showVictory() {

    showToast(
        "🎉 ¡Nivel completado!"
    );


    playVictorySound();
}


/* ============================================================
   DERROTA
   ============================================================ */

function showDefeat() {

    showTimeoutScreen();

    playDefeatSound();
}


/* ============================================================
   TUTORIAL
   ============================================================ */

function showTutorial() {

    const tutorial =
        document.getElementById(
            "tutorialTip"
        );


    if (!tutorial) {

        return;
    }


    tutorial.classList.add(
        "show"
    );


    setTimeout(
        () => {

            tutorial.classList.remove(
                "show"
            );

        },
        CONFIG.TIEMPO_TUTORIAL
    );
}