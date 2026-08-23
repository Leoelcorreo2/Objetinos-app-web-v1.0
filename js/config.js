/* ============================================================
   OBJETINOS CONTRARELOJ
   CONFIGURACIÓN GENERAL
   ============================================================ */

const CONFIG = {

    /* --------------------------------------------------------
       TABLERO
       -------------------------------------------------------- */

    HUECOS_POR_ESTANTE: 3,

    MIN_HUECOS_LIBRES_INICIALES: 3,

    TOLERANCIA_DROP: 0.65,


    /* --------------------------------------------------------
       TIEMPO
       -------------------------------------------------------- */

    TIEMPO_INICIAL: 30,

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
   ============================================================

   IMPORTANTE:

   objetos = tríos × 3

   posiciones = estantes × 3

   huecos libres = posiciones - objetos

   Por tanto:

   4 estantes / 3 tríos
   12 posiciones / 9 objetos
   = 3 huecos libres

   5 estantes / 4 tríos
   15 posiciones / 12 objetos
   = 3 huecos libres

   NUNCA generamos un nivel inicial completamente lleno.
   ============================================================ */

const CONFIG_NIVELES = [

    {
        nivel: 1,
        estantes: 4,
        capas: 1,
        trios: 3,
        tiempo: 30
    },

    {
        nivel: 2,
        estantes: 5,
        capas: 1,
        trios: 4,
        tiempo: 30
    },

    {
        nivel: 3,
        estantes: 6,
        capas: 1,
        trios: 5,
        tiempo: 35
    },

    {
        nivel: 4,
        estantes: 6,
        capas: 1,
        trios: 5,
        tiempo: 35
    },

    {
        nivel: 5,
        estantes: 7,
        capas: 1,
        trios: 6,
        tiempo: 40
    },

    {
        nivel: 6,
        estantes: 8,
        capas: 1,
        trios: 7,
        tiempo: 40
    },

    {
        nivel: 7,
        estantes: 8,
        capas: 1,
        trios: 7,
        tiempo: 45
    }

];