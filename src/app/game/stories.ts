export interface MissionStory {
  nextMissionId: string;
  location: string;
  scene: 'valley' | 'garden' | 'village' | 'kitchen';
  prop: string;
  byteLine: string;
  partnerLine: string;
  partnerFirst?: boolean;
  shyByte?: boolean;
  narration?: string;
}

export const MISSION_STORIES: readonly MissionStory[] = [
  {
    nextMissionId: 'broken-bridge',
    location: 'A trilha do vale',
    scene: 'valley',
    prop: '🌉',
    byteLine: 'Ouvi um rangido vindo dali. Será que o caminho está seguro?',
    partnerLine: 'A ponte está quebrada. Vamos observar antes de dar o próximo passo.',
  },
  {
    nextMissionId: 'bridge-detours',
    location: 'O outro lado da ponte',
    scene: 'valley',
    prop: '↗',
    byteLine: 'Consegui atravessar, mas aquelas duas pontes parecem bem frágeis.',
    partnerLine: 'Vamos verificar cada uma: se estiver quebrada, existe um caminho alternativo.',
    narration: 'Byte e Luma encontram duas pontes quebradas e uma trilha segura contornando o vale.',
  },
  {
    nextMissionId: 'automated-garden',
    location: 'A clareira das sementes',
    scene: 'garden',
    prop: '🌱',
    byteLine: 'Olha quantas sementes chegaram à clareira!',
    partnerLine: 'Há quatro canteiros. Será que conseguimos repetir a tarefa sem copiar os mesmos blocos?',
  },
  {
    nextMissionId: 'byte-house',
    location: 'Uma ideia para o jardim',
    scene: 'garden',
    prop: '🏡',
    byteLine: 'As mudas precisam de um cantinho protegido.',
    partnerLine: 'Vamos desenhar uma casa: primeiro fazemos a planta, depois construímos um objeto.',
  },
  {
    nextMissionId: 'byte-house-methods',
    location: 'A casa ao anoitecer',
    scene: 'village',
    prop: '🌙',
    byteLine: 'A casa está pronta, mas ficou escura quando o sol se pôs.',
    partnerLine: 'Ensine a ela uma ação chamada método. Depois, peça para acender as luzes!',
  },
  {
    nextMissionId: 'byte-pantry',
    location: 'Um lanche para Luma',
    scene: 'kitchen',
    prop: '🥣',
    byteLine: 'Vou preparar um lanche gostoso para você, Luma!',
    partnerLine: 'Que carinho, Byte! Vamos conferir a despensa para começar?',
    partnerFirst: false,
  },
  {
    nextMissionId: 'byte-recipe',
    location: 'O cheirinho de pão',
    scene: 'kitchen',
    prop: '🥖',
    byteLine: 'Então vou deixar a receita cuidar dos detalhes.',
    partnerLine: 'Os ingredientes estão prontos! Byte, você prepara um pão quentinho para nós?',
    partnerFirst: true,
  },
  {
    nextMissionId: 'byte-specialty',
    location: 'Um convite especial',
    scene: 'kitchen',
    prop: '💌',
    shyByte: true,
    byteLine: 'Claro! Vou criar um bolo bem especial para você.',
    partnerLine: 'Byte, você faz um bolo comigo para o piquenique?',
    partnerFirst: true,
    narration: 'Byte fica tímido ao perceber que tem uma quedinha pela amiga Luma.',
  },
  {
    nextMissionId: 'byte-many-dishes',
    location: 'A mesa do piquenique',
    scene: 'kitchen',
    prop: '🍽️',
    byteLine: 'Vou chamar preparar() para cada receita. Quero ver o resultado!',
    partnerLine: 'Pode fazer pão e bolo para o piquenique, Byte?',
    partnerFirst: true,
  },
];
