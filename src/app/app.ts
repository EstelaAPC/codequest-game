import { computed, signal } from '@angular/core';
import { Component } from '@angular/core';
import {
  Command,
  executeProgram,
  GridMission,
  HouseEffect,
  HouseMethod,
  HouseProperty,
  initialGameState,
  isMissionComplete,
  KitchenDish,
  KitchenEffect,
  KitchenMission,
  KitchenRecipe,
  Mission,
  MISSIONS,
  Point,
  tileAt,
  TraceFrame,
} from './game/interpreter';
import { MISSION_STORIES, MissionStory } from './game/stories';

type RunStatus = 'ready' | 'running' | 'success' | 'error';
type LessonStage = 'explanation' | 'demonstration';
type LineStatus = 'success' | 'error';
type LibraryCommand =
  | { type: 'move' }
  | { type: 'if-bridge' }
  | { type: 'if-bridge-broken' }
  | { type: 'repeat-garden'; count: number }
  | { type: 'house-property'; property: HouseProperty }
  | { type: 'house-method'; method: HouseMethod }
  | { type: 'pantry-add'; ingredient: 'flour' | 'egg' }
  | { type: 'pantry-remove'; ingredient: 'flour' | 'egg' }
  | { type: 'prepare-recipe'; recipe: KitchenRecipe }
  | { type: 'create-recipe'; recipe: KitchenRecipe }
  | { type: 'prepare-dish'; dish: KitchenDish }
  | { type: 'decorate-cake' }
  | { type: 'serve-dish'; dish: KitchenDish };
type DragState =
  | { source: 'library'; command: LibraryCommand }
  | { source: 'program'; index: number };

interface CodeLine {
  commandId: string | null;
  text: string;
}

@Component({
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly propertyNames: Record<HouseProperty, string> = {
    door: 'porta',
    window: 'janela',
    roof: 'telhado',
  };
  protected readonly methodNames: Record<HouseMethod, string> = {
    'open-door': 'abrirPorta',
    'turn-on-lights': 'acenderLuzes',
    'ring-bell': 'tocarCampainha',
  };
  protected readonly missions = MISSIONS;
  protected readonly missionId = signal(MISSIONS[0].id);
  protected readonly currentMission = computed(
    () => MISSIONS.find((mission) => mission.id === this.missionId()) ?? MISSIONS[0],
  );
  protected readonly gridMission = computed<GridMission | null>(() => {
    const mission = this.currentMission();
    return mission.kind === 'grid' ? mission : null;
  });
  protected readonly kitchenMission = computed<KitchenMission | null>(() => {
    const mission = this.currentMission();
    return mission.kind === 'kitchen' ? mission : null;
  });
  protected readonly program = signal<Command[]>([]);
  protected readonly position = signal<Point>(initialGameState(MISSIONS[0]).position);
  protected readonly planted = signal<string[]>([]);
  protected readonly houseProperties = signal<HouseProperty[]>([]);
  protected readonly houseEffects = signal<HouseEffect[]>([]);
  protected readonly pantry = signal({ flour: 0, egg: 0 });
  protected readonly kitchenEffects = signal<KitchenEffect[]>([]);
  protected readonly kitchenServed = computed(() =>
    this.kitchenEffects().some((effect) => effect.endsWith('served')),
  );
  protected readonly kitchenAction = computed(() => {
    const effect = this.kitchenEffects().at(-1);
    if (effect?.startsWith('pantry-flour-added-')) {
      return 'Byte colocou o saco de farinha sobre a bancada.';
    }
    if (effect?.startsWith('pantry-egg-added-')) {
      return 'Byte pegou 1 ovo e colocou na bandeja.';
    }
    switch (effect) {
      case 'bread-mixing':
      case 'cake-mixing':
        return 'Byte está misturando a massa...';
      case 'bread-baking':
      case 'cake-baking':
        return 'Byte levou a forma ao forno!';
      case 'bread-prepared':
        return 'O pão saiu quentinho do forno!';
      case 'bread-served':
        return 'Luma recebeu o pão quentinho.';
      case 'cake-created':
        return 'A receita de bolo está pronta para ser usada.';
      case 'cake-prepared':
        return 'A massa assou. Falta a cobertura especial!';
      case 'cake-decorating':
        return 'Byte está colocando a cobertura...';
      case 'cake-decorated':
        return 'O bolo ficou colorido e pronto para o piquenique!';
      case 'cake-served':
        return 'Luma recebeu o bolo especial.';
      case 'soup-prepared':
        return 'A sopa está pronta!';
      default:
        return null;
    }
  });
  protected readonly completed = signal<string[]>([]);
  protected readonly runStatus = signal<RunStatus>('ready');
  protected readonly message = signal(MISSIONS[0].mentor);
  protected readonly introOpen = signal(true);
  protected readonly lessonStage = signal<LessonStage>('explanation');
  protected readonly lessonOpen = signal(true);
  protected readonly replayingLesson = signal(false);
  protected readonly coachmarkOpen = signal(false);
  protected readonly worldMapOpen = signal(false);
  protected readonly storyOpen = signal(false);
  protected readonly currentStory = signal<MissionStory | null>(null);
  protected readonly celebrationOpen = signal(false);
  protected readonly byteExpression = signal<'curious' | 'worried' | 'happy'>('curious');
  protected readonly byteFallen = signal(false);
  protected readonly celebrationParticles = Array.from({ length: 28 }, (_, index) => index);
  protected readonly attemptCount = signal(0);
  protected readonly showHint = signal(false);
  protected readonly storageWarning = signal(false);
  protected readonly activeCommandId = signal('');
  protected readonly dragState = signal<DragState | null>(null);
  protected readonly dropTarget = signal<number | null>(null);
  protected readonly lineStatuses = signal<Record<string, LineStatus>>({});
  protected readonly board = computed(() => {
    const mission = this.gridMission();
    if (!mission) {
      return [];
    }
    return Array.from({ length: mission.height }, (_, y) =>
      Array.from({ length: mission.width }, (_, x) => {
        const point = { x, y };
        return {
          ...point,
          kind: tileAt(mission, point) ?? 'stone',
          planted: this.planted().includes(`${x},${y}`),
          hasByte: this.position().x === x && this.position().y === y,
        };
      }),
    );
  });
  protected readonly codeLines = computed<CodeLine[]>(() => {
    const mission = this.currentMission();
    if (mission.kind === 'kitchen') {
      return this.kitchenCodeLines(mission);
    }
    if (mission.kind === 'house-properties') {
      return this.housePropertyCodeLines();
    }
    if (mission.kind === 'house-methods') {
      return this.houseMethodCodeLines();
    }
    const lines: CodeLine[] = [];
    for (const command of this.program()) {
      if (command.type === 'move') {
        lines.push({ commandId: command.id, text: 'byte.avancar();' });
      } else if (command.type === 'if-bridge') {
        lines.push(
          { commandId: command.id, text: 'if (caminho.aFrente === "ponte") {' },
          { commandId: null, text: '  byte.avancar();' },
          { commandId: null, text: '}' },
        );
      } else if (command.type === 'if-bridge-broken') {
        lines.push(
          { commandId: command.id, text: 'if (ponte.quebrada) {' },
          { commandId: null, text: '  byte.desviar();' },
          { commandId: null, text: '} else {' },
          { commandId: null, text: '  byte.avancar();' },
          { commandId: null, text: '}' },
        );
      } else if (command.type === 'repeat-garden') {
        lines.push(
          { commandId: command.id, text: `for (let volta = 0; volta < ${command.count}; volta++) {` },
          { commandId: null, text: '  byte.avancar();' },
          { commandId: null, text: '  jardim.plantar();' },
          { commandId: null, text: '}' },
        );
      } else {
        lines.push({ commandId: command.id, text: '// Bloco de casa indisponível nesta missão' });
      }
    }

    if (mission.id === 'automated-garden') {
      return [{ commandId: null, text: 'const jardim = new Jardim();' }, ...lines];
    }
    if (mission.id === 'broken-bridge') {
      return [
        { commandId: null, text: '// Cruze apenas se a ponte estiver à frente' },
        ...lines,
      ];
    }
    if (mission.id === 'bridge-detours') {
      return [
        { commandId: null, text: '// Verifique cada ponte: desvie se estiver quebrada' },
        ...lines,
      ];
    }
    return lines.length ? lines : [{ commandId: null, text: '// Seus comandos aparecerão aqui' }];
  });
  protected readonly mapProgressIndex = computed(() => {
    let index = 0;
    while (index < MISSIONS.length - 1 && this.completed().includes(MISSIONS[index].id)) {
      index += 1;
    }
    return index;
  });
  protected readonly mapBytePosition = computed(() => {
    const stops = this.mapStops;
    return stops[this.mapProgressIndex()];
  });

  private trace: TraceFrame[] = [];
  private traceIndex = 0;
  private timer?: ReturnType<typeof setInterval>;
  private celebrationTimer?: ReturnType<typeof setTimeout>;
  private nextCommandId = 1;
  private coachmarkSeen = false;
  private readonly mapStops = [
    { left: 15, top: 20 },
    { left: 50, top: 20 },
    { left: 85, top: 20 },
    { left: 85, top: 50 },
    { left: 50, top: 50 },
    { left: 15, top: 50 },
    { left: 15, top: 80 },
    { left: 38, top: 80 },
    { left: 62, top: 80 },
    { left: 85, top: 80 },
  ];

  constructor() {
    this.loadProgress();
  }

  protected mapNodeLeft(index: number): number {
    return this.mapStops[index]?.left ?? this.mapStops[0].left;
  }

  protected mapNodeTop(index: number): number {
    return this.mapStops[index]?.top ?? this.mapStops[0].top;
  }

  protected showLesson(mission: Mission): void {
    this.stopTimer();
    this.stopCelebrationTimer();
    this.celebrationOpen.set(false);
    this.missionId.set(mission.id);
    this.program.set([]);
    this.attemptCount.set(0);
    this.showHint.set(false);
    this.resetWorld();
    this.message.set(mission.mentor);
    this.byteExpression.set('curious');
    this.lessonStage.set('explanation');
    this.replayingLesson.set(false);
    this.storyOpen.set(false);
    this.currentStory.set(null);
    this.lessonOpen.set(true);
  }

  protected meetByte(): void {
    this.introOpen.set(false);
  }

  protected showDemonstration(): void {
    this.lessonStage.set('demonstration');
  }

  protected startMission(): void {
    this.lessonOpen.set(false);
    if (!this.replayingLesson()) {
      this.resetWorld();
    }
    this.replayingLesson.set(false);
    this.message.set(this.currentMission().mentor);
    if (!this.coachmarkSeen) {
      this.coachmarkSeen = true;
      this.coachmarkOpen.set(true);
    }
  }

  protected dismissCoachmark(): void {
    this.coachmarkOpen.set(false);
  }

  protected openWorldMap(): void {
    this.worldMapOpen.set(true);
  }

  protected exploreWorldFromCelebration(): void {
    this.celebrationOpen.set(false);
    this.worldMapOpen.set(true);
  }

  protected closeWorldMap(): void {
    this.worldMapOpen.set(false);
  }

  protected continueAfterCelebration(): void {
    const nextMission = MISSIONS[MISSIONS.indexOf(this.currentMission()) + 1];
    if (!nextMission) {
      this.showLesson(MISSIONS[0]);
      return;
    }
    const story = MISSION_STORIES.find((item) => item.nextMissionId === nextMission.id);
    if (story) {
      this.celebrationOpen.set(false);
      this.currentStory.set(story);
      this.storyOpen.set(true);
      return;
    }
    this.showLesson(nextMission);
  }

  protected continueStory(): void {
    const nextMission = MISSIONS.find((mission) => mission.id === this.currentStory()?.nextMissionId);
    this.storyOpen.set(false);
    this.currentStory.set(null);
    if (nextMission) {
      this.showLesson(nextMission);
    }
  }

  protected dismissCelebration(): void {
    this.celebrationOpen.set(false);
  }

  protected startAgainFromLesson(): void {
    this.lessonStage.set('explanation');
  }

  protected replayLesson(): void {
    this.stopTimer();
    if (this.runStatus() === 'running') {
      this.runStatus.set('ready');
    }
    this.replayingLesson.set(true);
    this.lessonStage.set('explanation');
    this.lessonOpen.set(true);
  }

  protected selectMission(mission: Mission): void {
    this.worldMapOpen.set(false);
    this.showLesson(mission);
  }

  protected addMove(): void {
    this.appendCommand({ id: this.newCommandId(), type: 'move' });
  }

  protected addCondition(): void {
    this.appendCommand({ id: this.newCommandId(), type: 'if-bridge' });
  }

  protected addBridgeInspection(): void {
    this.appendCommand({ id: this.newCommandId(), type: 'if-bridge-broken' });
  }

  protected addLoop(): void {
    this.appendCommand({ id: this.newCommandId(), type: 'repeat-garden', count: 4 });
  }

  protected addHouseProperty(property: HouseProperty): void {
    this.appendCommand({ id: this.newCommandId(), type: 'house-property', property });
  }

  protected addHouseMethod(method: HouseMethod): void {
    this.appendCommand({ id: this.newCommandId(), type: 'house-method', method });
  }

  protected addPantryAction(action: 'add' | 'remove', ingredient: 'flour' | 'egg'): void {
    this.appendCommand({
      id: this.newCommandId(),
      type: action === 'add' ? 'pantry-add' : 'pantry-remove',
      ingredient,
    });
  }

  protected addRecipePreparation(recipe: KitchenRecipe): void {
    this.appendCommand({ id: this.newCommandId(), type: 'prepare-recipe', recipe });
  }

  protected addRecipeCreation(recipe: KitchenRecipe): void {
    this.appendCommand({ id: this.newCommandId(), type: 'create-recipe', recipe });
  }

  protected addDishPreparation(dish: KitchenDish): void {
    this.appendCommand({ id: this.newCommandId(), type: 'prepare-dish', dish });
  }

  protected addCakeDecoration(): void {
    this.appendCommand({ id: this.newCommandId(), type: 'decorate-cake' });
  }

  protected addDishServing(dish: KitchenDish): void {
    this.appendCommand({ id: this.newCommandId(), type: 'serve-dish', dish });
  }

  protected startLibraryDrag(event: DragEvent, command: LibraryCommand): void {
    this.dragState.set({ source: 'library', command });
    this.dropTarget.set(null);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', command.type);
    }
  }

  protected startProgramDrag(event: DragEvent, index: number): void {
    this.dragState.set({ source: 'program', index });
    this.dropTarget.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  protected allowDrop(event: DragEvent, target: number | null): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.dragState()?.source === 'library' ? 'copy' : 'move';
    }
    this.dropTarget.set(target);
  }

  protected dropCommand(event: DragEvent, target: number | null): void {
    event.preventDefault();
    event.stopPropagation();
    const drag = this.dragState();
    this.endDrag();
    if (!drag) {
      return;
    }

    if (drag.source === 'library') {
      this.insertCommand(this.createCommand(drag.command), target ?? this.program().length);
      return;
    }

    if (target === drag.index) {
      return;
    }
    const commands = [...this.program()];
    const [command] = commands.splice(drag.index, 1);
    if (!command) {
      return;
    }
    const insertAt = target ?? commands.length;
    commands.splice(insertAt, 0, command);
    this.program.set(commands);
    this.resetWorld();
    this.message.set('Ordem dos comandos atualizada. Execute o programa para testar!');
  }

  protected endDrag(): void {
    this.dragState.set(null);
    this.dropTarget.set(null);
  }

  protected isDraggingProgram(index: number): boolean {
    const drag = this.dragState();
    return drag?.source === 'program' && drag.index === index;
  }

  protected removeCommand(id: string): void {
    this.program.update((commands) => commands.filter((command) => command.id !== id));
    this.resetWorld();
    this.message.set('Bloco removido. Execute novamente para testar sua nova sequência.');
  }

  protected runProgram(): void {
    if (this.runStatus() === 'success' || this.runStatus() === 'running') {
      return;
    }
    if (!this.program().length) {
      this.message.set('Adicione pelo menos um bloco para executar seu programa.');
      return;
    }
    this.prepareTrace();
    if (!this.trace.length) {
      this.runStatus.set('error');
      return;
    }
    this.runStatus.set('running');
    this.timer = setInterval(() => {
      if (!this.advanceOneStep()) {
        this.stopTimer();
      }
    }, 560);
  }

  protected restartMission(): void {
    this.stopTimer();
    this.stopCelebrationTimer();
    this.program.set([]);
    this.attemptCount.set(0);
    this.showHint.set(false);
    this.resetWorld();
    this.message.set('Missão reiniciada. Monte uma nova sequência de comandos!');
  }

  protected isMissionDone(id: string): boolean {
    return this.completed().includes(id);
  }

  private appendCommand(command: Command): void {
    if (this.program().length >= 24) {
      this.message.set('Seu programa já tem 24 blocos. Execute-o ou remova algum bloco.');
      return;
    }
    this.program.update((commands) => [...commands, command]);
    this.resetWorld();
    this.message.set('Bloco adicionado! Execute para acompanhar cada linha do seu programa.');
  }

  private createCommand(command: LibraryCommand): Command {
    return { ...command, id: this.newCommandId() };
  }

  private insertCommand(command: Command, index: number): void {
    if (this.program().length >= 24) {
      this.message.set('Seu programa já tem 24 blocos. Execute-o ou remova algum bloco.');
      return;
    }
    const commands = [...this.program()];
    commands.splice(Math.max(0, Math.min(index, commands.length)), 0, command);
    this.program.set(commands);
    this.resetWorld();
    this.message.set('Bloco adicionado ao programa. Execute ou organize a sequência!');
  }

  private housePropertyCodeLines(): CodeLine[] {
    const properties = this.program().filter(
      (command): command is Extract<Command, { type: 'house-property' }> =>
        command.type === 'house-property',
    );
    return [
      { commandId: null, text: 'class Casa {' },
      ...properties.map((command) => ({
        commandId: command.id,
        text: `  ${this.propertyNames[command.property]} = true;`,
      })),
      { commandId: null, text: '}' },
      { commandId: null, text: 'const casaDoByte = new Casa();' },
    ];
  }

  private houseMethodCodeLines(): CodeLine[] {
    const calls = this.program().filter(
      (command): command is Extract<Command, { type: 'house-method' }> =>
        command.type === 'house-method',
    );
    const uniqueMethods = [...new Set(calls.map((command) => command.method))];
    const methodBodies: Record<HouseMethod, string> = {
      'open-door': 'this.portaAberta = true;',
      'turn-on-lights': 'this.luzesLigadas = true;',
      'ring-bell': 'this.campainhaTocada = true;',
    };
    return [
      { commandId: null, text: 'class Casa {' },
      { commandId: null, text: '  portaAberta = false;' },
      { commandId: null, text: '  luzesLigadas = false;' },
      { commandId: null, text: '  campainhaTocada = false;' },
      ...uniqueMethods.flatMap((method) => [
        { commandId: null, text: `  ${this.methodNames[method]}() {` },
        { commandId: null, text: `    ${methodBodies[method]}` },
        { commandId: null, text: '  }' },
      ]),
      { commandId: null, text: '}' },
      { commandId: null, text: 'const casaDoByte = new Casa();' },
      ...calls.map((command) => ({
        commandId: command.id,
        text: `casaDoByte.${this.methodNames[command.method]}();`,
      })),
    ];
  }

  private kitchenCodeLines(mission: KitchenMission): CodeLine[] {
    const commands = this.program();
    if (mission.kitchenConcept === 'encapsulation') {
      return [
        { commandId: null, text: 'class Despensa {' },
        { commandId: null, text: '  private farinha = 0;' },
        { commandId: null, text: '  private ovos = 0;' },
        { commandId: null, text: '  adicionarIngrediente(ingrediente) {' },
        { commandId: null, text: '    if (ingrediente === "farinha") this.farinha++;' },
        { commandId: null, text: '    else this.ovos++;' },
        { commandId: null, text: '  }' },
        { commandId: null, text: '  retirarIngrediente(ingrediente) {' },
        { commandId: null, text: '    if (ingrediente === "farinha" && this.farinha > 0) this.farinha--;' },
        { commandId: null, text: '    if (ingrediente === "ovo" && this.ovos > 0) this.ovos--;' },
        { commandId: null, text: '  }' },
        { commandId: null, text: '}' },
        { commandId: null, text: 'const despensa = new Despensa();' },
        ...commands.flatMap((command) => {
          if (command.type === 'pantry-add') {
            const ingredient = command.ingredient === 'flour' ? 'farinha' : 'ovo';
            return [{ commandId: command.id, text: `despensa.adicionarIngrediente("${ingredient}");` }];
          }
          if (command.type === 'pantry-remove') {
            const ingredient = command.ingredient === 'flour' ? 'farinha' : 'ovo';
            return [{ commandId: command.id, text: `despensa.retirarIngrediente("${ingredient}");` }];
          }
          return [];
        }),
        { commandId: null, text: '}' },
      ];
    }
    if (mission.kitchenConcept === 'abstraction') {
      return [
        { commandId: null, text: 'class ReceitaPao {' },
        { commandId: null, text: '  preparar() {' },
        { commandId: null, text: '    this.misturar();' },
        { commandId: null, text: '    this.assar();' },
        { commandId: null, text: '    this.finalizar();' },
        { commandId: null, text: '  }' },
        { commandId: null, text: '}' },
        { commandId: null, text: 'const receita = new ReceitaPao();' },
        ...commands.flatMap((command) =>
          command.type === 'prepare-recipe'
            ? [{ commandId: command.id, text: 'receita.preparar();' }]
            : command.type === 'serve-dish'
                ? [{ commandId: command.id, text: 'servir(pao, Luma);' }]
              : [],
        ),
      ];
    }
    if (mission.kitchenConcept === 'inheritance') {
      return [
        { commandId: null, text: 'class Receita {' },
        { commandId: null, text: '  preparar() { /* etapas comuns */ }' },
        { commandId: null, text: '}' },
        { commandId: null, text: 'class ReceitaBolo extends Receita {' },
        { commandId: null, text: '  colocarCobertura() { ... }' },
        { commandId: null, text: '}' },
        ...commands.flatMap((command) => {
          if (command.type === 'create-recipe') {
            return [{ commandId: command.id, text: 'const bolo = new ReceitaBolo();' }];
          }
          if (command.type === 'prepare-recipe') {
            return [{ commandId: command.id, text: 'bolo.preparar();' }];
          }
          if (command.type === 'decorate-cake') {
            return [{ commandId: command.id, text: 'bolo.colocarCobertura();' }];
          }
          return [];
        }),
      ];
    }
    return [
      { commandId: null, text: 'const receitas = [new ReceitaPao(), new ReceitaBolo()];' },
      { commandId: null, text: 'const pao = receitas[0];' },
      { commandId: null, text: 'const bolo = receitas[1];' },
      ...commands.flatMap((command) => {
        if (command.type !== 'prepare-dish') {
          if (command.type === 'serve-dish') {
            return [{
              commandId: command.id,
              text: command.dish === 'bread' ? 'servir(pao, Luma);' : 'servir(bolo, Luma);',
            }];
          }
          return [];
        }
        const index = command.dish === 'bread' ? 0 : 1;
        return [{ commandId: command.id, text: `receitas[${index}].preparar();` }];
      }),
    ];
  }

  private prepareTrace(): void {
    this.stopTimer();
    this.resetWorld();
    const result = executeProgram(this.currentMission(), this.program());
    this.trace = result.frames;
    this.traceIndex = 0;
    if (result.error && !result.frames.length) {
      this.runStatus.set('error');
      this.message.set(result.error);
    }
  }

  private advanceOneStep(): boolean {
    const frame = this.trace[this.traceIndex];
    if (!frame) {
      this.runStatus.set('ready');
      return false;
    }

    this.traceIndex += 1;
    this.position.set(frame.position);
    this.byteFallen.set(frame.byteFallen);
    this.planted.set([...frame.planted]);
    this.houseProperties.set([...frame.houseProperties]);
    this.houseEffects.set([...frame.houseEffects]);
    this.pantry.set({ ...frame.pantry });
    this.kitchenEffects.set([...frame.kitchenEffects]);
    this.activeCommandId.set(frame.commandId);
    this.lineStatuses.update((statuses) => ({
      ...statuses,
      [frame.commandId]: frame.error ? 'error' : 'success',
    }));
    this.message.set(frame.error ?? frame.message);

    if (frame.error) {
      this.byteExpression.set('worried');
      this.runStatus.set('error');
      this.attemptCount.update((count) => count + 1);
      this.persistFeedback();
      return false;
    }

    if (frame.success || isMissionComplete(this.currentMission(), frame)) {
      this.byteExpression.set('happy');
      this.runStatus.set('success');
      this.saveCompletion();
      return false;
    }

    if (this.traceIndex === this.trace.length) {
      this.runStatus.set('ready');
      this.attemptCount.update((count) => count + 1);
      if (this.attemptCount() >= 2) {
        this.showHint.set(true);
      }
      this.message.set('O programa terminou, mas o objetivo ainda não foi alcançado. Ajuste os blocos e tente de novo.');
      this.persistFeedback();
      return false;
    }

    return true;
  }

  private saveCompletion(): void {
    this.completed.update((items) =>
      items.includes(this.currentMission().id) ? items : [...items, this.currentMission().id],
    );
    this.runStatus.set('success');
    this.message.set('Incrível! Você resolveu o desafio com código.');
    this.persistProgress();
    this.stopCelebrationTimer();
    this.celebrationTimer = setTimeout(() => {
      this.celebrationOpen.set(true);
      this.celebrationTimer = undefined;
    }, 1400);
  }

  private persistFeedback(): void {
    if (this.attemptCount() >= 2) {
      this.showHint.set(true);
    }
  }

  private loadProgress(): void {
    try {
      const stored = localStorage.getItem('codequest-progress-v1');
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          parsed.every((value): value is string =>
            MISSIONS.some((mission) => mission.id === value),
          )
        ) {
          this.completed.set(parsed);
        }
      }
    } catch {
      this.storageWarning.set(true);
    }
  }

  private persistProgress(): void {
    try {
      localStorage.setItem('codequest-progress-v1', JSON.stringify(this.completed()));
      this.storageWarning.set(false);
    } catch {
      this.storageWarning.set(true);
    }
  }

  private resetWorld(): void {
    const initial = initialGameState(this.currentMission());
    this.position.set(initial.position);
    this.byteFallen.set(initial.byteFallen);
    this.planted.set([]);
    this.houseProperties.set([...initial.houseProperties]);
    this.houseEffects.set([...initial.houseEffects]);
    this.pantry.set({ ...initial.pantry });
    this.kitchenEffects.set([...initial.kitchenEffects]);
    this.runStatus.set('ready');
    this.activeCommandId.set('');
    this.lineStatuses.set({});
    this.byteExpression.set('curious');
    this.trace = [];
    this.traceIndex = 0;
  }

  private stopTimer(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private stopCelebrationTimer(): void {
    if (this.celebrationTimer !== undefined) {
      clearTimeout(this.celebrationTimer);
      this.celebrationTimer = undefined;
    }
  }

  private newCommandId(): string {
    return `block-${this.nextCommandId++}`;
  }
}
