#!/usr/bin/env node
/**
 * deep-validate-job.mjs — real schema validation of a Teraslice job.json,
 * when @terascope/job-components is resolvable.
 *
 * Tiering (honest about what it can and can't check):
 *   - If @terascope/job-components resolves (you're inside a teraslice
 *     checkout, or it's installed as a dependency), this runs the REAL
 *     convict-based top-level job schema validation (jobSchema +
 *     validateJobConfig). This is the strongest offline check for top-level
 *     fields.
 *   - Per-OPERATION schema validation (op-specific fields from asset bundles)
 *     needs each op's asset resolvable on disk via the full JobValidator +
 *     OperationLoader. This script does NOT attempt that, because a job.json
 *     alone rarely has its assets installed locally. Those fields are only
 *     truly validated when you register against a real cluster.
 *   - If the package does NOT resolve, it says so and tells you the real
 *     check to run instead.
 *
 * Usage:
 *   node deep-validate-job.mjs path/to/job.json [--k8s]
 *     --k8s   validate as a kubernetesV2 cluster (enables k8s-only fields)
 *
 * Exit: 0 = validation passed (or was cleanly skipped), 1 = validation failed
 *       or file unreadable.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';

const file = process.argv[2];
const asK8s = process.argv.includes('--k8s');

if (!file) {
    console.error('Usage: node deep-validate-job.mjs path/to/job.json [--k8s]');
    process.exit(1);
}

let job;
try {
    job = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
    console.error(`Could not read/parse ${file}: ${e.message}`);
    process.exit(1);
}

// Resolve @terascope/job-components from the user's cwd (checkout root or
// their project), falling back to the job file's directory.
async function loadJobComponents() {
    const bases = [process.cwd(), resolvePath(file, '..')];
    for (const base of bases) {
        try {
            const require = createRequire(resolvePath(base, 'noop.js'));
            const entry = require.resolve('@terascope/job-components');
            return await import(pathToFileURL(entry).href);
        } catch {
            // try next base
        }
    }
    // last resort: bare specifier resolved relative to this script
    return import('@terascope/job-components');
}

let jc;
try {
    jc = await loadJobComponents();
} catch {
    console.log('SKIPPED: @terascope/job-components is not resolvable here.');
    console.log('Only the structural lint (lint-job.mjs) has been applied.');
    console.log('For real validation either:');
    console.log('  - run this from inside a teraslice checkout / a project with');
    console.log('    @terascope/job-components installed, or');
    console.log('  - register against a real cluster:');
    console.log('      teraslice-cli tjm register <cluster-alias> ' + file);
    process.exit(0);
}

const { jobSchema, validateJobConfig } = jc;
if (typeof jobSchema !== 'function' || typeof validateJobConfig !== 'function') {
    console.log('SKIPPED: resolved @terascope/job-components but it does not export');
    console.log('the expected jobSchema/validateJobConfig API (version mismatch?).');
    console.log('Fall back to registering against a real cluster to validate.');
    process.exit(0);
}

// Minimal context sufficient for top-level job schema validation.
// SchemaValidator reaches for context.apis.foundation.makeLogger, so provide
// a no-op logger; jobSchema reads sysconfig.terafoundation/teraslice.
const noopLogger = {
    info() {}, debug() {}, warn() {}, error() {}, trace() {}, fatal() {},
    child() { return noopLogger; },
};
const context = {
    apis: { foundation: { makeLogger: () => noopLogger } },
    sysconfig: {
        terafoundation: { connectors: {} },
        teraslice: {
            cluster_manager_type: asK8s ? 'kubernetesV2' : 'native',
            assets_directory: '',
        },
    },
};

try {
    const schema = jobSchema(context);
    const { warnings } = validateJobConfig(schema, job, context);

    if (Array.isArray(warnings) && warnings.length) {
        console.log(`${warnings.length} warning(s):`);
        for (const w of warnings) {
            console.log('  warn: ' + JSON.stringify(w.reason ?? w));
        }
    }
    console.log(`\nOK: ${file} passed REAL top-level job schema validation${asK8s ? ' (kubernetesV2)' : ''}.`);
    console.log('Note: per-operation (asset-specific) field validation was NOT run —');
    console.log('that requires each op\'s asset installed locally, or registering');
    console.log('against a real cluster. Verify op-specific fields against the');
    console.log('asset bundle\'s own docs.');
    process.exit(0);
} catch (e) {
    console.log(`FAILED: top-level schema validation error in ${file}:`);
    console.log('  ' + e.message);
    process.exit(1);
}
