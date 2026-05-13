---
title: Logging
---

## Overview

Use **child loggers** for structured logging. All code — both teraslice internals and assets — should use `makeExContextLogger` as the primary way to create a logger. Assets always run inside a worker or execution controller and always have access to `context` and `executionConfig`.

## Example

```ts
import { makeExContextLogger } from '@terascope/job-components';

const logger = makeExContextLogger(this.context, this.executionConfig, 'my-reader');
```

This automatically attaches `module`, `ex_id`, `job_id`, `worker_id`, and `assignment` to every log line.

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

Teraslice by default will use a Bunyan logger. The logger works by setting a minimum level; the logger emits messages at that level and all higher severities (e.g., set to info → you’ll see info, warn, error, fatal).
Numeric mapping: trace `10`, debug `20`, info `30`, warn `40`, error `50`, fatal `60`.

- **info** — normal operation and lifecycle events.
- **debug** — step-by-step details during development/troubleshooting, too verbose to be included in "info" level.
- **trace** — extremely fine-grained, temporary diagnostics only.

For the full list and guidance, see [Bunyan’s Levels section](https://github.com/trentm/node-bunyan?tab=readme-ov-file#levels).

## Changing log levels at runtime

Use `context.apis.foundation.setLogLevel(level)` to change the log level for all loggers at once. This updates the root logger and every registered child logger simultaneously.

```ts
context.apis.foundation.setLogLevel('debug');
```

Do **not** call `.level()` directly on individual loggers — child loggers changed in isolation will fall out of sync with the rest of the application.

## Bunyan child logger pitfalls

- **Level changes don't propagate automatically.** In Bunyan, setting a level on a parent logger does not update existing child loggers. This is why `setLogLevel` exists — always use it instead of setting levels directly.
- **Child loggers created outside of `makeLogger` are not tracked.** Only loggers created via `context.apis.foundation.makeLogger()` (or the helper functions below) are registered and updated by `setLogLevel`. Loggers created directly via `context.logger.child()` will be missed.
- **Child logger references are held via `WeakRef`.** The registry stores each child logger as a `WeakRef` so that loggers which are no longer referenced elsewhere can be garbage collected normally — the registry won't keep them alive. A `FinalizationRegistry` callback cleans up the dead `WeakRef` from the set after GC runs, so the set doesn't grow unboundedly over the lifetime of the process.

## Preferred logger helpers

For most teraslice internal code, prefer `makeExContextLogger` over calling `makeLogger` directly. It automatically attaches execution context fields (`ex_id`, `job_id`, `worker_id`, `assignment`) along with your module name:

```ts
import { makeExContextLogger } from '@terascope/job-components';

// Inside a class that has access to context and executionConfig
const logger: Logger = makeExContextLogger(this.context, this.executionConfig, 'my-module');
```

If you're outside of an execution context (no `ExecutionConfig`), use `makeContextLogger` instead:

```ts
import { makeContextLogger } from '@terascope/job-components';

const logger: Logger = makeContextLogger(context, 'my-module');
```

Assets always run inside a worker or execution controller, so they always have an `ExecutionConfig` available. Asset operations extend from `OperationCore`, which sets up a base logger via `makeExContextLogger` automatically. When an asset needs an additional child logger for a sub-component, use `makeExContextLogger` the same way internal teraslice code does.

## Logger field conventions

Child loggers are structured with fields that appear on every log line. Use the following standard fields consistently — do not invent new names for things already covered here:

| Field | Type | Description |
|---|---|---|
| `module` | `string` | The component or sub-module producing the log. Use `snake_case`. Required on all child loggers. |
| `ex_id` | `string` | Execution ID. Added automatically by `makeExContextLogger`. |
| `job_id` | `string` | Job ID. Added automatically by `makeExContextLogger`. |
| `worker_id` | `number` | Cluster worker ID. Added automatically by `makeContextLogger` and `makeExContextLogger`. |
| `assignment` | `string` | Process role (e.g. `worker`, `execution_controller`). Added automatically. |
| `slice_id` | `string` | ID of the current slice being processed. Added at the slice level when relevant. |

For the `module` field, follow the naming pattern already used throughout the codebase: short, descriptive, `snake_case` names that reflect the component — for example `asset_loader`, `execution_scheduler`, `prom_metrics`. Avoid generic names like `handler` or `util` without a qualifying prefix.

## When to add a log

| Situation | Level |
|---|---|
| Service/component startup and shutdown | `info` |
| Operationally significant state changes (connection lost, limit hit, rebalance) | `warn` |
| Internal flow steps useful during troubleshooting | `debug` |
| Errors that stop processing | `error` |
| Unrecoverable failures | `fatal` |
| Temporary, extremely fine-grained diagnostics | `trace` |

Do not add a log line just because something happened — add it because an operator watching a live system would want to know. If a line would only be useful to the person who wrote it, it belongs at `debug` or `trace`, not `info`.

Log **before** an action, not after. If the action hangs or throws, the message still appears:

```ts
// Good — message appears even if the call hangs or throws
logger.debug('Flushing queue before writing next batch');
await this.flush();

// Bad — message is lost if flush() throws
await this.flush();
logger.debug('Flushed queue');
```

## Writing useful log messages

Logs are read by operators searching through output from multiple workers — not by the person who wrote the code. Write every message from that perspective.

**Be specific — include the actual values that matter.**

An operator cannot act on a vague message. Include config parameter names, current values, limits, and what action is being taken:

```ts
// Bad
logger.warn('Buffer is full, flushing...');

// Good
logger.warn(`Buffer size limit reached: max_buffer_size = ${this._maxSize}, current = ${current}. Flushing to prevent overflow`);
```

**Use consistent key phrases across related log lines.**

If an operator greps for a term, every log line in that flow should match. Pick a phrase and use it on every related line:

```ts
// Bad — inconsistent wording, hard to grep
logger.warn('dropping connection');
logger.debug('reconnecting');
logger.info('connection restored');

// Good — "client connection" appears on every related line
logger.warn('client connection lost, initiating reconnect');
logger.debug('client connection attempt starting');
logger.info('client connection restored');
```

**Prefix messages with the subsystem name.**

When multiple operations run in the same worker, log lines from many components are interleaved. A clear prefix makes it immediately obvious where a line came from:

```ts
logger.debug(`Reader flushing queue after processing ${total} records in slice`);
```

**Format lists compactly.**

```ts
// Bad
'assigned partitions: partition: 0, partition: 1, partition: 2'

// Good
`assigned partitions: [${partitions.join(', ')}]`
```

**Use Teraslice domain vocabulary.**

Use `slice` when referring to a Teraslice slice — not `batch`, `chunk`, or `message set`. Consistent terminology makes logs easier to cross-reference with Teraslice documentation and other tooling.

**Read your logs in context before merging.**

Run a real test job that triggers the conditions your logs cover. Read the actual output alongside surrounding log lines from other components. Ask: would an operator understand what happened and why, without access to the source code?

## Notes

- Prefer one child logger per module or unit of work.
- Keep logs structured and small; avoid secrets and large payloads.
