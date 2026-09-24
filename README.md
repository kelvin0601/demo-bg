# Linearity effects — standalone

This directory is a self-contained Vite application. It does not import files
from the parent Nuxt project.

## Run

```bash
cd standalone-effects
pnpm install
pnpm dev
```

Open the URL printed by Vite, then choose one of the two playgrounds:

- `/background.html` — original `WebGLBackgroundCore` GLSL pipeline
- `/glow.html` — original `GlowingEdgeOverlayCore` multi-pass WebGL pipeline
- `/buttons.html` — standalone Home `ButtonKP` variants and sizes

Use the controller button in the lower corner to open the full control panel.

## Production build

```bash
pnpm build
pnpm preview
```

The production output is written to `dist/`.
