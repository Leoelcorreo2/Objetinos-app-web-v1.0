/* ============================================================
   OBJETINOS CONTRARELOJ
   CONFIGURACIÓN GENERAL
   ============================================================ */

const CONFIG = {

    /* --------------------------------------------------------
       TABLERO
       -------------------------------------------------------- */

    HUECOS_POR_ESTANTE: 3,

    NUM_ESTANTES: 12,


    /* --------------------------------------------------------
       TIEMPO
       -------------------------------------------------------- */

    TIEMPO_INICIAL: 30,

    TIEMPO_NIVEL_1: 30,

    TIEMPO_MINIMO: 10,


    /* --------------------------------------------------------
       TRÍOS
       -------------------------------------------------------- */

    OBJETOS_PARA_TRIO: 3,

    MONEDAS_TRIO: 50,

    PUNTOS_TRIO: 100,


    /* --------------------------------------------------------
       COMBOS
       -------------------------------------------------------- */

    VENTANA_COMBO: 2600,

    MULTIPLICADOR_COMBO: true,

    MONEDAS_COMBO_BASE: 50,


    /* --------------------------------------------------------
       ARRASTRE
       -------------------------------------------------------- */

    // Distancia máxima desde el centro del hueco
    // para considerar que el objeto ha sido colocado.

    TOLERANCIA_DROP: 0.65,


    /* --------------------------------------------------------
       ANIMACIONES
       -------------------------------------------------------- */

    DURACION_SPAWN: 480,

    DURACION_ELIMINACION: 280,

    DURACION_REGRESO: 230,


    /* --------------------------------------------------------
       PARTÍCULAS
       -------------------------------------------------------- */

    PARTICULAS_TRIO: 12,

    PARTICULAS_POR_COMBO: 12,

    PARTICULAS_MAXIMAS: 80,


    /* --------------------------------------------------------
       TUTORIAL
       -------------------------------------------------------- */

    TIEMPO_TUTORIAL: 3000,


    /* --------------------------------------------------------
       SONIDO
       -------------------------------------------------------- */

    SONIDO_MOVIMIENTO: false,

    SONIDO_TRIO: true,

    SONIDO_COMBO: true,

    SONIDO_VICTORIA: true,

    SONIDO_DERROTA: true,


    /* --------------------------------------------------------
       ESCENARIOS
       -------------------------------------------------------- */

    ESCENARIOS: [

        "supermarket",

        "fridge",

        "toyshop",

        "library",

        "warehouse",

        "workshop"

    ]

};


/* ============================================================
   TIPOS DE OBJETOS
   ============================================================ */

const TIPOS_OBJETOS = [

    {
        id: "apple",
        emoji: "🍎",
        nombre: "Manzana"
    },

    {
        id: "banana",
        emoji: "🍌",
        nombre: "Plátano"
    },

    {
        id: "cheese",
        emoji: "🧀",
        nombre: "Queso"
    },

    {
        id: "bread",
        emoji: "🍞",
        nombre: "Pan"
    },

    {
        id: "milk",
        emoji: "🥛",
        nombre: "Leche"
    },

    {
        id: "carrot",
        emoji: "🥕",
        nombre: "Zanahoria"
    },

    {
        id: "cookie",
        emoji: "🍪",
        nombre: "Galleta"
    },

    {
        id: "watermelon",
        emoji: "🍉",
        nombre: "Sandía"
    },

    {
        id: "orange",
        emoji: "🍊",
        nombre: "Naranja"
    },

    {
        id: "strawberry",
        emoji: "🍓",
        nombre: "Fresa"
    },

    {
        id: "donut",
        emoji: "🍩",
        nombre: "Donut"
    },

    {
        id: "cake",
        emoji: "🍰",
        nombre: "Tarta"
    }

];


/* ============================================================
   ESCENARIOS
   ============================================================ */

const ESCENARIOS = {

    supermarket: {

        nombre: "Supermercado",

        emoji: "🛒"

    },

    fridge: {

        nombre: "Nevera",

        emoji: "🧊"

    },

    toyshop: {

        nombre: "Juguetería",

        emoji: "🧸"

    },

    library: {

        nombre: "Biblioteca",

        emoji: "📚"

    },

    warehouse: {

        nombre: "Almacén",

        emoji: "📦"

    },

    workshop: {

        nombre: "Taller",

        emoji: "🔧"

    }

};


/* ============================================================
   CONFIGURACIÓN DE NIVELES
   ============================================================ */

const CONFIG_NIVELES = [

    {
        nivel: 1,

        capas: 1,

        estantes: 4,

        estantesBloqueados: 0,

        tiempo: 30
    },


    {
        nivel: 2,

        capas: 1,

        estantes: 6,

        estantesBloqueados: 0,

        tiempo: 30
    },


    {
        nivel: 3,

        capas: 2,

        estantes: 6,

        estantesBloqueados: 0,

        tiempo: 35
    },


    {
        nivel: 4,

        capas: 2,

        estantes: 8,

        estantesBloqueados: 0,

        tiempo: 35
    },


    {
        nivel: 5,

        capas: 2,

        estantes: 8,

        estantesBloqueados: 1,

        desbloqueoTrio: 2,

        tiempo: 40
    },


    {
        nivel: 6,

        capas: 3,

        estantes: 9,

        estantesBloqueados: 1,

        desbloqueoTrio: 3,

        tiempo: 40
    },


    {
        nivel: 7,

        capas: 3,

        estantes: 10,

        estantesBloqueados: 2,

        desbloqueoTrio: 4,

        tiempo: 45
    }

];