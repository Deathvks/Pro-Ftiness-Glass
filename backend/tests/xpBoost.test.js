import test from 'node:test';
import assert from 'node:assert/strict';
import {
  XP_BOOST_DURATION_MS,
  createXpBoostPayload,
  getActiveXpBoostFromState,
  getBestMilestoneBoostCrossed,
  getXpMultiplierForMilestoneLevel,
} from '../utils/xpBoost.js';
import { addXp } from '../services/gamificationService.js';
import models from '../models/index.js';

const { XpLog } = models;

test('niveles acabados en 5 y 0 devuelven x1.5 y x2 exclusivamente', () => {
  for (const lvl of [5, 15, 25, 35, 45, 95]) {
    assert.equal(getXpMultiplierForMilestoneLevel(lvl), 1.5, `Nivel ${lvl}`);
  }
  for (const lvl of [10, 20, 30, 40, 50, 100]) {
    assert.equal(getXpMultiplierForMilestoneLevel(lvl), 2, `Nivel ${lvl}`);
  }
  for (const lvl of [1, 2, 3, 4, 6, 7, 8, 9, 11, 14, 16, 19, 21, 24]) {
    assert.equal(getXpMultiplierForMilestoneLevel(lvl), 1, `Nivel ${lvl}`);
  }
});

test('getBestMilestoneBoostCrossed detecta el mejor multiplicador cruzado', () => {
  assert.deepEqual(getBestMilestoneBoostCrossed(4, 5), { level: 5, multiplier: 1.5 });
  assert.deepEqual(getBestMilestoneBoostCrossed(4, 6), { level: 5, multiplier: 1.5 });
  assert.deepEqual(getBestMilestoneBoostCrossed(9, 10), { level: 10, multiplier: 2 });
  assert.deepEqual(getBestMilestoneBoostCrossed(4, 11), { level: 10, multiplier: 2 });
  assert.equal(getBestMilestoneBoostCrossed(5, 8), null);
  assert.equal(getBestMilestoneBoostCrossed(10, 14), null);
});

test('getActiveXpBoostFromState respeta exactamente 1 semana y vuelve a normal al expirar', () => {
  const t0 = Date.UTC(2026, 10, 27, 12, 0, 0);
  const boost = createXpBoostPayload(5, 1.5, t0);
  const state = { date: '2026-11-27', food_logs: 1, xp_boost: boost };

  const activeInside = getActiveXpBoostFromState(state, t0 + XP_BOOST_DURATION_MS - 1000);
  assert.ok(activeInside);
  assert.equal(activeInside.multiplier, 1.5);
  assert.equal(activeInside.level, 5);
  assert.equal(activeInside.remainingMs, 1000);

  const expiredExact = getActiveXpBoostFromState(state, t0 + XP_BOOST_DURATION_MS);
  assert.equal(expiredExact, null);

  const expiredAfter = getActiveXpBoostFromState(state, t0 + XP_BOOST_DURATION_MS + 60000);
  assert.equal(expiredAfter, null);
});

test('addXp multiplica x1.5 en nivel 5, x2 en nivel 10, y vuelve a x1 tras 7 días', async () => {
  const originalCreate = XpLog.create;
  const createdLogs = [];
  XpLog.create = async (row) => {
    createdLogs.push(row);
    return row;
  };

  try {
    // Nivel 5 empieza en 50*25 + 350*5 - 400 = 2600 XP
    const mockUser = {
      id: 999999,
      xp: 2550, // Nivel 4
      level: 4,
      timezone: 'Europe/Madrid',
      daily_gamification_state: {},
      changed() {},
      async save() {
        return this;
      },
    };

    const t0 = Date.UTC(2026, 10, 27, 10, 0, 0);

    // 1. Subir a Nivel 5 con +50 XP -> aún x1 antes de alcanzar 5, y activa x1.5 por 1 semana
    const resLevel5 = await addXp(mockUser.id, 50, 'Prueba subir a Nv5', {
      userInstance: mockUser,
      nowMs: t0,
    });
    assert.equal(resLevel5.success, true);
    assert.equal(resLevel5.xpAdded, 50);
    assert.equal(resLevel5.level, 5);
    assert.equal(resLevel5.boostActivated?.multiplier, 1.5);
    assert.equal(mockUser.daily_gamification_state.xp_boost?.multiplier, 1.5);

    // 2. Durante la semana del nivel 5, 200 XP valen 200 * 1.5 = 300 XP
    const resDuring5 = await addXp(mockUser.id, 200, 'Prueba x1.5', {
      userInstance: mockUser,
      nowMs: t0 + 2 * 24 * 60 * 60 * 1000,
    });
    assert.equal(resDuring5.xpAdded, 300);
    assert.equal(resDuring5.xpMultiplier, 1.5);
    assert.equal(mockUser.xp, 2900);

    // 3. Al pasar 7 días + 1s vuelve a la normalidad x1 (200 XP -> 200 XP)
    const resAfterWeek = await addXp(mockUser.id, 200, 'Prueba post semana', {
      userInstance: mockUser,
      nowMs: t0 + XP_BOOST_DURATION_MS + 1000,
    });
    assert.equal(resAfterWeek.xpAdded, 200);
    assert.equal(resAfterWeek.xpMultiplier, 1);
    assert.equal(resAfterWeek.xpBoost, null);
    assert.equal(mockUser.daily_gamification_state.xp_boost, undefined);

    // 4. Llegar a nivel 6 NO activa ningún boost (solo niveles en 5 y 0)
    // Nivel 6 = 50*36 + 350*6 - 400 = 3500 XP
    mockUser.xp = 3450;
    mockUser.level = 5;
    const resLevel6 = await addXp(mockUser.id, 50, 'Prueba Nv6 sin boost', {
      userInstance: mockUser,
      nowMs: t0 + XP_BOOST_DURATION_MS + 5000,
    });
    assert.equal(resLevel6.level, 6);
    assert.equal(resLevel6.boostActivated, null);
    assert.equal(resLevel6.xpBoost, null);

    // 5. Subir a Nivel 10 activa x2 durante 1 semana
    // Nivel 10 = 50*100 + 350*10 - 400 = 8100 XP
    mockUser.xp = 8050;
    mockUser.level = 9;
    const t10 = t0 + XP_BOOST_DURATION_MS + 10000;
    const resLevel10 = await addXp(mockUser.id, 50, 'Prueba Nv10', {
      userInstance: mockUser,
      nowMs: t10,
    });
    assert.equal(resLevel10.level, 10);
    assert.equal(resLevel10.boostActivated?.multiplier, 2);

    // Durante esa semana, 200 XP -> 400 XP
    const resDuring10 = await addXp(mockUser.id, 200, 'Prueba x2', {
      userInstance: mockUser,
      nowMs: t10 + 3600000,
    });
    assert.equal(resDuring10.xpAdded, 400);
    assert.equal(resDuring10.xpMultiplier, 2);

    // Verificar Login Diario cruza medianoche preservando el boost activo
    const resLogin = await addXp(mockUser.id, 25, 'Login Diario', {
      userInstance: mockUser,
      nowMs: t10 + 2 * 24 * 60 * 60 * 1000,
    });
    assert.equal(resLogin.xpAdded, 50); // 25 * 2 = 50 XP
    assert.equal(resLogin.xpBoost?.multiplier, 2);
  } finally {
    XpLog.create = originalCreate;
  }
});
