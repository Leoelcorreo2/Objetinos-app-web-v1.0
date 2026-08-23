/* ============================================================
   OBJETINOS CONTRARELOJ
   INTERFAZ DE USUARIO
   ============================================================ */


/* ============================================================
   REFERENCIAS DOM
   ============================================================ */

const UI = {

    score:
        () =>
            document.getElementById(
                "score"
            ),

    coins:
        () =>
            document.getElementById(
                "coins"
            ),

    level:
        () =>
            document.getElementById(
                "level"
            ),

    timer:
        () =>
            document.getElementById(
                "timer"
            ),

    hint:
        () =>
            document.getElementById(
                "hint"
            ),

    homeScreen:
        () =>
            document.getElementById(
                "homeScreen"
            ),

    homeText:
        () =>
            document.getElementById(
                "homeText"
            ),

    homeButtons:
        () =>
            document.getElementById(
                "homeButtons"
            ),

    timeout:
        () =>
            document.getElementById(
                "levelTimeoutTip"
            ),

    tutorial:
        () =>
            document.getElementById(
                "tutorialTip"
            )

};


/* ============================================================
   ACTUALIZAR MARCADOR
   ============================================================ */

function updateScoreUI() {

    const element =
        UI.score();


    if (!element) {
        return;
    }


    element.textContent =
        GAME_MODEL.score;

}


/* ============================================================
   ACTUALIZAR MONEDAS
   ============================================================ */

function updateCoinsUI() {

    const element =
        UI.coins();


    if (!element) {
        return;
    }


    element.textContent =
        GAME_MODEL.coins;

}


/* ============================================================
   ACTUALIZAR NIVEL
   ============================================================ */

function updateLevelUI() {

    const element =
        UI.level();


    if (!element) {
        return;
    }


    element.textContent =
        GAME_MODEL.level;

}


/* ============================================================
   ACTUALIZAR TIEMPO
   ============================================================ */

function updateTimerUI(
    seconds =
        GAME_MODEL.remainingTime
) {

    const element =
        UI.timer();


    if (!element) {
        return;
    }


    seconds =
        Math.max(
            0,
            Math.ceil(
                seconds
            )
        );


    element.textContent =
        `${seconds}s`;


    /*
     * Cambiamos visualmente
     * cuando queda poco tiempo.
     */

    element.classList.remove(
        "warning",
        "danger"
    );


    if (
        seconds <= 5
    ) {

        element.classList.add(
            "danger"
        );

    }

    else if (
        seconds <= 10
    ) {

        element.classList.add(
            "warning"
        );

    }

}


/* ============================================================
   ACTUALIZAR TODA LA INTERFAZ
   ============================================================ */

function updateUI() {

    updateScoreUI();

    updateCoinsUI();

    updateLevelUI();

    updateTimerUI();

    updateSoundButton();

}


/* ============================================================
   MOSTRAR PANTALLA INICIAL
   ============================================================ */

function showHomeScreen(
    message = ""
) {

    const screen =
        UI.homeScreen();


    if (!screen) {
        return;
    }


    const text =
        UI.homeText();


    const buttons =
        UI.homeButtons();


    if (text) {

        text.innerHTML =
            message;

    }


    if (buttons) {

        buttons.innerHTML =
            "";

    }


    screen.style.display =
        "block";

}


/* ============================================================
   OCULTAR PANTALLA INICIAL
   ============================================================ */

function hideHomeScreen() {

    const screen =
        UI.homeScreen();


    if (screen) {

        screen.style.display =
            "none";

    }

}


/* ============================================================
   CREAR BOTÓN
   ============================================================ */

function createUIButton(
    text,
    onClick,
    className = ""
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.textContent =
        text;


    if (className) {

        button.className =
            className;

    }


    button.addEventListener(
        "click",
        () => {

            resumeSound();

            onClick();

        }
    );


    return button;

}


/* ============================================================
   PANTALLA DE INICIO DEL NIVEL
   ============================================================ */

function showLevelStart(
    levelConfig
) {

    const screen =
        UI.homeScreen();


    const text =
        UI.homeText();


    const buttons =
        UI.homeButtons();


    if (
        !screen ||
        !text ||
        !buttons
    ) {
        return;
    }


    const escenario =
        ESCENARIOS[
            levelConfig.escenario ||
            "supermarket"
        ];


    const nombreEscenario =
        escenario
            ? escenario.nombre
            : "Supermercado";


    text.innerHTML = `

        <div style="
            font-size:42px;
            margin-bottom:8px;
        ">
            ${escenario?.emoji || "🛒"}
        </div>

        <div style="
            font-size:20px;
            font-weight:900;
        ">
            Nivel ${levelConfig.nivel}
        </div>

        <div style="
            margin-top:6px;
        ">
            ${nombreEscenario}
        </div>

        <div style="
            margin-top:10px;
            font-size:13px;
            opacity:.75;
        ">
            ${levelConfig.estantes}
            estantes ·
            ${levelConfig.capas}
            ${levelConfig.capas === 1
                ? "capa"
                : "capas"}
        </div>

    `;


    buttons.innerHTML =
        "";


    const startButton =
        createUIButton(
            "▶️ Jugar",
            () => {

                hideHomeScreen();


                if (
                    typeof startCurrentLevel ===
                    "function"
                ) {

                    startCurrentLevel();

                }

            }
        );


    buttons.appendChild(
        startButton
    );


    screen.style.display =
        "block";

}


/* ============================================================
   PANTALLA DE VICTORIA
   ============================================================ */

function showVictoryScreen() {

    const screen =
        UI.homeScreen();


    const text =
        UI.homeText();


    const buttons =
        UI.homeButtons();


    if (
        !screen ||
        !text ||
        !buttons
    ) {
        return;
    }


    text.innerHTML = `

        <div style="
            font-size:48px;
        ">
            🎉
        </div>

        <div style="
            font-size:24px;
            font-weight:950;
            margin-top:5px;
        ">
            ¡Nivel superado!
        </div>

        <div style="
            margin-top:10px;
        ">
            Puntuación:
            <b>${GAME_MODEL.score}</b>
        </div>

        <div>
            Monedas:
            <b>${GAME_MODEL.coins}</b>
            🪙
        </div>

    `;


    buttons.innerHTML =
        "";


    const nextButton =
        createUIButton(
            "➡️ Siguiente nivel",
            () => {

                hideHomeScreen();


                if (
                    typeof nextLevel ===
                    "function"
                ) {

                    nextLevel();

                }

            }
        );


    buttons.appendChild(
        nextButton
    );


    screen.style.display =
        "block";

}


/* ============================================================
   PANTALLA DE DERROTA
   ============================================================ */

function showDefeatScreen() {

    const screen =
        UI.homeScreen();


    const text =
        UI.homeText();


    const buttons =
        UI.homeButtons();


    if (
        !screen ||
        !text ||
        !buttons
    ) {
        return;
    }


    text.innerHTML = `

        <div style="
            font-size:48px;
        ">
            ⏱️
        </div>

        <div style="
            font-size:23px;
            font-weight:950;
            margin-top:5px;
        ">
            Tiempo agotado
        </div>

        <div style="
            margin-top:10px;
        ">
            No has superado el nivel.
        </div>

    `;


    buttons.innerHTML =
        "";


    const retryButton =
        createUIButton(
            "🔄 Reintentar",
            () => {

                hideHomeScreen();


                if (
                    typeof restartCurrentLevel ===
                    "function"
                ) {

                    restartCurrentLevel();

                }

            }
        );


    const exitButton =
        createUIButton(
            "🚪 Salir",
            () => {

                hideHomeScreen();


                if (
                    typeof exitGame ===
                    "function"
                ) {

                    exitGame();

                }

            },
            "secondaryBtn"
        );


    buttons.appendChild(
        retryButton
    );


    buttons.appendChild(
        exitButton
    );


    screen.style.display =
        "block";

}


/* ============================================================
   MODAL DE TIEMPO AGOTADO
   ============================================================ */

function showTimeoutTip() {

    const tip =
        UI.timeout();


    if (!tip) {
        return;
    }


    tip.classList.add(
        "show"
    );

}


/* ============================================================
   OCULTAR MODAL DE TIEMPO
   ============================================================ */

function hideTimeoutTip() {

    const tip =
        UI.timeout();


    if (tip) {

        tip.classList.remove(
            "show"
        );

    }

}


/* ============================================================
   TUTORIAL
   ============================================================ */

function showTutorial() {

    const tutorial =
        UI.tutorial();


    if (!tutorial) {
        return;
    }


    tutorial.classList.add(
        "show"
    );

}


/* ============================================================
   OCULTAR TUTORIAL
   ============================================================ */

function hideTutorial() {

    const tutorial =
        UI.tutorial();


    if (tutorial) {

        tutorial.classList.remove(
            "show"
        );

    }

}


/* ============================================================
   ACTUALIZAR HINT
   ============================================================ */

function setHint(
    message
) {

    const element =
        UI.hint();


    if (!element) {
        return;
    }


    element.textContent =
        message || "";

}


/* ============================================================
   TEMA DEL ESCENARIO
   ============================================================ */

function setScenarioTheme(
    scenario
) {

    if (!scenario) {

        scenario =
            "supermarket";

    }


    document.body.dataset.theme =
        scenario;

}


/* ============================================================
   CREAR ELEMENTOS VISUALES DE BLOQUEO
   ============================================================ */

function renderLockedShelf(
    compartment
) {

    if (
        !compartment ||
        !compartment.element
    ) {
        return;
    }


    const element =
        compartment.element;


    /*
     * Primero eliminamos cualquier
     * elemento anterior.
     */

    const oldChain =
        element.querySelector(
            ".shelfChains"
        );


    if (oldChain) {

        oldChain.remove();

    }


    const oldBadge =
        element.querySelector(
            ".lockBadge"
        );


    if (oldBadge) {

        oldBadge.remove();

    }


    if (
        !compartment.locked
    ) {
        return;
    }


    /*
     * Cadenas.
     */

    const chains =
        document.createElement(
            "div"
        );


    chains.className =
        "shelfChains";


    element.appendChild(
        chains
    );


    /*
     * Candado.

     */

    const badge =
        document.createElement(
            "div"
        );


    badge.className =
        "lockBadge";


    badge.innerHTML = `

        🔒

        <small>
            Bloqueado
        </small>

    `;


    element.appendChild(
        badge
    );

}


/* ============================================================
   ACTUALIZAR BLOQUEO DE TODOS LOS ESTANTES
   ============================================================ */

function updateLockedShelvesUI() {

    GAME_MODEL
        .compartments
        .forEach(
            compartment => {

                if (
                    compartment.locked
                ) {

                    renderLockedShelf(
                        compartment
                    );

                }

                else {

                    const element =
                        compartment.element;


                    if (!element) {
                        return;
                    }


                    const chains =
                        element.querySelector(
                            ".shelfChains"
                        );


                    const badge =
                        element.querySelector(
                            ".lockBadge"
                        );


                    if (chains) {

                        chains.remove();

                    }


                    if (badge) {

                        badge.remove();

                    }

                }

            }
        );

}


/* ============================================================
   ACTUALIZAR CAPAS VISUALES
   ============================================================ */

function refreshBoardUI() {

    updateLockedShelvesUI();

    updateAllObjectStates();

    renderAllObjects();

}


/* ============================================================
   BOTÓN DE SONIDO
   ============================================================ */

function createSoundButton() {

    /*
     * Si ya existe, no lo creamos otra vez.
     */

    if (
        document.getElementById(
            "soundToggle"
        )
    ) {

        updateSoundButton();

        return;

    }


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "soundToggle";


    button.type =
        "button";


    button.className =
        "soundToggle";


    button.textContent =
        SOUND.enabled
            ? "🔊"
            : "🔇";


    button.addEventListener(
        "click",
        () => {

            toggleSound();

        }
    );


    /*
     * Lo colocamos dentro de la cabecera.
     */

    const header =
        document.querySelector(
            "header"
        );


    if (header) {

        header.appendChild(
            button
        );

    }

}


/* ============================================================
   EVENTOS DE INTERFAZ
   ============================================================ */

function initInterface() {

    createSoundButton();

    updateUI();

    hideTimeoutTip();

    hideTutorial();


    /*
     * Botones de la pantalla de
     * tiempo agotado definidos
     * originalmente en index.html.
     */

    const retry =
        document.getElementById(
            "retryLevelBtn"
        );


    if (retry) {

        retry.addEventListener(
            "click",
            () => {

                hideTimeoutTip();


                if (
                    typeof restartCurrentLevel ===
                    "function"
                ) {

                    restartCurrentLevel();

                }

            }
        );

    }


    const exit =
        document.getElementById(
            "exitLevelBtn"
        );


    if (exit) {

        exit.addEventListener(
            "click",
            () => {

                hideTimeoutTip();


                if (
                    typeof exitGame ===
                    "function"
                ) {

                    exitGame();

                }

            }
        );

    }


    /*
     * Cualquier interacción del usuario
     * puede cerrar el tutorial.
     */

    document.addEventListener(
        "pointerdown",
        () => {

            hideTutorial();

        },
        {
            passive: true
        }
    );

}


/* ============================================================
   ACTUALIZACIÓN DEL TEMPORIZADOR
   ============================================================ */

function updateTimer(
    seconds
) {

    GAME_MODEL.remainingTime =
        seconds;


    updateTimerUI(
        seconds
    );

}


/* ============================================================
   ACTUALIZACIÓN DEL MARCADOR TRAS UN TRÍO
   ============================================================ */

function updateAfterTriple(
    combo,
    reward
) {

    updateScoreUI();

    updateCoinsUI();


    if (
        combo >= 2
    ) {

        showCombo(
            combo,
            reward
        );

    }

}


/* ============================================================
   CAMBIO DE NIVEL
   ============================================================ */

function updateLevel(
    level
) {

    GAME_MODEL.level =
        level;


    updateLevelUI();

}


/* ============================================================
   APLICAR TEMA Y ACTUALIZAR TABLERO
   ============================================================ */

function applyScenario(
    scenario
) {

    setScenarioTheme(
        scenario
    );

}


/* ============================================================
   INICIALIZACIÓN AUTOMÁTICA DE LA INTERFAZ
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initInterface();

        installSoundInteraction();

    }
);