# Web68K

A web-based environment for writing, assembling, running and debugging
**Motorola 68000** assembly programs, entirely in the browser.

Web68K is the front-end application developed as part of the final degree project
*"Web68K: A web environment for simulating the Motorola 68000 processor"*. It brings
the editor–assembler–simulator workflow of tools such as
[EASy68K](http://www.easy68k.com/) to a single, integrated, cross-platform web page,
with no installation required.

**Live application: <https://web68k.kjorda.com/>**

## Features

- **Code editor** with M68K syntax highlighting, breakpoints, address gutters and
  auto-save (powered by CodeMirror and a custom [Lezer](https://lezer.codemirror.net/)
  grammar).
- **Integrated assembler** — the [VASM](http://sun.hasenbraten.de/vasm/) assembler,
  compiled to WebAssembly, with inline error reporting.
- **68000 simulator** — a CPU core written in C and compiled to WebAssembly, with
  step-into / step-over / step-out debugging and breakpoints.
- **Register and memory editors** that reflect and modify the CPU state in real time.
- **Memory-mapped I/O panel** with a 7-segment display, LEDs, switches and buttons.
- **File picker** with multi-file projects, folders, and import/export, persisted in
  the browser's `localStorage`.
- **Single-window, resizable layout** — every panel is visible at once.

## Architecture overview

The application is a [SvelteKit](https://svelte.dev/docs/kit) single-page app. It runs
**fully client-side** (server-side rendering is disabled) and relies on two WebAssembly
modules that are loaded at runtime:

| Module                     | Source language | Role                                   | Served from                  |
| -------------------------- | --------------- | -------------------------------------- | ---------------------------- |
| `cpu.wasm`                 | C               | The 68000 simulator core               | `static/cpu.wasm`            |
| `vasmm68k_motvasm.wasm`    | C (VASM)        | The assembler                          | `static/vasmm68k_motvasm.wasm` |

These two `.wasm` files are **pre-compiled and committed to this repository** (under
`static/`), so building the web app does **not** require a C toolchain. They are fetched
from the site root (`/cpu.wasm`, `/vasmm68k_motvasm.wasm`) and instantiated with
`WebAssembly.instantiateStreaming` in `src/lib/cpu.svelte.ts` and
`src/lib/assembler.svelte.ts` respectively.

> The C source for the simulator and the build instructions for the VASM WebAssembly
> module (both compiled with [Emscripten](https://emscripten.org/)) live in a separate
> repository: **<https://github.com/kjorda02/Web68k>**. To rebuild them, recompile the
> respective sources to WebAssembly there and replace the files in `static/`.

### Project layout

```
src/
├─ routes/                 SvelteKit routes (single page, SSR disabled)
│  ├─ +page.svelte         Main layout: editor, simulator, memory, I/O, file tree
│  └─ +layout.js           ssr = false
├─ components/             Application components (Editor, Emulator, Memory, IO, Files…)
├─ lib/
│  ├─ cpu.svelte.ts        Wrapper around cpu.wasm: registers, memory, debugging
│  ├─ assembler.svelte.ts  Wrapper around the VASM wasm module
│  ├─ language/            M68K Lezer grammar + generated parser, syntax highlighting
│  ├─ components/ui/       Reusable UI primitives (bits-ui / shadcn-svelte style)
│  └─ wasm/                Spare copies of the wasm modules (the served ones are in static/)
└─ app.css / app.html      Global styles and HTML shell
static/                    Static assets served at the site root, including the .wasm modules
```

## Requirements

- **[Node.js](https://nodejs.org/) 20 or newer** (developed with Node 22 LTS) and npm.
- A modern, WebAssembly-capable browser to run the app.

No C compiler, Emscripten, or other native toolchain is needed to build or run the web
app — the WebAssembly modules are already compiled and included.

## Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/kjorda02/Web68k-app.git
cd Web68k-app
npm install
```

## Development

Start the Vite development server with hot-module reloading:

```bash
npm run dev

# or open it in a new browser tab automatically
npm run dev -- --open
```

The app will be available at the URL printed in the terminal (by default
<http://localhost:5173>).

## Building for production

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Type checking

Run the Svelte/TypeScript checker:

```bash
npm run check
# or, watching for changes
npm run check:watch
```

## Regenerating the syntax-highlighting parser

Syntax highlighting for M68K assembly is driven by a [Lezer](https://lezer.codemirror.net/)
grammar at `src/lib/language/m68k.grammar`. The generated files `parser.js` and
`parser.terms.js` are committed, so this step is **only** needed if you modify the grammar:

```bash
npx lezer-generator src/lib/language/m68k.grammar -o src/lib/language/parser.js
```

## Technologies

- [Svelte 5](https://svelte.dev/) and [SvelteKit](https://svelte.dev/docs/kit)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite 6](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [CodeMirror 6](https://codemirror.net/) + [Lezer](https://lezer.codemirror.net/) for the editor
- [bits-ui](https://bits-ui.com/) for UI primitives
- [WebAssembly](https://webassembly.org/) for the simulator (C) and assembler (VASM)

## License

This project's own source code is released under the **MIT License** — see the
[`LICENSE`](./LICENSE) file. All of the web/npm dependencies listed above are also
MIT-licensed, so they are fully compatible.

One exception: the bundled WebAssembly build of the **VASM** assembler
(`static/vasmm68k_motvasm.wasm`) is distributed under
[VASM's own license](http://sun.hasenbraten.de/vasm/) (free for personal and
educational use), which is separate from the MIT license. See the `LICENSE` file for
details.
