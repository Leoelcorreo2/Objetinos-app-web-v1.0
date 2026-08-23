/* ============================================================
   OBJETINOS CONTRARELOJ
   SONIDO
   ============================================================ */

let audioContext = null;


/* ============================================================
   CREAR CONTEXTO
   ============================================================ */

function getAudioContext() {

    if (
        !audioContext
    ) {

        const AudioCtx =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioCtx) {

            return null;
        }


        audioContext =
            new AudioCtx();
    }


    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();
    }


    return audioContext;
}


/* ============================================================
   TONO
   ============================================================ */

function playTone(
    frequency,
    duration,
    type = "sine",
    volume = 0.05
) {

    const ctx =
        getAudioContext();


    if (!ctx) {

        return;
    }


    const oscillator =
        ctx.createOscillator();


    const gain =
        ctx.createGain();


    oscillator.type =
        type;


    oscillator.frequency.value =
        frequency;


    gain.gain.setValueAtTime(
        volume,
        ctx.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime +
            duration
    );


    oscillator.connect(
        gain
    );


    gain.connect(
        ctx.destination
    );


    oscillator.start();


    oscillator.stop(
        ctx.currentTime +
        duration
    );
}


/* ============================================================
   TRÍO
   ============================================================ */

function playTripleSound() {

    if (
        !CONFIG.SONIDO_TRIO
    ) {

        return;
    }


    playTone(
        520,
        .10,
        "sine",
        .06
    );


    setTimeout(
        () =>
            playTone(
                700,
                .14,
                "sine",
                .05
            ),
        70
    );
}


/* ============================================================
   COMBO
   ============================================================ */

function playComboSound(
    combo
) {

    if (
        !CONFIG.SONIDO_COMBO
    ) {

        return;
    }


    const base =
        500 +
        Math.min(
            combo,
            8
        ) * 70;


    playTone(
        base,
        .10,
        "triangle",
        .06
    );


    setTimeout(
        () =>
            playTone(
                base * 1.25,
                .12,
                "triangle",
                .06
            ),
        70
    );


    setTimeout(
        () =>
            playTone(
                base * 1.5,
                .18,
                "triangle",
                .05
            ),
        140
    );
}


/* ============================================================
   VICTORIA
   ============================================================ */

function playVictorySound() {

    if (
        !CONFIG.SONIDO_VICTORIA
    ) {

        return;
    }


    [
        523,
        659,
        784,
        1047
    ]
    .forEach(
        (frequency, index) => {

            setTimeout(
                () =>
                    playTone(
                        frequency,
                        .20,
                        "sine",
                        .07
                    ),
                index * 110
            );
        }
    );
}


/* ============================================================
   DERROTA
   ============================================================ */

function playDefeatSound() {

    if (
        !CONFIG.SONIDO_DERROTA
    ) {

        return;
    }


    playTone(
        350,
        .18,
        "sawtooth",
        .035
    );


    setTimeout(
        () =>
            playTone(
                220,
                .30,
                "sawtooth",
                .035
            ),
        150
    );
}