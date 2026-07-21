#!/usr/bin/env node
/**
 * lint-job.mjs — zero-dependency structural linter for a Teraslice job.json.
 *
 * Catches the common structural mistakes WITHOUT needing Teraslice installed,
 * so it's safe to run anywhere after every edit. It does NOT do real
 * convict-schema validation or per-operation asset validation — for that use
 * deep-validate-job.mjs, and ultimately register against a real cluster.
 *
 * Usage:  node lint-job.mjs path/to/job.json
 * Exit:   0 = no errors (warnings allowed), 1 = errors found or unreadable.
 */
import { readFileSync } from 'node:fs';

const LIFECYCLES = ['once', 'persistent'];
const ENCODINGS = ['json', 'raw'];
const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
const DLQ_BUILTINS = ['throw', 'log', 'none'];

const TOP_LEVEL = new Set([
    'active', 'analytics', 'assets', 'autorecover', 'lifecycle', 'max_retries',
    'name', 'operations', 'apis', 'probation_window', 'slicers', 'workers',
    'stateful', 'labels', 'env_vars', 'log_level',
]);

// Injected by tooling, not part of the job schema. `teraslice-cli tjm register`
// writes __metadata (cluster + job_id) into the file; the cluster strips it.
// Recognize it so re-linting a registered job doesn't warn about it.
const INJECTED = new Set(['__metadata']);

// Only valid when cluster_manager_type === 'kubernetesV2'. We can't know the
// cluster manager from a job.json alone, so these are warnings, not errors.
const K8S_ONLY = new Set([
    'targets', 'cpu', 'cpu_execution_controller', 'ephemeral_storage',
    'external_ports', 'memory', 'memory_execution_controller',
    'pod_spec_override', 'resources_requests_cpu', 'resources_requests_memory',
    'resources_limits_cpu', 'resources_limits_memory', 'volumes',
    'kubernetes_image', 'prom_metrics_enabled', 'prom_metrics_port',
    'prom_metrics_add_default',
]);

const DEPRECATED = {
    cpu: 'use "resources_requests_cpu" instead',
    memory: 'use "resources_requests_memory" instead',
};

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function isPlainObject(v) {
    return v != null && typeof v === 'object' && !Array.isArray(v);
}
function isPositiveInt(v) {
    return Number.isInteger(v) && v > 0;
}
function isNat(v) {
    return Number.isInteger(v) && v >= 0;
}

const file = process.argv[2];
if (!file) {
    console.error('Usage: node lint-job.mjs path/to/job.json');
    process.exit(1);
}

let raw;
try {
    raw = readFileSync(file, 'utf8');
} catch (e) {
    console.error(`Could not read ${file}: ${e.message}`);
    process.exit(1);
}

let job;
try {
    job = JSON.parse(raw);
} catch (e) {
    console.error(`Invalid JSON in ${file}: ${e.message}`);
    process.exit(1);
}

if (!isPlainObject(job)) {
    console.error('Job must be a JSON object.');
    process.exit(1);
}

// ---- top-level fields ----
if (!('name' in job)) {
    warn('No "name" — defaults to "Custom Job"; set an explicit name.');
} else if (typeof job.name !== 'string' || job.name === '') {
    err('"name" must be a non-empty string.');
}

if (!('lifecycle' in job)) {
    warn('No "lifecycle" — defaults to "once".');
} else if (!LIFECYCLES.includes(job.lifecycle)) {
    err(`"lifecycle" must be one of ${JSON.stringify(LIFECYCLES)}, got ${JSON.stringify(job.lifecycle)}.`);
}

if ('workers' in job && !isPositiveInt(job.workers)) {
    err('"workers" must be a positive integer.');
}
if ('slicers' in job && !isPositiveInt(job.slicers)) {
    err('"slicers" must be a positive integer.');
}
if ('max_retries' in job && !isNat(job.max_retries)) {
    err('"max_retries" must be an integer >= 0.');
}
if ('analytics' in job && typeof job.analytics !== 'boolean') {
    err('"analytics" must be a boolean.');
}
if ('stateful' in job && typeof job.stateful !== 'boolean') {
    err('"stateful" must be a boolean.');
}
if ('log_level' in job && job.log_level != null && !LOG_LEVELS.includes(job.log_level)) {
    err(`"log_level" must be one of ${JSON.stringify(LOG_LEVELS)}.`);
}
if ('assets' in job && job.assets != null) {
    if (!Array.isArray(job.assets) || !job.assets.every((a) => typeof a === 'string')) {
        err('"assets" must be an array of strings.');
    }
}
if ('env_vars' in job && !isPlainObject(job.env_vars)) {
    err('"env_vars" must be an object like { "KEY": "value" }.');
}

// probation_window only meaningful for persistent
if ('probation_window' in job && job.lifecycle !== 'persistent') {
    warn('"probation_window" only applies when lifecycle is "persistent".');
}

// unknown / k8s / deprecated top-level fields
for (const key of Object.keys(job)) {
    if (TOP_LEVEL.has(key) || INJECTED.has(key)) continue;
    if (key in DEPRECATED) {
        warn(`"${key}" is deprecated — ${DEPRECATED[key]}.`);
    } else if (K8S_ONLY.has(key)) {
        warn(`"${key}" is only valid on a kubernetesV2 cluster manager; ignored otherwise.`);
    } else {
        warn(`Unknown top-level field "${key}".`);
    }
}

// ---- apis (validate first so operations can cross-check api_name) ----
const declaredApiNames = new Set();
if ('apis' in job) {
    if (!Array.isArray(job.apis)) {
        err('"apis" must be an array.');
    } else {
        job.apis.forEach((api, i) => {
            if (!isPlainObject(api)) {
                err(`apis[${i}] must be an object.`);
                return;
            }
            if (!api._name || typeof api._name !== 'string') {
                err(`apis[${i}] requires a non-empty string "_name".`);
                return;
            }
            if (declaredApiNames.has(api._name)) {
                err(`Duplicate api "_name": ${JSON.stringify(api._name)}.`);
            }
            declaredApiNames.add(api._name);
            if (api._encoding != null && !ENCODINGS.includes(api._encoding)) {
                err(`apis[${i}] "_encoding" must be one of ${JSON.stringify(ENCODINGS)}.`);
            }
        });
    }
}

// ---- operations ----
if (!('operations' in job)) {
    err('"operations" is required.');
} else if (!Array.isArray(job.operations)) {
    err('"operations" must be an array.');
} else if (job.operations.length < 2) {
    err(`"operations" needs at least 2 entries (a reader plus at least one more); found ${job.operations.length}.`);
}

if (Array.isArray(job.operations)) {
    job.operations.forEach((op, i) => {
        const label = `operations[${i}]`;
        if (!isPlainObject(op)) {
            err(`${label} must be an object.`);
            return;
        }
        if (!op._op || typeof op._op !== 'string') {
            err(`${label} requires a non-empty string "_op".`);
        }
        if (op._encoding != null && !ENCODINGS.includes(op._encoding)) {
            err(`${label} "_encoding" must be one of ${JSON.stringify(ENCODINGS)}.`);
        }
        if (op._dead_letter_action != null) {
            const dla = op._dead_letter_action;
            if (!DLQ_BUILTINS.includes(dla) && !declaredApiNames.has(dla)) {
                warn(`${label} "_dead_letter_action": ${JSON.stringify(dla)} is not a builtin (${DLQ_BUILTINS.join('/')}) and no api with that _name is declared — it must resolve to a registered DLQ API at runtime.`);
            }
        }
        // Ops reference a declared api by either `api_name` (elasticsearch-style)
        // or `_api_name` (kafka-style and other API-first assets). Both must
        // resolve to a declared api "_name".
        for (const field of ['api_name', '_api_name']) {
            if (op[field] != null && !declaredApiNames.has(op[field])) {
                err(`${label} "${field}": ${JSON.stringify(op[field])} references an api not declared in "apis".`);
            }
        }
    });
}

// ---- report ----
for (const w of warnings) console.log(`  warn:  ${w}`);
for (const e of errors) console.log(`  ERROR: ${e}`);

const wc = warnings.length;
const ec = errors.length;
if (ec === 0 && wc === 0) {
    console.log(`OK: ${file} passed structural lint (no errors, no warnings).`);
    console.log('Note: this is a structural check only — run deep-validate-job.mjs for real schema validation.');
} else {
    console.log(`\n${ec} error(s), ${wc} warning(s) in ${file}.`);
}
process.exit(ec > 0 ? 1 : 0);
