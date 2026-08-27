/* eslint-disable no-console */
// This file's output IS its product: it runs from a terminal (or a Docker build
// step) and reports to a human. There is no logger to route through.
/**
 * Build data-mate and exactly its workspace dependencies — nothing else.
 *
 * **Why this is not just `tsc --build packages/data-mate`.** The per-package
 * tsconfigs carry NO `references`, so tsc cannot chase the dependency graph
 * from data-mate; pointed at it alone it compiles against unbuilt siblings and
 * fails with a wall of `Cannot find module '@terascope/core-utils'`.
 *
 * **And why not just the prefix of the root tsconfig's `references`.** That was
 * the first attempt. The root list is a topological order over the WHOLE
 * monorepo, so its prefix contains packages that are not data-mate dependencies
 * — `docker-compose-js` is the first one. The image installs only data-mate's
 * closure, so those packages' own dependencies are absent and tsc fails on
 * `Cannot find module 'debug'`. A superset is not free.
 *
 * So: compute the real closure from the `workspace:` protocol entries in each
 * package.json, then order it by the root tsconfig's references, which is the
 * order the root build itself uses. Self-maintaining in both directions — a new
 * dependency is picked up, and a dropped one stops being built.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const TARGET_PACKAGE = '@terascope/data-mate';

/**
 * The repo root. Derived from this file's own location, so the script works
 * from any working directory — but only while it stays in place. Do not COPY it
 * elsewhere in a Dockerfile; run it where it lives.
 */
const ROOT = new URL('../../../../../', import.meta.url).pathname;

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** package name -> directory, for every package in packages/. */
function indexPackages() {
    const byName = new Map();
    for (const entry of readdirSync(`${ROOT}packages`, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const manifest = `${ROOT}packages/${entry.name}/package.json`;
        if (!existsSync(manifest)) continue;
        byName.set(readJson(manifest).name, `packages/${entry.name}`);
    }
    return byName;
}

/**
 * Every workspace package data-mate needs, transitively.
 *
 * devDependencies are included: pnpm installs them for each selected project,
 * and a package's own build can legitimately need a sibling's declarations.
 */
function closure(byName, rootPackage) {
    const needed = new Set();
    const visit = (name) => {
        if (needed.has(name)) return;
        const dir = byName.get(name);
        if (!dir) return; // not a workspace package — a normal npm dependency
        needed.add(name);
        const manifest = readJson(`${ROOT}${dir}/package.json`);
        for (const group of ['dependencies', 'devDependencies', 'peerDependencies']) {
            for (const [dep, range] of Object.entries(manifest[group] ?? {})) {
                if (String(range).startsWith('workspace:')) visit(dep);
            }
        }
    };
    visit(rootPackage);
    return needed;
}

/**
 * The `references` paths, in order.
 *
 * Extracted with a regex rather than JSON.parse, because tsconfig.json is JSONC
 * — comments and trailing commas — and a hand-rolled stripper gets it wrong
 * (an earlier version of this file corrupted the `exclude` globs and threw).
 * `"path"` appears ONLY in reference entries; the `paths` compiler option is a
 * different key and cannot match.
 */
function referencePaths(file) {
    const raw = readFileSync(file, 'utf8');
    const found = [...raw.matchAll(/"path"\s*:\s*"([^"]+)"/g)].map((m) => m[1].replace(/\/$/, ''));
    if (!found.length) {
        throw new Error(`no project references found in ${file} — the build order cannot be derived`);
    }
    return found;
}

const byName = indexPackages();
if (!byName.has(TARGET_PACKAGE)) {
    throw new Error(`${TARGET_PACKAGE} was not found under packages/`);
}

const needed = closure(byName, TARGET_PACKAGE);
const neededDirs = new Set([...needed].map((name) => byName.get(name)));
const ordered = referencePaths(`${ROOT}tsconfig.json`).filter((path) => neededDirs.has(path));

// Anything in the closure the root tsconfig does not reference has no build
// order, so tsc would compile it at the wrong time. Fail loudly rather than
// silently skip it.
const unordered = [...neededDirs].filter((dir) => !ordered.includes(dir));
if (unordered.length) {
    throw new Error(
        `${unordered.join(', ')} are data-mate dependencies but are absent from the root `
        + 'tsconfig references, so their build order is unknown. Add them there.'
    );
}

console.log(`building ${ordered.length} projects (data-mate + its workspace closure):`);
for (const path of ordered) console.log(`  ${path}`);

execFileSync('npx', ['tsc', '--build', ...ordered], { cwd: ROOT, stdio: 'inherit' });

console.log('build complete');
