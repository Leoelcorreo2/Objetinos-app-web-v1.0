import GamePhase from "../state/GamePhase.js";

/**
 * GameState
 *
 * Representa el estado persistente de una partida.
 *
 * GameState mantiene:
 * - currentLevel
 * - activeLevel
 * - lives
 * - coins
 * - powerUps
 * - gamePhase
 *
 * La información viva del nivel pertenece a LevelState.
 */
export default class GameState {

    static DEFAULT_LIVES = 5;
    static DEFAULT_COINS = 0;
    static DEFAULT_POWER_UPS = {};

    constructor({
        currentLevel = 1,
        activeLevel = null,
        lives = GameState.DEFAULT_LIVES,
        coins = GameState.DEFAULT_COINS,
        powerUps = GameState.DEFAULT_POWER_UPS,
        gamePhase = GamePhase.READY
    } = {}) {

        if (!Number.isInteger(currentLevel) || currentLevel < 1) {
            throw new Error(
                "GameState: currentLevel debe ser un entero mayor o igual que 1."
            );
        }

        if (
            activeLevel !== null &&
            (!Number.isInteger(activeLevel) || activeLevel < 1)
        ) {
            throw new Error(
                "GameState: activeLevel debe ser null o un entero mayor o igual que 1."
            );
        }

        if (!Number.isInteger(lives) || lives < 0) {
            throw new Error(
                "GameState: lives debe ser un entero mayor o igual que 0."
            );
        }

        if (!Number.isFinite(coins) || coins < 0) {
            throw new Error(
                "GameState: coins debe ser un número mayor o igual que 0."
            );
        }

        if (!powerUps || typeof powerUps !== "object" || Array.isArray(powerUps)) {
            throw new Error(
                "GameState: powerUps debe ser un objeto."
            );
        }

        if (!GamePhase.isValid(gamePhase)) {
            throw new Error(
                `GameState: gamePhase inválida: ${gamePhase}.`
            );
        }

        this.currentLevel = currentLevel;
        this.activeLevel = activeLevel;
        this.lives = lives;
        this.coins = coins;

        // Se copia para evitar compartir accidentalmente la referencia
        // del objeto recibido por el constructor.
        this.powerUps = { ...powerUps };

        this.gamePhase = gamePhase;
    }

    /**
     * Indica si existen vidas disponibles.
     */
    hasLives() {
        return this.lives > 0;
    }

    /**
     * Pierde una vida.
     *
     * La modificación de vidas pertenece a GameState porque las vidas
     * son propiedad de la partida y no del LevelState.
     */
    loseLife() {
        if (this.lives <= 0) {
            return false;
        }

        this.lives -= 1;

        return true;
    }

    /**
     * Añade vidas.
     */
    addLives(amount = 1) {
        if (!Number.isInteger(amount) || amount < 1) {
            throw new Error(
                "GameState: amount debe ser un entero mayor o igual que 1."
            );
        }

        this.lives += amount;

        return this.lives;
    }

    /**
     * Añade monedas.
     */
    addCoins(amount) {
        if (!Number.isFinite(amount) || amount < 0) {
            throw new Error(
                "GameState: amount de monedas debe ser un número mayor o igual que 0."
            );
        }

        this.coins += amount;

        return this.coins;
    }

    /**
     * Consume monedas.
     */
    spendCoins(amount) {
        if (!Number.isFinite(amount) || amount < 0) {
            throw new Error(
                "GameState: amount de monedas debe ser un número mayor o igual que 0."
            );
        }

        if (amount > this.coins) {
            return false;
        }

        this.coins -= amount;

        return true;
    }

    /**
     * Devuelve la cantidad de un power-up.
     */
    getPowerUpCount(powerUpId) {
        if (typeof powerUpId !== "string" || powerUpId.length === 0) {
            throw new Error(
                "GameState: powerUpId debe ser un string no vacío."
            );
        }

        const count = this.powerUps[powerUpId];

        if (count === undefined) {
            return 0;
        }

        return count;
    }

    /**
     * Añade unidades de un power-up.
     */
    addPowerUp(powerUpId, amount = 1) {
        if (typeof powerUpId !== "string" || powerUpId.length === 0) {
            throw new Error(
                "GameState: powerUpId debe ser un string no vacío."
            );
        }

        if (!Number.isInteger(amount) || amount < 1) {
            throw new Error(
                "GameState: amount de power-up debe ser un entero mayor o igual que 1."
            );
        }

        const current = this.getPowerUpCount(powerUpId);

        this.powerUps[powerUpId] = current + amount;

        return this.powerUps[powerUpId];
    }

    /**
     * Consume una unidad de un power-up.
     */
    usePowerUp(powerUpId) {
        if (typeof powerUpId !== "string" || powerUpId.length === 0) {
            throw new Error(
                "GameState: powerUpId debe ser un string no vacío."
            );
        }

        const current = this.getPowerUpCount(powerUpId);

        if (current <= 0) {
            return false;
        }

        this.powerUps[powerUpId] = current - 1;

        return true;
    }

    /**
     * Establece el nivel actualmente cargado/jugándose.
     */
    setActiveLevel(levelNumber) {
        if (!Number.isInteger(levelNumber) || levelNumber < 1) {
            throw new Error(
                "GameState: activeLevel debe ser un entero mayor o igual que 1."
            );
        }

        this.activeLevel = levelNumber;

        return this.activeLevel;
    }

    /**
     * Establece el nivel que corresponde continuar.
     */
    setCurrentLevel(levelNumber) {
        if (!Number.isInteger(levelNumber) || levelNumber < 1) {
            throw new Error(
                "GameState: currentLevel debe ser un entero mayor o igual que 1."
            );
        }

        this.currentLevel = levelNumber;

        return this.currentLevel;
    }

    /**
     * Marca un nivel como completado.
     *
     * Ejemplo:
     *   nivel activo = 37
     *
     * después:
     *   activeLevel = 37
     *   currentLevel = 38
     */
    completeLevel(levelNumber = this.activeLevel) {
        if (!Number.isInteger(levelNumber) || levelNumber < 1) {
            throw new Error(
                "GameState: levelNumber debe ser un entero mayor o igual que 1."
            );
        }

        this.activeLevel = levelNumber;
        this.currentLevel = levelNumber + 1;

        return {
            activeLevel: this.activeLevel,
            currentLevel: this.currentLevel
        };
    }

    /**
     * Establece la fase global de la partida.
     */
    setGamePhase(gamePhase) {
        if (!GamePhase.isValid(gamePhase)) {
            throw new Error(
                `GameState: gamePhase inválida: ${gamePhase}.`
            );
        }

        this.gamePhase = gamePhase;

        return this.gamePhase;
    }

    /**
     * Devuelve una copia serializable del estado persistente.
     *
     * No contiene LevelState.
     */
    toJSON() {
        return {
            currentLevel: this.currentLevel,
            activeLevel: this.activeLevel,
            lives: this.lives,
            coins: this.coins,
            powerUps: { ...this.powerUps },
            gamePhase: this.gamePhase
        };
    }
}