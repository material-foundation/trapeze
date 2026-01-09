import { defineConfig } from 'vite'

// Before vite, we used wireit + tsc for building.  Because tsc checks all the
// types before generating JS, the delay between editing a file and seeing a
// change in-browser got to be too long.  vite short-circuits type checking,
// effectively stripping the types and presenting the result in the browser as
// quickly as possible.
//
// The config below provides vite with raw TypeScript for fast iteration cycles
// when running the dev server, but with tsc-checked JavaScript otherwise.
//
// This is my first try using vite.  We may later find that there's a better way
// to incorporate type-checking (maybe wireit + tsc isn't needed anymore).  For
// now, this gets us the speed of vite's dev cycles without changing how our
// packages are generated.

// This is needed for top-level await.  To support vite as both as dev server
// and a bundler, it needs to be passed to both `optimizeDeps` and `build`.
const target = 'es2022';

export default defineConfig(
  ({ command }) => ({
    // This allows us to colocate the HTML file with its scripts without getting
    // the folder name baked into the HTML path.
    root: command === 'serve'
      ? 'src'
      : 'dist',

    resolve: {
      mainFields: command === 'serve'
        ? ['typescript', 'browser', 'module']
        : ['browser', 'module'],
    },

    optimizeDeps: {
      esbuildOptions: {
        target,
      },
    },
    build: {
      target,

      // ./dist/../site == ./site
      outDir: '../site',
    },
  })
);
