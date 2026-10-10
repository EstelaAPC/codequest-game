import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { MISSIONS } from './game/interpreter';
import { MISSION_STORIES } from './game/stories';
import { vi } from 'vitest';

function createDragEvent(type: string): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: { effectAllowed: '', dropEffect: '', setData: () => undefined },
  });
  return event;
}

function selectMission(fixture: ComponentFixture<App>, index: number): void {
  const native = fixture.nativeElement as HTMLElement;
  (native.querySelector('.world-map-button') as HTMLButtonElement).click();
  fixture.detectChanges();
  const stop = native.querySelectorAll('.world-map-stop')[index - 1];
  expect(stop).toBeTruthy();
  (stop as HTMLButtonElement).click();
  fixture.detectChanges();
}

async function runProgram(fixture: ComponentFixture<App>): Promise<void> {
  const native = fixture.nativeElement as HTMLElement;
  vi.useFakeTimers();
  try {
    (native.querySelector('.run-button') as HTMLButtonElement).click();
    await vi.advanceTimersByTimeAsync(560 * 30);
    fixture.detectChanges();
  } finally {
    vi.useRealTimers();
  }
}

describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('codequest-progress-v1');
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('makes the first cooking story a treat Byte prepares for Luma', () => {
    const pantryStory = MISSION_STORIES.find((story) => story.nextMissionId === 'byte-pantry');
    expect(pantryStory?.byteLine).toContain('para você, Luma');
    expect(pantryStory?.partnerFirst).toBe(false);
    expect(MISSION_STORIES.flatMap((story) => [story.byteLine, story.partnerLine, story.narration ?? '']).join(' ')).not.toContain('Nina');
    const abstractionMission = MISSIONS.find((mission) => mission.id === 'byte-recipe');
    expect(abstractionMission?.objective).toContain('Luma');
    expect(abstractionMission?.example).toContain('Luma');
  });

  it('renders the CodeQuest mission interface', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('O Primeiro Movimento');
    expect(compiled.querySelector('.game-board')).toBeTruthy();
    expect(compiled.querySelector('.code-panel')).toBeTruthy();
    expect(compiled.querySelector('.intro-dialog')?.textContent).toContain('Oi! Eu sou o Byte.');
    expect(compiled.querySelector('.intro-speech-bubble')).toBeTruthy();
    expect(compiled.querySelector('[role="dialog"]')?.textContent).toContain('Uma instrução de cada vez');
    expect(compiled.querySelector('.mission-objective .objective-label')?.textContent).toContain('OBJETIVO');
    expect(compiled.querySelector('.mission-objective strong')?.textContent).toContain('cristal');
    expect(compiled.querySelector('.kitchen-pantry-card')).toBeNull();
    expect(compiled.querySelector('.scene-character .luma-avatar-art')).toBeTruthy();
    expect(compiled.querySelector('.mentor-avatar .luma-avatar-art')).toBeTruthy();
    expect(compiled.querySelector('.scene-label')).toBeNull();
    expect(compiled.querySelector('.journey-panel')).toBeNull();
    expect(compiled.querySelector('.world-map-button')).toBeTruthy();
    expect(compiled.querySelector('.step-button')).toBeNull();
  });

  it('opens a Codária map from the compact world shortcut', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;

    (native.querySelector('.world-map-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(native.querySelector('.world-map-dialog')).toBeTruthy();
    expect(native.querySelectorAll('.world-map-stop')).toHaveLength(10);
    expect((native.querySelector('.world-map-byte') as HTMLElement).style.left).toBe('15%');
    (native.querySelector('.world-map-close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.world-map-dialog')).toBeNull();
  });

  it('adds blocks to the program editor', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const lessonButton = fixture.nativeElement.querySelector('.lesson-primary') as HTMLButtonElement;
    (fixture.nativeElement.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    lessonButton.click();
    fixture.detectChanges();
    const startButton = fixture.nativeElement.querySelector('.lesson-primary') as HTMLButtonElement;
    startButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.coachmark-dialog')).toBeTruthy();
    (fixture.nativeElement.querySelector('.coachmark-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.library-block') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.program-row').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.code-preview')?.textContent).toContain('byte.avancar();');
  });

  it('supports dragging blocks into the program and reordering them', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;

    (native.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.coachmark-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    selectMission(fixture, 2);
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();

    const moveBlock = native.querySelector('.move-block') as HTMLButtonElement;
    const programList = native.querySelector('.program-list') as HTMLElement;
    moveBlock.dispatchEvent(createDragEvent('dragstart'));
    programList.dispatchEvent(createDragEvent('dragover'));
    programList.dispatchEvent(createDragEvent('drop'));
    fixture.detectChanges();
    (native.querySelector('.condition-block') as HTMLButtonElement).click();
    fixture.detectChanges();

    const rows = native.querySelectorAll('.program-row');
    rows[1].dispatchEvent(createDragEvent('dragstart'));
    rows[0].dispatchEvent(createDragEvent('dragover'));
    rows[0].dispatchEvent(createDragEvent('drop'));
    fixture.detectChanges();

    const orderedRows = native.querySelectorAll('.program-row .row-block');
    expect(orderedRows[0].textContent).toContain('Se houver ponte');
    expect(orderedRows[1].textContent).toContain('Avançar');
  });

  it("builds Byte's house from class properties and shows the object in the scene", async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;

    (native.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    selectMission(fixture, 5);
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.demo-house-picture')).toBeTruthy();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.coachmark-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(native.querySelector('.byte-house-stage')).toBeTruthy();
    for (const propertyBlock of Array.from(native.querySelectorAll('.house-block'))) {
      (propertyBlock as HTMLButtonElement).click();
      fixture.detectChanges();
    }
    expect(native.querySelector('.code-preview')?.textContent).toContain('class Casa');
    expect(native.querySelector('.code-preview')?.textContent).toContain('const casaDoByte = new Casa()');

    await runProgram(fixture);
    expect(native.querySelector('.house-roof.house-feature-active')).toBeTruthy();
    expect(native.querySelector('.house-door.house-feature-active')).toBeTruthy();
    expect(native.querySelector('.house-window.house-feature-active')).toBeTruthy();
    expect(native.querySelector('.celebration-dialog')?.textContent).toContain('Você conseguiu!');
  });

  it('teaches house methods and animates the selected action', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;

    (native.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    selectMission(fixture, 6);
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.demo-method-picture')).toBeTruthy();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.coachmark-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    (native.querySelector('.method-block:nth-child(3)') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.code-preview')?.textContent).toContain('casaDoByte.acenderLuzes();');
    await runProgram(fixture);

    expect(native.querySelector('.byte-house-stage.house-lights-on')).toBeTruthy();
    expect(native.querySelector('.celebration-dialog')?.textContent).toContain('Você conseguiu!');
  });

  it('shows the concept explanation before the animated lesson demonstration', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.lesson-demo')).toBeNull();
    (fixture.nativeElement.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.lesson-demo')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.demo-code-line')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.demo-world-track')).toBeTruthy();
  });

  it('assembles code alongside the matching world demonstration for each concept', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;

    (native.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.demo-code')?.textContent).toContain('byte.avancar();');
    expect(native.querySelector('.demo-world-track')).toBeTruthy();

    selectMission(fixture, 2);
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.demo-code')?.textContent).toContain('if (haPonteAFrente)');
    expect(native.querySelector('.condition-world')).toBeTruthy();

    selectMission(fixture, 4);
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.demo-code')?.textContent).toContain('for (let volta = 0;');
    expect(native.querySelector('.loop-world')?.querySelectorAll('.loop-plot').length).toBe(4);
  });

  it('marks each executed code line green and a blocked command red', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;

    (native.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    for (let index = 0; index < 4; index += 1) {
      (native.querySelector('.move-block') as HTMLButtonElement).click();
      fixture.detectChanges();
    }
    await runProgram(fixture);

    expect(native.querySelector('.code-line[data-status="success"]')).toBeTruthy();

    selectMission(fixture, 2);
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    for (let index = 0; index < 2; index += 1) {
      (native.querySelector('.move-block') as HTMLButtonElement).click();
      fixture.detectChanges();
    }
    (native.querySelector('.move-block') as HTMLButtonElement).click();
    fixture.detectChanges();
    await runProgram(fixture);

    expect(native.querySelector('.code-line[data-status="error"]')).toBeTruthy();
    expect(native.querySelector('.byte-sprite.byte-worried')).toBeTruthy();
  });

  it('celebrates a completed mission and lets the player continue', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;

    (native.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();

    for (let index = 0; index < 4; index += 1) {
      (native.querySelector('.move-block') as HTMLButtonElement).click();
      fixture.detectChanges();
    }
    await runProgram(fixture);

    expect(native.querySelector('.celebration-dialog')?.textContent).toContain('Você conseguiu!');
    expect(native.querySelector('.celebration-confetti')).toBeTruthy();
    expect(native.querySelector('.byte-sprite.byte-happy')).toBeTruthy();
    (native.querySelector('.world-map-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect((native.querySelector('.world-map-byte') as HTMLElement).style.left).toBe('50%');
    expect(native.querySelector('.world-map-stop.finished')).toBeTruthy();
    (native.querySelector('.world-map-close') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.celebration-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.celebration-dialog')).toBeNull();
    expect(native.querySelector('.story-dialog')).toBeTruthy();
    expect(native.querySelector('.story-luma-art')).toBeTruthy();
    expect(native.querySelector('.story-dialog .story-partner-art')).toBeNull();
    (native.querySelector('.story-continue') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.lesson-dialog h2')?.textContent).toContain('Decidir com if');
  });

  it('keeps the final action visible before opening the celebration', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;

    (native.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    for (let index = 0; index < 4; index += 1) {
      (native.querySelector('.move-block') as HTMLButtonElement).click();
      fixture.detectChanges();
    }

    vi.useFakeTimers();
    try {
      (native.querySelector('.run-button') as HTMLButtonElement).click();
      await vi.advanceTimersByTimeAsync(560 * 4);
      fixture.detectChanges();
      expect(native.querySelector('.celebration-dialog')).toBeNull();
      expect(native.querySelector('.byte-sprite.byte-happy')).toBeTruthy();

      await vi.advanceTimersByTimeAsync(1399);
      fixture.detectChanges();
      expect(native.querySelector('.celebration-dialog')).toBeNull();
      await vi.advanceTimersByTimeAsync(1);
      fixture.detectChanges();
      expect(native.querySelector('.celebration-dialog')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reopens the mission lesson without clearing the assembled program', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;

    (native.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.coachmark-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.move-block') as HTMLButtonElement).click();
    fixture.detectChanges();
    const previousCode = native.querySelector('.code-preview')?.textContent;

    (native.querySelector('.lesson-replay-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.lesson-dialog h2')?.textContent).toContain('Uma instrução');
    expect(native.querySelector('.lesson-takeaways')?.textContent).toContain('de cima para baixo');
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(native.querySelector('.lesson-dialog')).toBeNull();
    expect(native.querySelector('.code-preview')?.textContent).toBe(previousCode);
    expect(native.querySelectorAll('.program-row')).toHaveLength(1);
  });

  it('teaches the four OOP pillars with interactive cooking missions', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    (native.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.coachmark-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const concepts = [
      { index: 7, title: 'Encapsulamento', code: 'private farinha' },
      { index: 8, title: 'Abstração', code: 'receita.preparar();' },
      { index: 9, title: 'Herança', code: 'extends Receita' },
      { index: 10, title: 'Polimorfismo', code: 'receitas[0].preparar();' },
    ];
    for (const concept of concepts) {
      selectMission(fixture, concept.index);
      expect(native.querySelector('.lesson-concept')?.textContent).toContain(concept.title);
      expect(native.querySelector('.lesson-explanation')?.textContent.toLowerCase()).toContain(concept.title.toLowerCase());
      (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(native.querySelector('.demo-kitchen-world')).toBeTruthy();
      expect(native.querySelector('.demo-code-line')).toBeTruthy();
      if (concept.index === 7) {
        expect(native.querySelector('.demo-pantry')).toBeTruthy();
        expect(native.querySelector('.demo-pantry')?.textContent).toContain('estoque protegido');
      }
      (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(native.querySelector('.kitchen-stage')).toBeTruthy();
      if (concept.index === 7) {
        expect(native.querySelectorAll('.kitchen-library')).toHaveLength(4);
        expect(native.querySelector('.mission-objective strong')?.textContent).toContain('2 porções de farinha e 1 ovo');
      }
      (native.querySelector('.kitchen-library') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(native.querySelector('.code-preview')?.textContent).toContain(concept.code);
      if (concept.index === 7) {
        for (const index of [0, 2]) {
          (native.querySelectorAll('.kitchen-library')[index] as HTMLButtonElement).click();
          fixture.detectChanges();
        }
        await runProgram(fixture);
        expect(native.querySelector('.pantry-egg-bowl strong')?.textContent).toContain('1 / 1');
        expect(native.querySelector('.pantry-flour-spot strong')?.textContent).toContain('2 / 2');
        expect(native.querySelector('.kitchen-pantry-card')).toBeNull();
        expect(native.querySelector('.celebration-dialog')).toBeTruthy();
        (native.querySelector('.celebration-close') as HTMLButtonElement).click();
        fixture.detectChanges();
      }
    }
  });

  it('lets the player close or explore the world from the celebration', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const native = fixture.nativeElement as HTMLElement;
    (native.querySelector('.intro-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.coachmark-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    for (let index = 0; index < 4; index += 1) {
      (native.querySelector('.move-block') as HTMLButtonElement).click();
      fixture.detectChanges();
    }
    await runProgram(fixture);

    expect(native.querySelector('.celebration-dialog')).toBeTruthy();
    (native.querySelector('.celebration-world') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.celebration-dialog')).toBeNull();
    expect(native.querySelector('.world-map-dialog')).toBeTruthy();
    (native.querySelector('.world-map-close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.world-map-dialog')).toBeNull();

    (native.querySelector('.world-map-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    selectMission(fixture, 1);
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.lesson-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    (native.querySelector('.coachmark-button') as HTMLButtonElement)?.click();
    fixture.detectChanges();
    for (let index = 0; index < 4; index += 1) {
      (native.querySelector('.move-block') as HTMLButtonElement).click();
      fixture.detectChanges();
    }
    await runProgram(fixture);
    (native.querySelector('.celebration-close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(native.querySelector('.celebration-dialog')).toBeNull();
    expect(native.querySelector('.game-board')).toBeTruthy();
    expect(native.querySelector('.run-button')).toBeTruthy();
  });
});
