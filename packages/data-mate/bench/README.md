# `bench/` — data-mate benchmarks

```bash
pnpm benchmark                              # build, then run every suite
node bench/suites/data-frame/data-frame-unique-suite.js   # run one directly
```

Built on [benchmark.js](https://benchmarkjs.com) via `lib/helpers.js`, which reports the mean
per operation, the relative margin of error, and the sample count, then names the fastest and
slowest case in each suite.

## Layout

| | |
|---|---|
| `index.js` | discovers and runs every `*-suite.js` under `suites/`, recursively |
| `suites/data-frame/` | `DataFrame` operations |
| `suites/column/` | `Column` / builder operations |
| `suites/aggregation/` | aggregations and `groupBy` |
| `lib/helpers.js` | the `Suite()` wrapper and its reporting |
| `lib/generate-data.js` | regenerates `fixtures/` |
| `fixtures/` | `data.json` (2,000 records) and `data.dfjson`, shared by every suite |
| `scripts/` | one-off `*-perf-test.js` probes. **Not** run by `index.js` — they execute on import |

`fixtures/data.json` is the shared corpus, and its config is deliberately awkward: `Short`, `IP`,
`Keyword[]`, `Date`, `GeoPoint`, nested `Object`s, and an **array of objects** (`results`). Using
it everywhere is what makes numbers comparable between suites.

## It was broken, and this is what was wrong

`pnpm benchmark` ran **zero** benchmarks before 2026-08-14. Five separate faults:

1. **`index.js` called the module namespace, not its default export** — `await initSuite()` where
   `initSuite` was the result of `import()`. Every run died with `TypeError: initSuite is not a
   function` before a single benchmark started.
2. **One bad import killed the whole run.** Loading was a single `pMap` over every suite, so the
   first rejection aborted all of them. Now each suite loads independently and a broken one is
   named and skipped.
3. `aggregrate-suite.js` (also a typo — now `aggregate-suite.js`) read its fixture through
   `path.join('.', './fixtures/data.json')`, i.e. **relative to the cwd**, so it only loaded if
   you happened to run it from inside `bench/`. That was the import that aborted the run.
4. `data-frame-iteration-suite.js` and `data-frame-serialize-suite.js` used `path`,
   `fileURLToPath` and `fs` **without importing them**. The serialize suite also named itself
   after an undefined `fileName`.
5. `data-frame-has-empty-rows-suite.js` matched `-suite.js`, so it was discovered, but had **no
   `export default`** — so it could only ever have thrown.

`scripts/serialize-perf-test.js` also imported `mnemonist/multi-map`, a subpath that is
`require`-only in that package's `exports` map and cannot resolve under ESM at all; it now takes
`MultiMap` off the package root.

## Adding a suite

Put it in the right `suites/<group>/` directory, name it `*-suite.js`, and **`export default`** a
function returning `suite.run(...)`:

```js
import { isExecutedFile } from '@terascope/core-utils';
import { Suite } from '../../lib/helpers.js';
import json from '../../fixtures/data.json' with { type: 'json' };
import { DataFrame } from '../../../dist/src/index.js';

const { config, data } = json;

const run = async () => {
    const suite = Suite('DataFrame->something');

    suite.add('a case', {
        fn() {
            /* synchronous work */
        }
    });

    return suite.run({
        async: true, initCount: 2, minSamples: 2, maxTime: 20,
    });
};

export default run;

if (isExecutedFile(import.meta.url)) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
}
```

**Asynchronous work needs `defer: true`**, or benchmark.js times only how long it took to create
the promise:

```js
suite.add('an async case', {
    defer: true,
    fn(deferred) {
        doSomethingAsync().then(() => deferred.resolve(), deferred.reject);
    }
});
```

Anything measuring `DuckFrame` needs this, since every one of its operations is async — and note
that its query operations are **lazy relations**, so a benchmark must force execution (drain
`rows()`, or `size()`) or it measures SQL string building.

Import `DuckFrame` from `../../../dist/src/duck-frame/DuckFrame.js`, **not** from
`dist/src/index.js`: `duck-frame` is deliberately not re-exported there, so the package-root
import yields `undefined` rather than an error.

## Two traps worth knowing

- **`pnpm benchmark` builds first; running a suite directly does not.** A suite reads
  `dist/`, so after changing `src` run `pnpm build` or you are measuring the previous build.
- **Do not benchmark through jest.** Measured: the same ingest workload reports ~4× worse under
  `ts-scripts test` than as a standalone script, thanks to swc transpilation, the per-file module
  registry, and coverage instrumentation.
