# Escaping Flatland

> *“Even though we navigate daily through a perceptual world of three dimensions… the world displayed on our information displays is caught up in the two dimensionality of the endless flatlands of paper and video screens… Escaping this flatland is the essential task of envisioning information — for all the interesting worlds that we seek to understand are inevitably and happily multivariate in nature. Not flatlands.”* (Tufte 1990)

Computer screens have the ability to display a wide range of information. Beyond 3D coordinates, they can simultaneously show colors, dynamic patterns, rotations, and motions, enabling human eyes to observe and interpret complex datasets. Zooming further enhances this by allowing both micro and macro readings on the same device, supporting more comprehensive data analysis.

This project demonstrates optimization techniques for plotting large datasets in a 3D space using Three.js and Octree. It also explores how Three.js can be integrated into a Svelte project, though [Threlte](https://threlte.xyz/) offers a more mature solution for this purpose.

## Developing

1. Under the project root, make sure you're running node 20 or run `nvm use` if you have nvm installed.
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

## To-do list

- [x] implement scene/canvas component
- [x] implement mesh component
- [x] add some mock data
- [x] implement frustum culler
- [ ] deploy onto a hosting service provider
