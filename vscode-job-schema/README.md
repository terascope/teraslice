# Teraslice Job Schema (VSCode extension)

Autocomplete, validation, and hover docs for **Teraslice job files** directly in VSCode —
no running cluster required. It bundles a draft-07 JSON Schema for the job config and tells
VSCode to apply it to any file named `*.tsjob.json`.

The schema is hand-written from the Teraslice source:
- `packages/job-components/src/job-schemas.ts` (`jobSchema`) — top-level fields
- `packages/types/src/teraslice.ts` (`ValidatedJobConfig`, `OpConfig`, `APIConfig`) — operations & apis

## What you get
- Autocomplete on property names and enum fields (e.g. `lifecycle` → `once` / `persistent`)
- Red underline on invalid values, wrong types, and missing required fields (`name`, `operations`, `_op`, `_name`)
- Hover docs pulled from the schema descriptions
- Coverage: all top-level job fields (including Kubernetes-only fields), `operations[]`
  (common `_op` / `_api_name` / `_connection` / `_encoding` / `_dead_letter_action`), and `apis[]`.

Operation- and API-*specific* options (the config a given `_op` or `_name` accepts) are
provided by the asset and are intentionally **not** validated here — those need the assets
loaded (see teraslice issue #4563).

## How a file opts in
Name it `*.tsjob.json` (e.g. `my-pipeline.tsjob.json`). That filename **is** the opt-in — plain
`config.json` / `tsconfig.json` are untouched. No `$schema` key needed once the extension is
installed.

## Build the `.vsix`
```bash
cd vscode-job-schema
npx @vscode/vsce package
# -> teraslice-job-schema-0.1.0.vsix
```

## Installing the delivered `.vsix`
The deliverable is the single file `teraslice-job-schema-0.1.0.vsix`. It is **not** published to
any marketplace — it is installed directly from the file. Two ways:

### Option A — command line (`code` CLI)
```bash
code --install-extension teraslice-job-schema-0.1.0.vsix
```
Requires the `code` command on your PATH. If it's missing, open VSCode and run
**Shell Command: Install 'code' command in PATH** from the Command Palette (`Cmd/Ctrl+Shift+P`),
or just use Option B.

To upgrade in place when a newer `.vsix` is delivered, add `--force`:
```bash
code --install-extension teraslice-job-schema-0.2.0.vsix --force
```

### Option B — VSCode UI (no CLI needed)
1. Open the **Extensions** panel (`Cmd/Ctrl+Shift+X`).
2. Click the `...` menu at the top-right of the panel.
3. Choose **Install from VSIX…**.
4. Select `teraslice-job-schema-0.1.0.vsix`.

### Verify it's working
- Extensions panel → search `@installed teraslice` → "Teraslice Job Schema" should be listed.
  (CLI equivalent: `code --list-extensions | grep terascope`.)
- Open any `*.tsjob.json` file (or the included `example.tsjob.json`) and change
  `"lifecycle": "once"` to `"onc"` — you should get a red underline and a dropdown of
  `once` / `persistent`. No `$schema` key is needed once the extension is installed.
- If an already-open job file doesn't light up, reload the window: Command Palette →
  **Developer: Reload Window**.

### Uninstall
- CLI: `code --uninstall-extension terascope.teraslice-job-schema`
- UI: Extensions panel → "Teraslice Job Schema" → gear icon → **Uninstall**

> The extension id is `terascope.teraslice-job-schema` (`<publisher>.<name>` from `package.json`).

## Using the schema without installing the extension
When working inside the teraslice repo, you can skip the extension and point a file at the
schema directly:
```json
{ "$schema": "./schemas/teraslice-job.schema.json", "name": "my-job", "operations": [ ... ] }
```
`example.job.json` does exactly this.

## Notes / deliberate simplifications
- `additionalProperties: false` at the top level catches typos; Kubernetes-only fields are
  included so real k8s jobs don't get flagged.
- `probation_window` accepts integer ms or a duration string.
- `workers` default shown as `1`; the real runtime default is `min(cpuCount, 5)`.
- `_dead_letter_action` is a free string (builtins `throw` / `log` / `none`, or a DLQ API name),
  so it suggests but does not restrict.
