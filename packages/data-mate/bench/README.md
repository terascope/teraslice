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
| `scripts/` | standalone `*-perf-test.js` scripts. Not run by `index.js`; they execute on import |

`fixtures/data.json` is the shared corpus. Its config covers awkward types on purpose: `Short`,
`IP`, `Keyword[]`, `Date`, `GeoPoint`, nested `Object`s, and an array of objects (`results`).
Every suite uses it so that numbers are comparable between suites.

## Adding a suite

Put it in the right `suites/<group>/` directory, name it `*-suite.js`, and `export default` a
function that returns `suite.run(...)`:

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

Asynchronous work needs `defer: true`. Without it, benchmark.js times only how long it takes to
create the promise:

```js
suite.add('an async case', {
    defer: true,
    fn(deferred) {
        doSomethingAsync().then(() => deferred.resolve(), deferred.reject);
    }
});
```

Every `TealFrame` operation is async, so any benchmark of it needs `defer: true`. Its query
operations are also lazy: they only build SQL. A benchmark must force execution, by draining
`rows()` or calling `size()`, or it measures string building.

## Things to watch for

- `pnpm benchmark` builds first; running a suite directly does not. Suites read `dist/`, so after
  changing `src`, run `pnpm build` or you will measure the previous build.
- Do not benchmark through jest. The same ingest workload runs about 4x slower under
  `ts-scripts test` than as a standalone script, because of swc transpilation, the per-file module
  registry, and coverage instrumentation.
