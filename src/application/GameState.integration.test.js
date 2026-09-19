import assert from "node:assert/strict";
import GameState from "./GameState.js";
import GamePhase from "../state/GamePhase.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed += 1;
    } catch (error) {
        console.error(`✗ ${name}`);
        console.error(error);
        failed += 1;
    }
}

// -----------------------------------------------------------------------------
// 1. Valores por defecto
// -----------------------------------------------------------------------------

test("crea una partida con los valores por defecto", () => {
    const gameState = new GameState();

    assert.equal(gameState.currentLevel, 1);
    assert.equal(gameState.activeLevel, null);
    assert.equal(gameState.lives, 5);
    assert.equal(gameState.coins, 0);
    assert.deepEqual(gameState.powerUps, {});
    assert.equal(gameState.gamePhase, GamePhase.READY);
});

// -----------------------------------------------------------------------------
// 2. Valores personalizados
// -----------------------------------------------------------------------------

test("acepta valores personalizados", () => {
    const gameState = new GameState({
        currentLevel: 38,
        activeLevel: 37,
        lives: 3,
        coins: 120,
        powerUps: {
            hammer: 2,
            shuffle: 1
        },
        gamePhase: GamePhase.WON
    });

    assert.equal(gameState.currentLevel, 38);
    assert.equal(gameState.activeLevel, 37);
    assert.equal(gameState.lives, 3);
    assert.equal(gameState.coins, 120);

    assert.deepEqual(gameState.powerUps, {
        hammer: 2,
        shuffle: 1
    });

    assert.equal(gameState.gamePhase, GamePhase.WON);
});

// -----------------------------------------------------------------------------
// 3. currentLevel / activeLevel
// -----------------------------------------------------------------------------

test("distingue currentLevel de activeLevel", () => {
    const gameState = new GameState({
        currentLevel: 38,
        activeLevel: 37,
        gamePhase: GamePhase.WON
    });

    assert.equal(gameState.currentLevel, 38);
    assert.equal(gameState.activeLevel, 37);
});

test("completeLevel actualiza correctamente currentLevel y activeLevel", () => {
    const gameState = new GameState({
        currentLevel: 37,
        activeLevel: 37
    });

    const result = gameState.completeLevel();

    assert.equal(gameState.activeLevel, 37);
    assert.equal(gameState.currentLevel, 38);

    assert.deepEqual(result, {
        activeLevel: 37,
        currentLevel: 38
    });
});

// -----------------------------------------------------------------------------
// 4. Vidas
// -----------------------------------------------------------------------------

test("una partida comienza con cinco vidas", () => {
    const gameState = new GameState();

    assert.equal(gameState.lives, 5);
    assert.equal(gameState.hasLives(), true);
});

test("loseLife reduce una vida", () => {
    const gameState = new GameState({
        lives: 5
    });

    const result = gameState.loseLife();

    assert.equal(result, true);
    assert.equal(gameState.lives, 4);
});

test("loseLife no permite que las vidas sean negativas", () => {
    const gameState = new GameState({
        lives: 0
    });

    const result = gameState.loseLife();

    assert.equal(result, false);
    assert.equal(gameState.lives, 0);
    assert.equal(gameState.hasLives(), false);
});

// -----------------------------------------------------------------------------
// 5. Monedas
// -----------------------------------------------------------------------------

test("añade y consume monedas correctamente", () => {
    const gameState = new GameState({
        coins: 100
    });

    assert.equal(gameState.addCoins(50), 150);
    assert.equal(gameState.coins, 150);

    assert.equal(gameState.spendCoins(40), true);
    assert.equal(gameState.coins, 110);

    assert.equal(gameState.spendCoins(200), false);
    assert.equal(gameState.coins, 110);
});

// -----------------------------------------------------------------------------
// 6. Power-ups
// -----------------------------------------------------------------------------

test("gestiona correctamente los power-ups", () => {
    const gameState = new GameState();

    assert.equal(gameState.getPowerUpCount("hammer"), 0);

    assert.equal(gameState.addPowerUp("hammer", 2), 2);
    assert.equal(gameState.getPowerUpCount("hammer"), 2);

    assert.equal(gameState.usePowerUp("hammer"), true);
    assert.equal(gameState.getPowerUpCount("hammer"), 1);

    assert.equal(gameState.usePowerUp("hammer"), true);
    assert.equal(gameState.getPowerUpCount("hammer"), 0);

    assert.equal(gameState.usePowerUp("hammer"), false);
});

// -----------------------------------------------------------------------------
// 7. Fase
// -----------------------------------------------------------------------------

test("permite cambiar la fase global", () => {
    const gameState = new GameState();

    gameState.setGamePhase(GamePhase.WON);

    assert.equal(gameState.gamePhase, GamePhase.WON);
});

// -----------------------------------------------------------------------------
// 8. Serialización
// -----------------------------------------------------------------------------

test("toJSON devuelve únicamente el estado persistente de la partida", () => {
    const gameState = new GameState({
        currentLevel: 38,
        activeLevel: 37,
        lives: 4,
        coins: 75,
        powerUps: {
            hammer: 2
        },
        gamePhase: GamePhase.WON
    });

    const json = gameState.toJSON();

    assert.deepEqual(json, {
        currentLevel: 38,
        activeLevel: 37,
        lives: 4,
        coins: 75,
        powerUps: {
            hammer: 2
        },
        gamePhase: GamePhase.WON
    });
});

// -----------------------------------------------------------------------------
// 9. Validación
// -----------------------------------------------------------------------------

test("rechaza currentLevel inválido", () => {
    assert.throws(
        () => new GameState({
            currentLevel: 0
        }),
        /currentLevel/
    );
});

test("rechaza vidas negativas", () => {
    assert.throws(
        () => new GameState({
            lives: -1
        }),
        /lives/
    );
});

// -----------------------------------------------------------------------------
// Resultado
// -----------------------------------------------------------------------------

console.log("");
console.log(`GameState: ${passed}/${passed + failed} tests PASS`);

if (failed > 0) {
    process.exitCode = 1;
}