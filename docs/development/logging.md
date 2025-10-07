---
title: Logging
---

## Overview

Use **child loggers** for structured logging.

- **Assets:** `context.apis.foundation.makeLogger(meta)`
- **Teraslice code:** `makeLogger(context, moduleName)`

Both helpers return a child logger that includes your metadata and context. The `makeLogger` function which can be found in `<teraslice_repo_dir>/packages/teraslice/src/lib/workers/helpers/terafoundation.ts` is used only within teraslice itself as it isn't exported out for assets to use.

## Asset example

```js
import { BatchProcessor } from '@terascope/job-components';

export default class Example extends BatchProcessor {
    onBatch(dataArray) {
        // Adding a child logger with the module name 'example-processor'
        this.context.apis.foundation.makeLogger({ module: 'example-processor'});
        return dataArray;
    }
}
```

## Teraslice example

```js
// This is imported from the terafoundation.js file and should be used when adding logs within teraslice
import { makeLogger } from '<teraslice_dir>/dist/src/lib/workers/helpers/terafoundation.js';

export function createClient(context) {
  const logger = makeLogger(context, 'create-client');

  logger.info('Creating client');
  logger.debug('Initializing connection');

  try {
    // ... client logic ...
  } catch (err) {
    logger.error({ err }, 'Failed to create client');
    throw err;
  }

  logger.info('Client ready');
}
```

## Log levels

- **info** — lifecycle or significant actions (start, stop, created, done).
- **debug** — step-by-step details during development/troubleshooting.
- **trace** — extremely fine-grained, temporary diagnostics only.

## Notes

- Prefer one child logger per module or unit of work.
- Keep logs structured and small; avoid secrets and large payloads.
