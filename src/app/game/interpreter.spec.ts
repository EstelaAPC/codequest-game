import {
  executeProgram,
  MISSIONS,
} from './interpreter';

function missionById(id: string) {
  const mission = MISSIONS.find((item) => item.id === id);
  if (!mission) {
    throw new Error(`Missão não encontrada: ${id}`);
  }
  return mission;
}

describe('mission command interpreter', () => {
  it('moves Byte to the crystal using a deterministic command sequence', () => {
    const mission = MISSIONS[0];
    if (mission.kind !== 'grid') {
      throw new Error('A primeira missão deve ser uma missão de tabuleiro.');
    }
    const program = Array.from({ length: 4 }, (_, index) => ({
      id: `move-${index}`,
      type: 'move' as const,
    }));

    const result = executeProgram(mission, program);

    expect(result.error).toBeUndefined();
    expect(result.frames.at(-1)?.success).toBe(true);
    expect(result.frames.at(-1)?.position).toEqual(mission.goal);
  });

  it('stops and reports a clear error when Byte walks off the map', () => {
    const firstMission = MISSIONS[0];
    if (firstMission.kind !== 'grid') {
      throw new Error('A primeira missão deve ser uma missão de tabuleiro.');
    }
    const mission = { ...firstMission, goal: { x: 0, y: 1 } };
    const result = executeProgram(
      mission,
      Array.from({ length: 6 }, (_, index) => ({
        id: `move-${index}`,
        type: 'move' as const,
      })),
    );

    expect(result.error).toBe('Caminho bloqueado');
    expect(result.frames.at(-1)?.error).toBe('Caminho bloqueado');
  });

  it('does not let an unchecked move enter the broken bridge', () => {
    const result = executeProgram(missionById('broken-bridge'), [
      { id: 'move-1', type: 'move' },
      { id: 'move-2', type: 'move' },
      { id: 'unsafe-move', type: 'move' },
    ]);

    expect(result.error).toBe('Caminho bloqueado');
    expect(result.frames.at(-1)?.position).toEqual({ x: 2, y: 2 });
  });

  it('only crosses the bridge when the condition is true', () => {
    const result = executeProgram(missionById('broken-bridge'), [
      { id: 'move-1', type: 'move' },
      { id: 'move-2', type: 'move' },
      { id: 'bridge-check', type: 'if-bridge' },
      { id: 'move-3', type: 'move' },
      { id: 'move-4', type: 'move' },
    ]);

    expect(result.frames.find((frame) => frame.commandId === 'bridge-check' && frame.message.includes('verdadeira'))).toBeTruthy();
    expect(result.frames.at(-1)?.success).toBe(true);
  });

  it('waits in place when the bridge condition is false', () => {
    const result = executeProgram(missionById('broken-bridge'), [
      { id: 'bridge-check', type: 'if-bridge' },
    ]);

    expect(result.frames).toHaveLength(1);
    expect(result.frames[0].message).toContain('Sem ponte');
    expect(result.frames[0].position).toEqual({ x: 0, y: 2 });
  });

  it('repeats planting instructions until every garden plot is planted', () => {
    const result = executeProgram(missionById('automated-garden'), [
      { id: 'garden-loop', type: 'repeat-garden', count: 4 },
    ]);

    expect(result.frames.at(-1)?.success).toBe(true);
    expect(result.frames.at(-1)?.planted).toHaveLength(4);
  });

  it('rejects repeat counts outside the safe interpreter limit', () => {
    const result = executeProgram(missionById('automated-garden'), [
      { id: 'garden-loop', type: 'repeat-garden', count: 9 },
    ]);

    expect(result.error).toContain('entre 1 e 8');
  });

  it('builds Byte house from class properties and instantiates the object', () => {
    const result = executeProgram(missionById('byte-house'), [
      { id: 'roof', type: 'house-property', property: 'roof' },
      { id: 'door', type: 'house-property', property: 'door' },
      { id: 'window', type: 'house-property', property: 'window' },
    ]);

    expect(result.error).toBeUndefined();
    expect(result.frames.at(-1)?.success).toBe(true);
    expect(result.frames.at(-1)?.houseProperties).toEqual(['roof', 'door', 'window']);
  });

  it('runs a method on Byte house and only completes when the lights turn on', () => {
    const result = executeProgram(missionById('byte-house-methods'), [
      { id: 'door', type: 'house-method', method: 'open-door' },
      { id: 'bell', type: 'house-method', method: 'ring-bell' },
      { id: 'lights', type: 'house-method', method: 'turn-on-lights' },
    ]);

    expect(result.error).toBeUndefined();
    expect(result.frames.at(-1)?.houseEffects).toContain('lights-on');
    expect(result.frames.at(-1)?.success).toBe(true);
    expect(result.frames.some((frame) => frame.message.includes('porta se abriu'))).toBe(true);
  });

  it('rejects a house property that is added to the class more than once', () => {
    const result = executeProgram(missionById('byte-house'), [
      { id: 'roof-1', type: 'house-property', property: 'roof' },
      { id: 'roof-2', type: 'house-property', property: 'roof' },
    ]);

    expect(result.error).toBe('Essa propriedade já foi adicionada.');
    expect(result.frames.at(-1)?.error).toBe(result.error);
  });

  it('completes the pantry objective with additions while keeping safe removal available', () => {
    const mission = missionById('byte-pantry');
    const blocked = executeProgram(mission, [
      { id: 'remove-empty', type: 'pantry-remove', ingredient: 'flour' },
    ]);
    expect(blocked.error).toBe('Estoque insuficiente.');
    expect(blocked.frames.at(-1)?.pantry.flour).toBe(0);

    const result = executeProgram(mission, [
      { id: 'flour-one', type: 'pantry-add', ingredient: 'flour' },
      { id: 'flour-two', type: 'pantry-add', ingredient: 'flour' },
      { id: 'egg-one', type: 'pantry-add', ingredient: 'egg' },
    ]);
    expect(result.frames.at(-1)?.pantry).toEqual({ flour: 2, egg: 1 });
    expect(result.frames.at(-1)?.success).toBe(true);

    const optionalRemoval = executeProgram(mission, [
      { id: 'add-flour', type: 'pantry-add', ingredient: 'flour' },
      { id: 'remove-flour', type: 'pantry-remove', ingredient: 'flour' },
    ]);
    expect(optionalRemoval.error).toBeUndefined();
    expect(optionalRemoval.frames.at(-1)?.pantry.flour).toBe(0);
    expect(optionalRemoval.frames.at(-1)?.success).toBeUndefined();
  });

  it('hides bread preparation steps and serves the finished bread', () => {
    const result = executeProgram(missionById('byte-recipe'), [
      { id: 'prepare-bread', type: 'prepare-recipe', recipe: 'bread' },
      { id: 'serve-bread', type: 'serve-dish', dish: 'bread' },
    ]);
    expect(result.frames.some((frame) => frame.message.includes('misturando a massa'))).toBe(true);
    expect(result.frames.some((frame) => frame.message.includes('colocou o pão no forno'))).toBe(true);
    expect(result.frames.at(-1)?.kitchenEffects).toContain('bread-served');
    expect(result.frames.at(-1)?.success).toBe(true);
  });

  it('requires creating an inherited recipe before preparing the cake', () => {
    const mission = missionById('byte-specialty');
    const invalid = executeProgram(mission, [
      { id: 'prepare-first', type: 'prepare-recipe', recipe: 'cake' },
    ]);
    expect(invalid.error).toBe('Receita ainda não criada.');

    const result = executeProgram(mission, [
      { id: 'create-cake', type: 'create-recipe', recipe: 'cake' },
      { id: 'prepare-cake', type: 'prepare-recipe', recipe: 'cake' },
      { id: 'decorate-cake', type: 'decorate-cake' },
    ]);
    expect(result.frames.at(-1)?.kitchenEffects).toContain('cake-decorated');
    expect(result.frames.at(-1)?.success).toBe(true);
  });

  it('dispatches the same preparation method to distinct dish behaviors', () => {
    const result = executeProgram(missionById('byte-many-dishes'), [
      { id: 'bread', type: 'prepare-dish', dish: 'bread' },
      { id: 'cake', type: 'prepare-dish', dish: 'cake' },
      { id: 'serve-bread', type: 'serve-dish', dish: 'bread' },
      { id: 'serve-cake', type: 'serve-dish', dish: 'cake' },
    ]);
    expect(result.frames.some((frame) => frame.message.includes('fermentando a massa'))).toBe(true);
    expect(result.frames.some((frame) => frame.message.includes('recebeu cobertura'))).toBe(true);
    expect(result.frames.at(-1)?.kitchenEffects).toContain('bread-served');
    expect(result.frames.at(-1)?.kitchenEffects).toContain('cake-served');
    expect(result.frames.at(-1)?.success).toBe(true);
  });

  it('checks the intact bridge and takes a visible detour around each broken bridge', () => {
    const result = executeProgram(missionById('bridge-detours'), [
      { id: 'reach-first-bridge', type: 'move' },
      { id: 'check-intact-bridge', type: 'if-bridge-broken' },
      { id: 'reach-first-broken-bridge', type: 'move' },
      { id: 'detour-first-broken-bridge', type: 'if-bridge-broken' },
      { id: 'detour-second-broken-bridge', type: 'if-bridge-broken' },
      { id: 'reach-crystal', type: 'move' },
    ]);

    expect(result.error).toBeUndefined();
    expect(result.frames.filter((frame) => frame.message.includes('seguindo o desvio'))).toHaveLength(8);
    expect(result.frames.at(-1)?.inspectedBridges).toHaveLength(3);
    expect(result.frames.at(-1)?.success).toBe(true);
    expect(result.frames.at(-1)?.position).toEqual({ x: 8, y: 2 });
  });

  it('shows Byte falling with a clear error when he advances onto a broken bridge', () => {
    const result = executeProgram(missionById('bridge-detours'), [
      { id: 'reach-first-bridge', type: 'move' },
      { id: 'check-intact-bridge', type: 'if-bridge-broken' },
      { id: 'reach-first-broken-bridge', type: 'move' },
      { id: 'unsafe-advance', type: 'move' },
    ]);

    expect(result.error).toContain('Byte caiu na ponte quebrada');
    expect(result.frames.at(-1)?.byteFallen).toBe(true);
    expect(result.frames.at(-1)?.position).toEqual({ x: 4, y: 2 });
  });
});
