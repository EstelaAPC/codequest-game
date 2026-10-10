export type TileKind = 'grass' | 'bridge' | 'broken-bridge' | 'detour' | 'plot' | 'crystal' | 'stone';

export interface Point {
  x: number;
  y: number;
}

interface MissionBase {
  id: string;
  title: string;
  region: string;
  concept: string;
  objective: string;
  mentor: string;
  hint: string;
  lesson: string;
  explanation: string;
  example: string;
}

export interface GridMission extends MissionBase {
  kind: 'grid';
  width: number;
  height: number;
  start: Point;
  goal: Point;
  rows: readonly string[];
}

export interface HousePropertiesMission extends MissionBase {
  kind: 'house-properties';
}

export interface HouseMethodsMission extends MissionBase {
  kind: 'house-methods';
}

export type KitchenMission = MissionBase & {
  kind: 'kitchen';
  kitchenConcept: 'encapsulation' | 'abstraction' | 'inheritance' | 'polymorphism';
};

export type Mission = GridMission | HousePropertiesMission | HouseMethodsMission | KitchenMission;
export type HouseProperty = 'door' | 'window' | 'roof';
export type HouseMethod = 'open-door' | 'turn-on-lights' | 'ring-bell';
export type HouseEffect = 'door-open' | 'lights-on' | 'bell-rung';
export type KitchenRecipe = 'bread' | 'cake';
export type KitchenDish = KitchenRecipe | 'soup';
export type KitchenEffect =
  | 'bread-mixing'
  | 'bread-baking'
  | 'bread-prepared'
  | 'bread-served'
  | 'cake-created'
  | 'cake-mixing'
  | 'cake-baking'
  | 'cake-prepared'
  | 'cake-decorating'
  | 'cake-decorated'
  | 'cake-served'
  | 'soup-prepared'
  | `pantry-flour-added-${number}`
  | `pantry-egg-added-${number}`;

export type Command =
  | { id: string; type: 'move' }
  | { id: string; type: 'if-bridge' }
  | { id: string; type: 'if-bridge-broken' }
  | { id: string; type: 'repeat-garden'; count: number }
  | { id: string; type: 'house-property'; property: HouseProperty }
  | { id: string; type: 'house-method'; method: HouseMethod }
  | { id: string; type: 'pantry-add'; ingredient: 'flour' | 'egg' }
  | { id: string; type: 'pantry-remove'; ingredient: 'flour' | 'egg' }
  | { id: string; type: 'prepare-recipe'; recipe: KitchenRecipe }
  | { id: string; type: 'create-recipe'; recipe: KitchenRecipe }
  | { id: string; type: 'prepare-dish'; dish: KitchenDish }
  | { id: string; type: 'decorate-cake' }
  | { id: string; type: 'serve-dish'; dish: KitchenDish };

export interface GameState {
  position: Point;
  planted: readonly string[];
  houseProperties: readonly HouseProperty[];
  houseEffects: readonly HouseEffect[];
  pantry: { flour: number; egg: number };
  pantryAdded: number;
  pantryRemoved: number;
  kitchenEffects: readonly KitchenEffect[];
  inspectedBridges: readonly string[];
  byteFallen: boolean;
}

export interface TraceFrame extends GameState {
  commandId: string;
  message: string;
  error?: string;
  success?: boolean;
}

export interface ExecutionResult {
  frames: TraceFrame[];
  error?: string;
}

export const MISSIONS: readonly Mission[] = [
  {
    id: 'first-move',
    kind: 'grid',
    title: 'O Primeiro Movimento',
    region: 'Floresta das Engrenagens',
    concept: 'Sequência de comandos',
    objective: 'Leve Byte até o cristal dourado.',
    mentor: 'Byte está pronto! Cada bloco é uma instrução. O que você colocar primeiro acontece primeiro.',
    hint: 'O cristal está quatro casas à frente. Adicione quatro blocos “Avançar”.',
    lesson: 'Uma instrução de cada vez',
    explanation:
      'Um programa é um algoritmo: uma lista de instruções que o computador segue. A ordem importa: ele termina a primeira linha antes de executar a próxima. Neste desafio, cada chamada byte.avancar(); move Byte exatamente uma casa para a direita.',
    example: 'byte.avancar();\nbyte.avancar();',
    width: 6,
    height: 5,
    start: { x: 0, y: 2 },
    goal: { x: 4, y: 2 },
    rows: ['......', '......', '....C.', '......', '......'],
  },
  {
    id: 'broken-bridge',
    kind: 'grid',
    title: 'A Ponte Quebrada',
    region: 'Vale das Decisões',
    concept: 'Condição if',
    objective: 'Atravesse a ponte com segurança e alcance o cristal.',
    mentor: 'Nem todo caminho é seguro. Use uma condição para atravessar somente se houver uma ponte à frente.',
    hint: 'Avance duas casas até a borda. Então use “Se houver ponte” antes de continuar.',
    lesson: 'Decidir com if',
    explanation:
      'Uma condição é uma pergunta que pode ser verdadeira ou falsa. O if verifica a casa logo à frente: se for uma ponte, executa byte.avancar();. As chaves { } mostram qual instrução depende dessa resposta. Se não houver ponte, o bloco é ignorado e Byte fica onde está.',
    example: 'if (haPonteAFrente) {\n  byte.avancar();\n}',
    width: 7,
    height: 5,
    start: { x: 0, y: 2 },
    goal: { x: 5, y: 2 },
    rows: ['.......', '.......', '...B.C.', '.......', '.......'],
  },
  {
    id: 'bridge-detours',
    kind: 'grid',
    title: 'Desvios no Vale',
    region: 'Vale das Decisões',
    concept: 'Condição if/else',
    objective: 'Verifique as 3 pontes: atravesse a intacta e desvie das 2 quebradas.',
    mentor: 'Nem toda ponte está segura. Verifique cada uma: se estiver quebrada, Byte pega o desvio; se estiver inteira, atravessa.',
    hint: 'Avance até cada ponte e use “Verificar ponte”. O mesmo bloco escolhe entre desviar e atravessar.',
    lesson: 'Escolher entre if e else',
    explanation:
      'A condição if/else pergunta se a ponte à frente está quebrada. Se estiver, Byte segue o caminho alternativo para contorná-la; caso contrário, o else manda atravessar a ponte intacta. Assim, uma verificação escolhe entre duas ações diferentes.',
    example:
      'if (ponte.quebrada) {\n  byte.desviar();\n} else {\n  byte.avancar();\n}',
    width: 9,
    height: 5,
    start: { x: 0, y: 2 },
    goal: { x: 8, y: 2 },
    rows: ['.........', '.........', '..B.X.X.C', '...DDDDD.', '.........'],
  },
  {
    id: 'automated-garden',
    kind: 'grid',
    title: 'O Jardim Automatizado',
    region: 'Jardim das Repetições',
    concept: 'Laço for',
    objective: 'Plante todas as quatro mudas em uma única repetição.',
    mentor: 'Quatro canteiros, a mesma tarefa. Um laço repete instruções sem você precisar empilhar blocos iguais.',
    hint: 'Use “Repetir 4x” para avançar e plantar em cada canteiro.',
    lesson: 'Repetir com um laço for',
    explanation:
      'Um laço for repete instruções sem precisar copiar e colar o mesmo código. Ele começa com volta = 0, verifica se volta < 4 antes de cada repetição e soma 1 ao terminar cada volta. Assim, os valores 0, 1, 2 e 3 fazem o bloco entre { } acontecer quatro vezes; em cada volta Byte avança e planta.',
    example:
      'for (let volta = 0; volta < 4; volta++) {\n  byte.avancar();\n  jardim.plantar();\n}',
    width: 6,
    height: 5,
    start: { x: 0, y: 2 },
    goal: { x: 4, y: 2 },
    rows: ['......', '......', '.PPPP.', '......', '......'],
  },
  {
    id: 'byte-house',
    kind: 'house-properties',
    title: 'A Casa do Byte',
    region: 'Bairro dos Objetos',
    concept: 'Classes e objetos',
    objective: 'Monte a casa do Byte com telhado, porta e janela.',
    mentor: 'Vamos construir a casa do Byte! Escolha as propriedades que fazem parte do molde da classe Casa.',
    hint: 'Uma casa precisa de telhado, porta e janela. Cada bloco adiciona uma propriedade à classe.',
    lesson: 'Uma classe cria objetos',
    explanation:
      'Uma classe é uma descrição que serve de molde; ela não é, por si só, uma casa construída. As propriedades são as informações e partes que cada casa terá, como telhado, porta e janela. A expressão new Casa() usa esse molde para criar um objeto, que neste jogo é a casa do Byte.',
    example: 'class Casa {\n  telhado = true;\n  porta = true;\n  janela = true;\n}\nconst casaDoByte = new Casa();',
  },
  {
    id: 'byte-house-methods',
    kind: 'house-methods',
    title: 'A Casa Ganha Vida',
    region: 'Bairro dos Objetos',
    concept: 'Métodos',
    objective: 'Acenda as luzes da casa usando um método.',
    mentor: 'A casa do Byte já existe. Agora escolha uma ação que ela sabe fazer e veja seu método funcionar.',
    hint: 'Use o método “Acender as luzes” para iluminar a casa.',
    lesson: 'Métodos são ações',
    explanation:
      'Um método é uma ação definida dentro de uma classe. acenderLuzes() descreve como a casa acende as luzes; escrever casaDoByte.acenderLuzes() chama essa ação no objeto casaDoByte. Os parênteses indicam a chamada, e this.luzesLigadas altera a propriedade da própria casa que está executando o método.',
    example:
      'class Casa {\n  luzesLigadas = false;\n  acenderLuzes() {\n    this.luzesLigadas = true;\n  }\n}\nconst casaDoByte = new Casa();\ncasaDoByte.acenderLuzes();',
  },
  {
    id: 'byte-pantry',
    kind: 'kitchen',
    kitchenConcept: 'encapsulation',
    title: 'A Despensa Protegida',
    region: 'Cozinha das Receitas',
    concept: 'Encapsulamento',
    objective: 'Adicione 2 porções de farinha e 1 ovo à despensa.',
    mentor: 'A despensa protege os ingredientes. Use adicionarIngrediente() para guardar farinha e ovo sem alterar o estoque diretamente.',
    hint: 'Adicione duas porções de farinha e um ovo. Acompanhe as quantidades na despensa.',
    lesson: 'Proteja os dados com encapsulamento',
    explanation:
      'Encapsulamento é proteger os dados de um objeto para que não sejam alterados de qualquer jeito. A farinha e os ovos ficam guardados dentro da despensa, e seus métodos controlam as mudanças. Neste desafio, use adicionarIngrediente() para colocar duas porções de farinha e um ovo no estoque. O bloco de retirada também existe para mostrar que toda mudança deve passar por um método controlado.',
    example:
      'class Despensa {\n  private farinha = 0;\n  private ovos = 0;\n  adicionarIngrediente(ingrediente) { ... }\n  retirarIngrediente(ingrediente) { ... }\n}\ndespensa.adicionarIngrediente("farinha");',
  },
  {
    id: 'byte-recipe',
    kind: 'kitchen',
    kitchenConcept: 'abstraction',
    title: 'A Receita Misteriosa',
    region: 'Cozinha das Receitas',
    concept: 'Abstração',
    objective: 'Prepare um pão e sirva-o à Luma sem controlar cada etapa da receita.',
    mentor: 'Uma receita pode esconder o trabalho da cozinha. Escolha preparar e veja o pão ficar pronto.',
    hint: 'Use “Preparar pão” e, quando estiver pronto, escolha “Servir pão”.',
    lesson: 'Simplifique com abstração',
    explanation:
      'Abstração mostra apenas o que precisamos usar e esconde detalhes internos. Você pede receita.preparar(); sem comandar cada passo. Por dentro, a receita mistura e assa o pão. Quando ele fica pronto, você pode servi-lo à Luma. A mesma ideia aparece em ferramentas: usamos sua interface sem precisar saber como cada parte funciona.',
    example:
      'class ReceitaPao {\n  preparar() { this.misturar(); this.assar(); }\n}\nreceita.preparar();\nservir(pao, Luma);',
  },
  {
    id: 'byte-specialty',
    kind: 'kitchen',
    kitchenConcept: 'inheritance',
    title: 'A Receita de Família',
    region: 'Cozinha das Receitas',
    concept: 'Herança',
    objective: 'Crie uma receita de bolo, prepare a massa herdada e coloque a cobertura especial.',
    mentor: 'Luma pediu um bolo especial para o piquenique. Reaproveite o preparo da classe-base e dê seu toque final.',
    hint: 'Crie ReceitaBolo, prepare o bolo e só então chame colocarCobertura().',
    lesson: 'Reaproveite com herança',
    explanation:
      'Herança permite criar uma classe especializada a partir de uma classe-base. ReceitaBolo herda o preparo comum de Receita, mas acrescenta colocarCobertura(), seu toque especial. Monte a sequência completa: crie a receita, prepare a massa herdada e finalize o bolo com cobertura.',
    example:
      'class ReceitaBolo extends Receita {\n  colocarCobertura() { ... }\n}\nconst bolo = new ReceitaBolo();\nbolo.preparar();\nbolo.colocarCobertura();',
  },
  {
    id: 'byte-many-dishes',
    kind: 'kitchen',
    kitchenConcept: 'polymorphism',
    title: 'Um Comando, Muitos Pratos',
    region: 'Cozinha das Receitas',
    concept: 'Polimorfismo',
    objective: 'Prepare e sirva pão e bolo: duas receitas, a mesma interface preparar().',
    mentor: 'Byte vai usar o mesmo comando em duas receitas. Cada objeto sabe preparar seu próprio prato.',
    hint: 'Prepare pão e bolo primeiro; depois sirva cada prato. As duas receitas usam preparar().',
    lesson: 'Um método, muitas formas',
    explanation:
      'Polimorfismo permite chamar o mesmo método em objetos diferentes e obter comportamentos próprios. Tanto ReceitaPao quanto ReceitaBolo oferecem preparar(), mas o pão fermenta e assa, enquanto o bolo assa e recebe cobertura. Prepare e sirva os dois pratos: o nome da chamada é o mesmo; cada objeto decide como agir.',
    example:
      'receitaPao.preparar();\nreceitaBolo.preparar();\nservir(pao, Luma);\nservir(bolo, Luma);',
  },
];

export function tileAt(mission: Mission, point: Point): TileKind | undefined {
  if (mission.kind !== 'grid') {
    return undefined;
  }
  if (
    point.x < 0 ||
    point.y < 0 ||
    point.x >= mission.width ||
    point.y >= mission.height
  ) {
    return undefined;
  }

  switch (mission.rows[point.y][point.x]) {
    case 'B':
      return 'bridge';
    case 'X':
      return 'broken-bridge';
    case 'D':
      return 'detour';
    case 'P':
      return 'plot';
    case 'C':
      return 'crystal';
    case '#':
      return 'stone';
    default:
      return 'grass';
  }
}

export function initialGameState(mission: Mission): GameState {
  return {
    position: mission.kind === 'grid' ? { ...mission.start } : { x: 0, y: 0 },
    planted: [],
    houseProperties: mission.kind === 'house-methods' ? ['roof', 'door', 'window'] : [],
    houseEffects: [],
    pantry: { flour: 0, egg: 0 },
    pantryAdded: 0,
    pantryRemoved: 0,
    kitchenEffects: [],
    inspectedBridges: [],
    byteFallen: false,
  };
}

export function isMissionComplete(mission: Mission, state: GameState): boolean {
  if (mission.kind === 'house-properties') {
    const requiredProperties: readonly HouseProperty[] = ['roof', 'door', 'window'];
    return requiredProperties.every((property) => state.houseProperties.includes(property));
  }
  if (mission.kind === 'house-methods') {
    return state.houseEffects.includes('lights-on');
  }
  if (mission.kind === 'kitchen') {
    switch (mission.kitchenConcept) {
      case 'encapsulation':
        return state.pantry.flour === 2 && state.pantry.egg === 1;
      case 'abstraction':
        return state.kitchenEffects.includes('bread-served');
      case 'inheritance':
        return (
          state.kitchenEffects.includes('cake-created') &&
          state.kitchenEffects.includes('cake-prepared') &&
          state.kitchenEffects.includes('cake-decorated')
        );
      case 'polymorphism':
        return (
          state.kitchenEffects.includes('bread-served') &&
          state.kitchenEffects.includes('cake-served')
        );
    }
  }
  if (state.position.x !== mission.goal.x || state.position.y !== mission.goal.y) {
    return false;
  }

  if (mission.id === 'automated-garden') {
    return state.planted.length === 4;
  }
  return mission.id !== 'bridge-detours' || state.inspectedBridges.length === 3;
}

export function executeProgram(
  mission: Mission,
  program: readonly Command[],
): ExecutionResult {
  let state = initialGameState(mission);
  const frames: TraceFrame[] = [];

  const record = (
    commandId: string,
    message: string,
    options: Pick<TraceFrame, 'error' | 'success'> = {},
  ): void => {
    const frame: TraceFrame = {
      position: { ...state.position },
      planted: [...state.planted],
      houseProperties: [...state.houseProperties],
      houseEffects: [...state.houseEffects],
      pantry: { ...state.pantry },
      pantryAdded: state.pantryAdded,
      pantryRemoved: state.pantryRemoved,
      kitchenEffects: [...state.kitchenEffects],
      inspectedBridges: [...state.inspectedBridges],
      byteFallen: state.byteFallen,
      commandId,
      message,
      ...options,
    };
    frames.push(frame);
  };

  if (mission.kind === 'kitchen') {
    for (const command of program) {
      if (mission.kitchenConcept === 'encapsulation' && command.type === 'pantry-add') {
        const added = state.pantry[command.ingredient] + 1;
        state = {
          ...state,
          pantry: { ...state.pantry, [command.ingredient]: added },
          pantryAdded: state.pantryAdded + 1,
          kitchenEffects: [
            ...state.kitchenEffects,
            command.ingredient === 'flour'
              ? `pantry-flour-added-${added}`
              : `pantry-egg-added-${added}`,
          ],
        };
        record(command.id, `A despensa guardou ${command.ingredient === 'flour' ? 'farinha' : 'um ovo'}.`);
      } else if (mission.kitchenConcept === 'encapsulation' && command.type === 'pantry-remove') {
        if (state.pantry[command.ingredient] < 1) {
          const ingredientName = command.ingredient === 'flour' ? 'farinha' : 'ovos';
          record(command.id, `Não há ${ingredientName} suficiente para retirar.`, { error: 'Estoque insuficiente.' });
          return { frames, error: 'Estoque insuficiente.' };
        }
        state = {
          ...state,
          pantry: { ...state.pantry, [command.ingredient]: state.pantry[command.ingredient] - 1 },
          pantryRemoved: state.pantryRemoved + 1,
        };
        record(command.id, `A despensa conferiu o estoque e retirou ${command.ingredient === 'flour' ? 'uma porção de farinha' : 'um ovo'}.`);
      } else if (mission.kitchenConcept === 'abstraction' && command.type === 'prepare-recipe') {
        if (command.recipe !== 'bread') {
          record(command.id, 'Esta receita não está disponível nesta missão.', { error: 'Receita incompatível.' });
          return { frames, error: 'Receita incompatível.' };
        }
        state = { ...state, kitchenEffects: [...state.kitchenEffects, 'bread-mixing'] };
        record(command.id, 'Byte está misturando a massa do pão...');
        state = { ...state, kitchenEffects: [...state.kitchenEffects, 'bread-baking'] };
        record(command.id, 'Byte colocou o pão no forno...');
        state = { ...state, kitchenEffects: [...state.kitchenEffects, 'bread-prepared'] };
        record(command.id, 'O pão saiu quentinho do forno!');
      } else if (mission.kitchenConcept === 'abstraction' && command.type === 'serve-dish') {
        if (
          command.dish !== 'bread' ||
          !state.kitchenEffects.includes('bread-prepared')
        ) {
          record(command.id, 'Prepare o pão antes de servi-lo à Luma.', { error: 'Prato ainda não está pronto.' });
          return { frames, error: 'Prato ainda não está pronto.' };
        }
        state = { ...state, kitchenEffects: [...state.kitchenEffects, 'bread-served'] };
        record(command.id, 'Byte serviu o pão quentinho para Luma.');
      } else if (mission.kitchenConcept === 'inheritance' && command.type === 'create-recipe') {
        if (command.recipe !== 'cake') {
          record(command.id, 'Escolha a receita especializada de bolo.', { error: 'Receita incompatível.' });
          return { frames, error: 'Receita incompatível.' };
        }
        state = { ...state, kitchenEffects: [...state.kitchenEffects, 'cake-created'] };
        record(command.id, 'ReceitaBolo herdou o preparo comum e adicionou sua cobertura.');
      } else if (mission.kitchenConcept === 'inheritance' && command.type === 'prepare-recipe') {
        if (command.recipe !== 'cake' || !state.kitchenEffects.includes('cake-created')) {
          record(command.id, 'Crie a ReceitaBolo antes de preparar o bolo.', { error: 'Receita ainda não criada.' });
          return { frames, error: 'Receita ainda não criada.' };
        }
        state = { ...state, kitchenEffects: [...state.kitchenEffects, 'cake-mixing'] };
        record(command.id, 'Byte misturou a massa usando o preparo herdado de Receita...');
        state = { ...state, kitchenEffects: [...state.kitchenEffects, 'cake-baking'] };
        record(command.id, 'Byte colocou o bolo no forno...');
        state = { ...state, kitchenEffects: [...state.kitchenEffects, 'cake-prepared'] };
        record(command.id, 'A massa do bolo assou. Falta a cobertura especial!');
      } else if (mission.kitchenConcept === 'inheritance' && command.type === 'decorate-cake') {
        if (!state.kitchenEffects.includes('cake-prepared')) {
          record(command.id, 'Prepare o bolo antes de colocar a cobertura.', { error: 'Bolo ainda não está assado.' });
          return { frames, error: 'Bolo ainda não está assado.' };
        }
        state = { ...state, kitchenEffects: [...state.kitchenEffects, 'cake-decorating'] };
        record(command.id, 'Byte espalhou uma camada colorida de cobertura...');
        state = { ...state, kitchenEffects: [...state.kitchenEffects, 'cake-decorated'] };
        record(command.id, 'O bolo ficou decorado e pronto para o piquenique!');
      } else if (mission.kitchenConcept === 'polymorphism' && command.type === 'prepare-dish') {
        if (command.dish === 'bread') {
          state = { ...state, kitchenEffects: [...state.kitchenEffects, 'bread-mixing'] };
          record(command.id, 'A receita de pão está fermentando a massa...');
          state = { ...state, kitchenEffects: [...state.kitchenEffects, 'bread-baking'] };
          record(command.id, 'A receita de pão está assando...');
          state = { ...state, kitchenEffects: [...state.kitchenEffects, 'bread-prepared'] };
          record(command.id, 'receitaPao.preparar(); O pão ficou pronto!');
        } else if (command.dish === 'cake') {
          state = { ...state, kitchenEffects: [...state.kitchenEffects, 'cake-mixing'] };
          record(command.id, 'A receita de bolo está misturando a massa...');
          state = { ...state, kitchenEffects: [...state.kitchenEffects, 'cake-baking'] };
          record(command.id, 'A receita de bolo está assando...');
          state = { ...state, kitchenEffects: [...state.kitchenEffects, 'cake-prepared'] };
          record(command.id, 'receitaBolo.preparar(); O bolo recebeu cobertura!');
        } else {
          state = { ...state, kitchenEffects: [...state.kitchenEffects, 'soup-prepared'] };
          record(command.id, 'A receita de sopa cozinhou na panela.');
        }
      } else if (mission.kitchenConcept === 'polymorphism' && command.type === 'serve-dish') {
        const prepared = command.dish === 'bread' ? 'bread-prepared' : 'cake-prepared';
        if (
          command.dish === 'soup' ||
          !state.kitchenEffects.includes(prepared)
        ) {
          record(command.id, 'Prepare esse prato antes de servi-lo.', { error: 'Prato ainda não está pronto.' });
          return { frames, error: 'Prato ainda não está pronto.' };
        }
        const served = command.dish === 'bread' ? 'bread-served' : 'cake-served';
        state = { ...state, kitchenEffects: [...state.kitchenEffects, served] };
        record(command.id, `Byte serviu o ${command.dish === 'bread' ? 'pão' : 'bolo'} para Luma.`);
      } else {
        record(command.id, 'Esse bloco não pertence a esta missão da cozinha.', {
          error: 'Bloco incompatível com esta missão.',
        });
        return { frames, error: 'Bloco incompatível com esta missão.' };
      }

      if (isMissionComplete(mission, state)) {
        record(command.id, 'Missão concluída! O prato ficou pronto.', { success: true });
        return { frames };
      }
    }
    return { frames };
  }

  if (mission.kind !== 'grid') {
    for (const command of program) {
      if (mission.kind === 'house-properties' && command.type === 'house-property') {
        if (state.houseProperties.includes(command.property)) {
          record(command.id, `A casa já tem ${housePropertyLabel(command.property)}.`, {
            error: 'Essa propriedade já foi adicionada.',
          });
          return { frames, error: 'Essa propriedade já foi adicionada.' };
        }
        state = {
          ...state,
          houseProperties: [...state.houseProperties, command.property],
        };
        record(command.id, `${housePropertyLabel(command.property)} adicionado à classe Casa.`);
      } else if (mission.kind === 'house-methods' && command.type === 'house-method') {
        state = { ...state, houseEffects: [...state.houseEffects, houseMethodEffect(command.method)] };
        record(command.id, houseMethodMessage(command.method));
      } else {
        record(command.id, 'Esse bloco não pertence à missão da casa.', {
          error: 'Bloco incompatível com esta missão.',
        });
        return { frames, error: 'Bloco incompatível com esta missão.' };
      }

      if (isMissionComplete(mission, state)) {
        record(
          command.id,
          mission.kind === 'house-properties'
            ? 'Missão concluída! A casa do Byte está pronta.'
            : mission.kind === 'house-methods'
              ? 'Missão concluída! A casa do Byte está iluminada.'
              : 'Missão concluída! O prato ficou pronto.',
          { success: true },
        );
        return { frames };
      }
    }
    return { frames };
  }

  const move = (commandId: string, checkedBridge = false): boolean => {
    const next = { x: state.position.x + 1, y: state.position.y };
    const nextTile = tileAt(mission, next);

    if (mission.id === 'bridge-detours' && nextTile === 'broken-bridge') {
      state = { ...state, position: next, byteFallen: true };
      record(commandId, 'Byte avançou sem verificar e caiu na ponte quebrada!', {
        error: 'Byte caiu na ponte quebrada. Reinicie e verifique antes de avançar.',
      });
      return false;
    }

    if (
      !nextTile ||
      nextTile === 'stone' ||
      (nextTile === 'bridge' && mission.id === 'broken-bridge' && !checkedBridge) ||
      (nextTile === 'bridge' && mission.id === 'bridge-detours' && !checkedBridge) ||
      nextTile === 'broken-bridge'
    ) {
      const error = nextTile === 'bridge' && mission.id === 'bridge-detours'
        ? 'Ponte não verificada.'
        : 'Caminho bloqueado';
      record(commandId, 'Byte encontrou um obstáculo. Revise o mapa e tente outra sequência.', {
        error,
      });
      return false;
    }

    if (mission.id === 'automated-garden' && nextTile !== 'plot') {
      record(commandId, 'Esse bloco de repetição precisa estar sobre os canteiros.', {
        error: 'Fora do canteiro',
      });
      return false;
    }

    state = { ...state, position: next };
    record(commandId, 'Byte avançou uma casa.');
    return true;
  };

  for (const command of program) {
    if (command.type === 'move') {
      if (!move(command.id)) {
        return { frames, error: frames[frames.length - 1].error };
      }
      if (isMissionComplete(mission, state)) {
        record(command.id, 'Missão concluída! O cristal é seu.', { success: true });
        return { frames };
      }

      continue;
    }

    if (command.type === 'if-bridge-broken') {
      if (mission.id !== 'bridge-detours') {
        record(command.id, 'Esse bloco pertence à missão dos desvios no vale.', {
          error: 'Bloco incompatível com esta missão.',
        });
        return { frames, error: 'Bloco incompatível com esta missão.' };
      }

      const bridge = { x: state.position.x + 1, y: state.position.y };
      const bridgeType = tileAt(mission, bridge);
      if (bridgeType !== 'bridge' && bridgeType !== 'broken-bridge') {
        record(command.id, 'Byte não encontrou uma ponte à frente para verificar.', {
          error: 'Nenhuma ponte para verificar.',
        });
        return { frames, error: 'Nenhuma ponte para verificar.' };
      }

      const bridgeKey = `${bridge.x},${bridge.y}`;
      if (state.inspectedBridges.includes(bridgeKey)) {
        record(command.id, 'Byte já verificou esta ponte. Avance até a próxima.', {
          error: 'Ponte já verificada.',
        });
        return { frames, error: 'Ponte já verificada.' };
      }

      if (bridgeType === 'bridge') {
        if (!move(command.id, true)) {
          return { frames, error: frames[frames.length - 1].error };
        }
        state = { ...state, inspectedBridges: [...state.inspectedBridges, bridgeKey] };
        record(command.id, 'A ponte está intacta. Byte atravessou com segurança.');
      } else {
        const route = [
          { x: state.position.x, y: state.position.y + 1 },
          { x: state.position.x + 1, y: state.position.y + 1 },
          { x: state.position.x + 2, y: state.position.y + 1 },
          { x: state.position.x + 2, y: state.position.y },
        ];
        if (route.slice(0, 3).some((point) => tileAt(mission, point) !== 'detour')) {
          record(command.id, 'O caminho alternativo está bloqueado. Byte não pode desviar.', {
            error: 'Desvio bloqueado.',
          });
          return { frames, error: 'Desvio bloqueado.' };
        }
        state = { ...state, inspectedBridges: [...state.inspectedBridges, bridgeKey] };
        for (const point of route) {
          state = { ...state, position: point };
          record(command.id, 'A ponte está quebrada. Byte está seguindo o desvio.');
        }
      }

      if (isMissionComplete(mission, state)) {
        record(command.id, 'Missão concluída! As três pontes foram verificadas.', { success: true });
        return { frames };
      }
      continue;
    }

    if (command.type === 'if-bridge') {
      const next = { x: state.position.x + 1, y: state.position.y };
      if (tileAt(mission, next) === 'bridge') {
        if (!move(command.id, true)) {
          return { frames, error: frames[frames.length - 1].error };
        }
        record(command.id, 'A condição foi verdadeira: havia uma ponte. Byte atravessou!');
      } else {
        record(command.id, 'Sem ponte à frente. Byte ficou em segurança.');
      }
      if (isMissionComplete(mission, state)) {
        record(command.id, 'Missão concluída! O cristal é seu.', { success: true });
        return { frames };
      }
      continue;
    }

    if (command.type !== 'repeat-garden') {
      record(command.id, 'Esse bloco não pertence a esta missão.', {
        error: 'Bloco incompatível com esta missão.',
      });
      return { frames, error: 'Bloco incompatível com esta missão.' };
    }

    if (!Number.isInteger(command.count) || command.count < 1 || command.count > 8) {
      return { frames, error: 'A repetição deve ter entre 1 e 8 voltas.' };
    }

    for (let iteration = 0; iteration < command.count; iteration += 1) {
      if (!move(command.id)) {
        return { frames, error: frames[frames.length - 1].error };
      }

      const plot = `${state.position.x},${state.position.y}`;
      if (!state.planted.includes(plot)) {
        state = { ...state, planted: [...state.planted, plot] };
      }
      record(command.id, `Volta ${iteration + 1}: muda plantada!`);

      if (isMissionComplete(mission, state)) {
        record(command.id, 'Jardim completo! Todas as mudas estão plantadas.', {
          success: true,
        });
        return { frames };
      }
    }
  }

  return { frames };
}

function housePropertyLabel(property: HouseProperty): string {
  switch (property) {
    case 'door':
      return 'a porta';
    case 'window':
      return 'a janela';
    case 'roof':
      return 'o telhado';
  }
}

function houseMethodEffect(method: HouseMethod): HouseEffect {
  switch (method) {
    case 'open-door':
      return 'door-open';
    case 'turn-on-lights':
      return 'lights-on';
    case 'ring-bell':
      return 'bell-rung';
  }
}

function houseMethodMessage(method: HouseMethod): string {
  switch (method) {
    case 'open-door':
      return 'casaDoByte.abrirPorta(); A porta se abriu!';
    case 'turn-on-lights':
      return 'casaDoByte.acenderLuzes(); A casa ficou iluminada!';
    case 'ring-bell':
      return 'casaDoByte.tocarCampainha(); Dim-dong! Byte ouviu a campainha.';
  }
}
