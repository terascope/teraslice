# Reference: top-level job schema

**Authoritative, always-current source — `WebFetch` this:**
`https://terascope.github.io/teraslice/docs/jobs/configuration`

Schema source of truth in the codebase (for maintainers):
`packages/job-components/src/job-schemas.ts`.

The cheat-sheet below is for quick answers. For the full field list, exact
types, and worked examples, fetch the configuration page above.

## Top-level fields (cheat sheet)

| Field | Type | Default | Notes |
|---|---|---|---|
| `name` | string | `"Custom Job"` | Required in practice; label for the job |
| `lifecycle` | `"once"` \| `"persistent"` | `"once"` | `once` = batch, exits on completion; `persistent` = streaming |
| `operations` | array | `[]` | **Required. Must have ≥ 2 entries** (reader + at least one more) |
| `apis` | array | `[]` | Reusable APIs; each needs a unique `_name` (see `apis.md`) |
| `assets` | string[] | `null` | Asset bundle IDs/names/versions, e.g. `["elasticsearch:4.0.2"]` |
| `workers` | positive int | `min(cpuCount, 5)` | Worker instances processing data |
| `slicers` | positive int | `1` | Parallel slicer contexts |
| `analytics` | boolean | `true` | Record per-slice timing/doc counts |
| `max_retries` | nat (≥0) | `3` | Retries per slice after an error |
| `probation_window` | duration (ms) | `300000` | `persistent` only — window EC checks for failed slices |
| `stateful` | boolean | `false` | Worker maintains internal state |
| `active` | boolean | `true` | Marker only; Teraslice doesn't act on it |
| `autorecover` | boolean | `false` | Recover pending slices from last stopped execution |
| `env_vars` | object | `{}` | `{ "KEY": "value" }` set on each worker |
| `log_level` | string | `null` | one of `trace debug info warn error fatal` |
| `labels` | object | `null` | key/value labels for k8s resources |

## Kubernetes-only fields

These exist **only** when the cluster manager is `kubernetesV2`. Don't add
them for a native/other cluster manager — lint flags them.

- `resources_requests_cpu`, `resources_requests_memory`
- `resources_limits_cpu`, `resources_limits_memory`
- `cpu_execution_controller`, `memory_execution_controller`
- `targets` (array of `{key, value}` node-targeting labels)
- `volumes` (array of `{name, path}`)
- `ephemeral_storage`, `external_ports`, `pod_spec_override`
- `kubernetes_image`
- `prom_metrics_enabled`, `prom_metrics_port`, `prom_metrics_add_default`

**Deprecated:** `cpu` → use `resources_requests_cpu`; `memory` → use
`resources_requests_memory`.

## Per-operation fields (generic — apply to every op)

Every entry in `operations` is an object with at least an `_op`. See
`operations.md` for details.

| Field | Default | Notes |
|---|---|---|
| `_op` | — | **Required.** Must match the operation's file/folder name |
| `_encoding` | `"json"` | Data encoding for `DataEntity.fromBuffer` |
| `_dead_letter_action` | `"throw"` | `throw` \| `log` \| `none`, or a registered DLQ API name |

Everything else on an op is defined by that op's own schema (in its asset
bundle) — fetch the bundle's docs for those fields.
