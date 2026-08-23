/* ============================================================
   OBJETINOS CONTRARELOJ
   EFECTOS VISUALES
   ============================================================ */


/* ============================================================
   PARTÍCULAS
   ============================================================ */

function createParticles(
    x,
    y,
    count = CONFIG.PARTICULAS_TRIO
) {

    const container =
        document.getElementById(
            "particles"
        );


    if (!container) {

        return;
    }


    for (
        let i = 0;
        i < count;
        i++
    ) {

        if (
            container.children.length >=
            CONFIG.PARTICULAS_MAXIMAS
        ) {

            break;
        }


        const particle =
            document.createElement(
                "div"
            );


        particle.className =
            "particle";


        particle.textContent =
            [
                "✨",
                "⭐",
                "💫"
            ][
                Math.floor(
                    Math.random() * 3
                )
            ];


        particle.style.left =
            `${x}px`;


        particle.style.top =
            `${y}px`;


        particle.style.setProperty(
            "--dx",
            `${(Math.random() - .5) * 160}px`
        );


        particle.style.setProperty(
            "--dy",
            `${(Math.random() - .8) * 150}px`
        );


        particle.style.setProperty(
            "--rot",
            `${Math.random() * 360}deg`
        );


        particle.style.setProperty(
            "--dur",
            `${500 + Math.random() * 500}ms`
        );


        container.appendChild(
            particle
        );


        setTimeout(
            () =>
                particle.remove(),
            1100
        );
    }
}


/* ============================================================
   EFECTO DE TRÍO
   ============================================================ */

function showTripleEffect(
    objects
) {

    if (
        !objects ||
        objects.length === 0
    ) {

        return;
    }


    const elements =
        objects
            .map(
                object =>
                    object.element
            )
            .filter(
                element =>
                    element
            );


    if (
        elements.length === 0
    ) {

        return;
    }


    let x = 0;

    let y = 0;


    elements.forEach(
        element => {

            const rect =
                element.getBoundingClientRect();


            x +=
                rect.left +
                rect.width / 2;


            y +=
                rect.top +
                rect.height / 2;
        }
    );


    x /=
        elements.length;


    y /=
        elements.length;


    createParticles(
        x,
        y
    );
}


/* ============================================================
   COMBO
   ============================================================ */

function showCombo(
    combo
) {

    const badge =
        document.getElementById(
            "comboBadge"
        );


    const text =
        document.getElementById(
            "comboText"
        );


    const reward =
        document.getElementById(
            "comboReward"
        );


    if (!badge) {

        return;
    }


    if (text) {

        text.textContent =
            `COMBO x${combo}`;
    }


    if (reward) {

        reward.textContent =
            `+${CONFIG.MONEDAS_TRIO * combo} 🪙`;
    }


    badge.classList.remove(
        "show"
    );


    void badge.offsetWidth;


    badge.classList.add(
        "show"
    );


    setTimeout(
        () => {

            badge.classList.remove(
                "show"
            );

        },
        1100
    );
}