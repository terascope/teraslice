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
/* eslint-disable no-console -- intentional CLI: results print to stdout, read by exit code */
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve as resolvePath, dirname, parse as parsePath } from 'node:path';

const file = process.argv[2];
const asK8s = process.argv.includes('--k8s');

// The real schema checks every op/api `connection`/`_connection` against the
// connections known to terafoundation. We don't have the cluster's config, so
// we tell the validator which connection names to treat as available. Defaults
// to just "default" (the connection every teraslice cluster defines). Pass more
// with --connections a,b,c to match your cluster's terafoundation.connectors.
function parseConnections() {
    const flag = '--connections';
    const idx = process.argv.indexOf(flag);
    if (idx === -1) return ['default'];
    const val = process.argv[idx + 1];
    if (!val || val.startsWith('--')) return ['default'];
    const names = val.split(',').map((s) => s.trim())
        .filter(Boolean);
    return names.length ? names : ['default'];
}
const connectionNames = parseConnections();

if (!file || file.startsWith('--')) {
    console.error('Usage: node deep-validate-job.mjs path/to/job.json [--k8s] [--connections a,b,c]');
    console.error('  --k8s          validate as a kubernetesV2 cluster (enables k8s-only fields)');
    console.error('  --connections  comma-separated connection names to treat as available');
    console.error('                 (default: "default")');
    process.exit(1);
}

let job;
try {
    job = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
    console.error(`Could not read/parse ${file}: ${e.message}`);
    process.exit(1);
}

// Walk up from `start` looking for a teraslice monorepo checkout that has the
// job-components package built on disk, and return its entry file. Needed
// because the teraslice monorepo does NOT symlink @terascope/job-components
// into a root node_modules, so bare-specifier resolution fails even when you
// ARE inside a checkout — the built package must be imported by path.
function findMonorepoEntry(start) {
    let dir = resolvePath(start);
    const { root } = parsePath(dir);
    while (true) {
        const pkgDir = resolvePath(dir, 'packages', 'job-components');
        const pkgJson = resolvePath(pkgDir, 'package.json');
        if (existsSync(pkgJson)) {
            try {
                const main = JSON.parse(readFileSync(pkgJson, 'utf8')).main || 'index.js';
                const entry = resolvePath(pkgDir, main);
                if (existsSync(entry)) return entry;
            } catch {
                // fall through to keep walking up
            }
        }
        if (dir === root) return null;
        dir = dirname(dir);
    }
}

// Resolve @terascope/job-components. Strategy, in order:
//  1) bare-specifier resolution from cwd, the job file's dir, then this script
//     (covers "installed as a dependency" / node_modules-linked setups);
//  2) walk up those same dirs for a monorepo checkout with the package built
//     on disk (covers working inside a teraslice checkout, where 1 fails).
async function loadJobComponents() {
    const bases = [process.cwd(), resolvePath(file, '..'), resolvePath(process.argv[1], '..')];
    for (const base of bases) {
        try {
            const require = createRequire(resolvePath(base, 'noop.js'));
            const entry = require.resolve('@terascope/job-components');
            return await import(pathToFileURL(entry).href);
        } catch {
            // try next base
        }
    }
    for (const base of bases) {
        const entry = findMonorepoEntry(base);
        if (entry) return await import(pathToFileURL(entry).href);
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
    child() {
        return noopLogger;
    },
};
// job-schemas derives the set of available connections from the KEYS of each
// connector type's object. Put every requested name under one synthetic
// connector type so `connection`/`_connection` references resolve.
const stubConnector = Object.fromEntries(connectionNames.map((n) => [n, {}]));
const context = {
    apis: { foundation: { makeLogger: () => noopLogger } },
    sysconfig: {
        terafoundation: { connectors: { _skill_stub: stubConnector } },
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
    console.log(`Connections treated as available: ${connectionNames.join(', ')} `
        + '(override with --connections a,b,c).');
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
