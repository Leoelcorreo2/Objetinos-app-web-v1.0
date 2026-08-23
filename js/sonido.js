/* ============================================================
   OBJETINOS CONTRARELOJ
   SISTEMA DE SONIDO
   ============================================================ */


/* ============================================================
   ESTADO
   ============================================================ */

const SOUND = {

    enabled: true,

    volume: 0.45,

    context: null

};


/* ============================================================
   INICIALIZAR AUDIO
   ============================================================ */

function initSound() {

    if (
        SOUND.context
    ) {
        return SOUND.context;
    }


    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


    if (!AudioContext) {

        console.warn(
            "Web Audio API no disponible."
        );

        return null;

    }


    SOUND.context =
        new AudioContext();


    return SOUND.context;

}


/* ============================================================
   ACTIVAR AUDIO DESPUÉS DE UNA INTERACCIÓN
   ============================================================ */

function resumeSound() {

    const context =
        initSound();


    if (
        context &&
        context.state === "suspended"
    ) {

        context.resume();

    }

}


/* ============================================================
   ACTIVAR / DESACTIVAR
   ============================================================ */

function setSoundEnabled(
    enabled
) {

    SOUND.enabled =
        Boolean(enabled);


    updateSoundButton();

}


/* ============================================================
   ALTERNAR SONIDO
   ============================================================ */

function toggleSound() {

    SOUND.enabled =
        !SOUND.enabled;


    resumeSound();

    updateSoundButton();


    /*
     * Si se activa, hacemos un pequeño
     * sonido de confirmación.
     */

    if (
        SOUND.enabled
    ) {

        playTone(
            660,
            0.08,
            "sine",
            0.12
        );

    }

}


/* ============================================================
   BOTÓN DE SONIDO
   ============================================================ */

function updateSoundButton() {

    const button =
        document.getElementById(
            "soundToggle"
        );


    if (!button) {
        return;
    }


    button.textContent =
        SOUND.enabled
            ? "🔊"
            : "🔇";


    button.setAttribute(
        "aria-label",
        SOUND.enabled
            ? "Desactivar sonido"
            : "Activar sonido"
    );

}


/* ============================================================
   TONO BÁSICO
   ============================================================ */

function playTone(
    frequency,
    duration = 0.12,
    type = "sine",
    volume = 0.2,
    startDelay = 0
) {

    if (
        !SOUND.enabled
    ) {
        return;
    }


    const context =
        initSound();


    if (!context) {
        return;
    }


    resumeSound();


    const oscillator =
        context.createOscillator();


    const gain =
        context.createGain();


    oscillator.type =
        type;


    oscillator.frequency.value =
        frequency;


    gain.gain.setValueAtTime(
        0,
        context.currentTime +
        startDelay
    );


    gain.gain.linearRampToValueAtTime(
        volume * SOUND.volume,
        context.currentTime +
        startDelay +
        0.01
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime +
        startDelay +
        duration
    );


    oscillator.connect(
        gain
    );


    gain.connect(
        context.destination
    );


    oscillator.start(
        context.currentTime +
        startDelay
    );


    oscillator.stop(
        context.currentTime +
        startDelay +
        duration +
        0.02
    );

}


/* ============================================================
   SONIDO DE TRÍO
   ============================================================ */

function playTripleSound() {

    if (
        !SOUND.enabled
    ) {
        return;
    }


    /*
     * Tres notas ascendentes.
     */

    playTone(
        520,
        0.11,
        "sine",
        0.24,
        0
    );


    playTone(
        660,
        0.11,
        "sine",
        0.24,
        0.07
    );


    playTone(
        820,
        0.16,
        "sine",
        0.28,
        0.14
    );

}


/* ============================================================
   SONIDO DE COMBO
   ============================================================ */

function playComboSound(
    combo
) {

    if (
        !SOUND.enabled
    ) {
        return;
    }


    /*
     * Aumentamos ligeramente el tono
     * según el combo.
     */

    const base =
        Math.min(
            1100,
            650 +
            combo * 55
        );


    playTone(
        base,
        0.12,
        "triangle",
        0.25,
        0
    );


    playTone(
        base * 1.25,
        0.14,
        "triangle",
        0.25,
        0.08
    );


    playTone(
        base * 1.5,
        0.20,
        "triangle",
        0.28,
        0.16
    );

}


/* ============================================================
   SONIDO DE VICTORIA
   ============================================================ */

function playVictorySound() {

    if (
        !SOUND.enabled
    ) {
        return;
    }


    const notes = [

        523.25,

        659.25,

        783.99,

        1046.50

    ];


    notes.forEach(
        (
            frequency,
            index
        ) => {

            playTone(
                frequency,
                0.22,
                "sine",
                0.28,
                index * 0.13
            );

        }
    );


    playTone(
        1318.51,
        0.35,
        "triangle",
        0.24,
        0.52
    );

}


/* ============================================================
   SONIDO DE DERROTA
   ============================================================ */

function playDefeatSound() {

    if (
        !SOUND.enabled
    ) {
        return;
    }


    playTone(
        440,
        0.20,
        "sawtooth",
        0.14,
        0
    );


    playTone(
        349,
        0.24,
        "sawtooth",
        0.14,
        0.16
    );


    playTone(
        261.63,
        0.38,
        "sawtooth",
        0.16,
        0.34
    );

}


/* ============================================================
   SONIDO DE DESBLOQUEO
   ============================================================ */

function playUnlockSound() {

    if (
        !SOUND.enabled
    ) {
        return;
    }


    playTone(
        440,
        0.10,
        "sine",
        0.20,
        0
    );


    playTone(
        660,
        0.12,
        "sine",
        0.22,
        0.08
    );


    playTone(
        880,
        0.20,
        "sine",
        0.25,
        0.16
    );

}


/* ============================================================
   SONIDO DE ERROR
   ============================================================ */

function playErrorSound() {

    if (
        !SOUND.enabled
    ) {
        return;
    }


    playTone(
        180,
        0.13,
        "square",
        0.10,
        0
    );

}


/* ============================================================
   SONIDO DE CUENTA ATRÁS
   ============================================================ */

function playCountdownSound() {

    if (
        !SOUND.enabled
    ) {
        return;
    }


    playTone(
        700,
        0.10,
        "square",
        0.16
    );

}


/* ============================================================
   INSTALAR ACTIVACIÓN DE AUDIO
   ============================================================ */

function installSoundInteraction() {

    const activate =
        () => {

            resumeSound();

        };


    document.addEventListener(
        "pointerdown",
        activate,
        {
            once: true
        }
    );

}