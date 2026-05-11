# Escaping Flatland

[![Netlify Status](https://api.netlify.com/api/v1/badges/ac853137-01da-4821-ad25-9782cd078ffe/deploy-status)](https://app.netlify.com/sites/escaping-flatland/deploys)

> *“Even though we navigate daily through a perceptual world of three dimensions… the world displayed on our information displays is caught up in the two dimensionality of the endless flatlands of paper and video screens… Escaping this flatland is the essential task of envisioning information — for all the interesting worlds that we seek to understand are inevitably and happily multivariate in nature. Not flatlands.”* (Tufte 1990)

Computer screens have the ability to display a wide range of information. Beyond 3D coordinates, they can simultaneously show colors, dynamic patterns, rotations, and motions, enabling human eyes to observe and interpret complex datasets.

This project renders **1 million particles** in real time inside a browser using Three.js and a sparse Octree. You can orbit the camera, click any star to focus on it and inspect its data (rotation speed, planet count, differential rotation constants), and watch a miniature solar system appear around your selection. It also explores how Three.js can be integrated into a Svelte 5 project, though [Threlte](https://threlte.xyz/) offers a more mature solution for this purpose.

## Live Demo

Try [the live demo](https://escaping-flatland.netlify.app)!

## Implementation Detail

Read [the article](https://jtingjiang.com/works/escaping-flatland)

## Features

- **1M particles** rendered in real time using instanced meshes and a sparse Octree
- **Frustum culling** — only particles inside the camera view are processed each frame
- **Three-tier LOD** — HD / SD / LD geometry tiers based on distance from camera
- **Click to explore** — select a star to see its data (rotation speed, planet count, differential rotation) and animate the camera to it
- **Solar system** — selected star spawns orbiting planets
- **Bloom post-processing** — selective glow effect with configurable strength
- **Labels** — instanced billboard sprites rendered without individual draw calls
- **Search bar** — jump to any star by index from the top-center search input
- **Orientation gizmo** — interactive ViewHelper in the bottom-right corner for quick axis alignment
- **Settings panel** — toggle labels, bloom, auto-rotate, debug stats, and more (press `O`)
- **Loading overlay** — animated splash while the Octree initializes

## Tech Stack

| Category | Libraries |
|---|---|
| Framework | Svelte 5, SvelteKit |
| 3D / WebGL | Three.js, sparse-octree |
| Animation | @tweenjs/tween.js, @number-flow/svelte |
| UI | Tailwind CSS 4, Bits UI, shadcn-svelte, Lucide Svelte |
| Testing | Vitest, Playwright |
| Deployment | Netlify / Docker image |

## Project Structure

```
src/lib/
├── components/
│   ├── galaxy/           # Root orchestrator — wires all sub-components together
│   ├── providers/scene/  # Three.js scene, camera, renderer, and OrbitControls - as context
│   ├── meshes/           # Interface to use Three.js meshes as Svelte components
│   ├── dashboard/        # StarDashboard — selected-star info panel
│   ├── modals/           # OptionModal & HelpModal — dialogs
│   ├── loading/          # LoadingOverlay — splash screen
│   ├── lights/           # HemisphereLight — scene lighting
│   ├── search-bar/       # SearchBar — jump to star by index
│   ├── ui                # components from shadcn-svelte
│   └── interaction/      # Mouse raycasting, hover labels, camera tween
├── meshes/
│   ├── particles/               # BufferGeometry wrapper with custom visibility shader
│   ├── star/                    # LOD star model with differential rotation
│   ├── planet/ & solar-system/  # Orbiting planets spawned on star selection
│   ├── instanced-label-sprites/ # Canvas texture atlas + shader for N labels in 1 draw call
│   └── view-helper/             # Interactive orientation gizmo (ViewHelper)
└── utils/
    ├── FrustumCuller.ts     # Core culling: Octree traversal → HD/SD/LD InstancedMesh updates
    ├── SelectiveBloom.js    # Two-pass bloom compositor (UnrealBloomPass + custom shader)
    ├── tweenCamera.js       # Smooth camera focus animation
    ├── buildPointOctree.js  # build a sparse Octree
    └── dataSources.js       # Pluggable data source interface (currently: random galaxy, 1M pts)
```

## Developing

1. Under the project root, make sure you're running node 24 or run `nvm use` if you have nvm installed.
2. Install dependencies with `npm install` (or `pnpm install` or `yarn`)
3. Start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

## Build & Run with Docker

1. Build image

    ```bash
    docker build -t="escaping_flatland" .
    ```

2. Run the built image

    ```bash
    # run container and redirect host port 3000 to container port 3000
    docker run --name escaping -d -p 3000:3000 escaping_flatland
    ```

3. Visit to play the demo [localhost:3000](localhost:3000)
4. Stop & remove the image

    ```bash
    docker stop escaping
    docker rm escaping
    docker rmi escaping_flatland
    ```
