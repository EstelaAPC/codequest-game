# CodeQuest

CodeQuest is a small, playable programming-learning game set in Codária. Players build safe command sequences, watch Byte carry them out, and learn sequencing, conditions, loops, classes, objects, and methods through nine missions.

## Play locally

Requirements: Node.js and npm.

```bash
npm ci
npm start
```

Open `http://localhost:4200/`. Byte introduces himself on a full-screen welcome page with an animated speech bubble. Every mission begins with a clear concept lesson and a visual demonstration. Click a block or drag it into the sequence; drag existing blocks to change their order, then select **Executar** to watch Byte follow the code. The read-only TypeScript view highlights each command line green after a successful action and red when the interpreter stops on an error. Use the **Mundo** shortcut to explore Codária; Byte moves along the illustrated route as missions are completed. The completion celebration can be closed to return to the program or used to open the map. On mobile, the game and code editor appear side by side. Progress is saved in browser `localStorage` when available.

## Commands and missions

- **O Primeiro Movimento:** sequence `Avançar` commands to reach the crystal.
- **A Ponte Quebrada:** use the bridge condition before crossing; an unchecked move stops safely.
- **O Jardim Automatizado:** repeat the move-and-plant action to fill all four plots.
- **A Casa do Byte:** add properties to the `Casa` class and create Byte’s house object.
- **A Casa Ganha Vida:** call methods on Byte’s house to open the door, ring the bell, or turn on the lights.
- **A Despensa Protegida:** encapsulate pantry stock behind methods that validate additions and removals.
- **A Receita Misteriosa:** use abstraction to prepare bread through one high-level method call.
- **A Receita de Família:** inherit common preparation from `Receita` and add a specialized cake recipe.
- **Um Comando, Muitos Pratos:** use the same `preparar()` method to make bread and cake differently.

The TypeScript panel is read-only. The game executes only the typed, bounded command interpreter in `src/app/game/interpreter.ts`; it does not evaluate player-provided JavaScript.

## Checks

```bash
npm test -- --watch=false
npm run build
```

Unit tests cover the interpreter and the Angular mission/editor view. There is no end-to-end test framework configured yet.

## GitHub Pages

The `Deploy to GitHub Pages` workflow builds with `/codequest-game/` as the base path, runs unit tests, and publishes the Angular browser bundle. Enable **Settings → Pages → Build and deployment → GitHub Actions** in the repository before the first deployment. The workflow deploys on pushes to `main` and can also be started manually.

## Art and credits

All game character and interface artwork is original inline SVG/CSS authored for this project; no third-party art, fonts, audio, or runtime asset URLs are required. Details are recorded in [ASSET_CREDITS.md](src/assets/licenses/ASSET_CREDITS.md).
