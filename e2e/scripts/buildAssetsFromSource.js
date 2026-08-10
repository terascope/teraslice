/**
 * Builds a Teraslice asset bundle from an asset repo's source, with the local
 * monorepo's packages injected in place of the published ones.
 *
 * Injection works by `pnpm pack`ing every publishable package in the monorepo and
 * pointing pnpm `overrides` at the resulting `file:` tarballs. Overrides apply to
 * the whole dependency graph, so transitive dependencies (data-mate -> core-utils)
 * are resolved to local builds too, and an override for a package the asset does
 * not use is simply inert.
 *
 * The asset repo is cloned from GitHub by default; `--local <path>` builds from a
 * checkout on disk instead. Either way the source has to look like an asset repo:
 * an `asset` directory at the root containing `asset.json`.
 *
 * The staged copy is given a deliberately high version (`9999.0.0-compat-test.0`)
 * before it is bundled, so the zip is named for a version that could not have been
 * released. That keeps a build distinguishable from the release it was built from,
 * and -- since it outranks everything -- makes it the version teraslice picks when
 * both sit in the autoload directory.
 *
 * Usage:
 *   node ./scripts/buildAssetsFromSource.js --repo elasticsearch-assets
 *   node ./scripts/buildAssetsFromSource.js --repo kafka-assets --ref v6.8.0
 *   node ./scripts/buildAssetsFromSource.js --repo standard-assets --local ~/src/standard-assets
 *   node ./scripts/buildAssetsFromSource.js --repo my-assets --org my-org --output ../autoload
 *   node ./scripts/buildAssetsFromSource.js --pack-only --work /tmp/asset-build
 *
 * Options:
 *   --repo <name>          required, unless --pack-only. GitHub repo name of the asset,
 *                          e.g. elasticsearch-assets
 *   --org <name>           GitHub org to clone from (default: terascope)
 *   --ref <git-ref>        tag or branch to clone (default: the repo's default branch)
 *   --local <path>         build from this checkout instead of cloning
 *   --work <dir>           scratch directory (default: <tmp>/teraslice-asset-build)
 *   --output <dir>         copy the finished zip here (e.g. e2e/autoload)
 *   --skip-pack            reuse tarballs already in the work directory
 *   --pack-only            pack the monorepo packages and stop, building nothing. Lets
 *                          several --skip-pack builds share one pack step, and run at
 *                          the same time.
 *   --prerelease-id <id>   prerelease identifier to build under (default: compat-test)
 *   --asset-version <ver>  build at this exact version (default: 9999.0.0-<id>.0)
 *   --keep-version         build at the version in the source
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import { parse, stringify } from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// e2e/scripts -> monorepo root
const MONOREPO_ROOT = path.resolve(__dirname, '..', '..');
const PACKAGES_DIR = path.join(MONOREPO_ROOT, 'packages');

const DEFAULT_ORG = 'terascope';
const DEFAULT_PRERELEASE_ID = 'compat-test';
// High enough that no real release can ever outrank a build. See setAssetVersion.
const BUILD_VERSION_MAJOR = 9999;

function parseArgs(argv) {
    const args = {
        repo: undefined,
        org: DEFAULT_ORG,
        ref: undefined,
        local: undefined,
        work: path.join(os.tmpdir(), 'teraslice-asset-build'),
        output: undefined,
        skipPack: false,
        packOnly: false,
        prereleaseId: DEFAULT_PRERELEASE_ID,
        assetVersion: undefined,
        keepVersion: false,
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--skip-pack') {
            args.skipPack = true;
        } else if (arg === '--pack-only') {
            args.packOnly = true;
        } else if (arg === '--keep-version') {
            args.keepVersion = true;
        } else if (arg.startsWith('--')) {
            // kebab-case to camelCase
            const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            if (!(key in args)) {
                throw new Error(`Unknown option "${arg}"`);
            }
            const value = argv[++i];
            if (value === undefined) {
                throw new Error(`Option "${arg}" requires a value`);
            }
            args[key] = value;
        } else {
            throw new Error(`Unexpected argument "${arg}"`);
        }
    }

    // --pack-only never touches an asset repo so repo is not required
    if (!args.repo && !args.packOnly) {
        throw new Error('Option "--repo <name>" is required, e.g. --repo elasticsearch-assets');
    }

    if (args.packOnly && args.skipPack) {
        throw new Error('Options "--pack-only" and "--skip-pack" are mutually exclusive');
    }

    // Valid repo characters are a-z, A-Z, 0-9, '_', '.', and '-'
    if (args.repo && !/^[\w.-]+$/.test(args.repo)) {
        throw new Error(
            `Invalid repo name "${args.repo}". Pass just the repo name and use --org for the owner.`
        );
    }

    if (args.local && args.ref) {
        throw new Error('Options "--local" and "--ref" are mutually exclusive');
    }

    // The identifier ends up in the zip file name, which is parsed back out on
    // the far end by splitting on `-node-`. An id with a `node` segment in it
    // would make that ambiguous.
    if (!/^[a-z][a-z\d-]*$/i.test(args.prereleaseId) || /(^|-)node(-|$)/.test(args.prereleaseId)) {
        throw new Error(`Invalid prerelease id "${args.prereleaseId}". Use letters, digits and dashes, and avoid "node".`);
    }

    if (args.assetVersion && args.keepVersion) {
        throw new Error('Options "--asset-version" and "--keep-version" are mutually exclusive');
    }

    if (!args.assetVersion) {
        args.assetVersion = `${BUILD_VERSION_MAJOR}.0.0-${args.prereleaseId}.0`;
    }

    // Not a full semver validation -- just enough that a typo
    // fails here rather than inside the bundler.
    if (!/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(args.assetVersion)) {
        throw new Error(`Invalid asset version "${args.assetVersion}". Expected a semver version, e.g. 9999.0.0-compat-test.0`);
    }

    return args;
}

function log(message) {
    process.stdout.write(`${message}\n`);
}

function readJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Index every publishable package in the monorepo by its npm name.
 * @returns {Map<string, { dir: string, version: string, needsBuild: boolean }>}
 */
function indexMonorepoPackages() {
    const index = new Map();

    for (const dirName of fs.readdirSync(PACKAGES_DIR)) {
        const pkgPath = path.join(PACKAGES_DIR, dirName, 'package.json');
        if (!fs.existsSync(pkgPath)) continue;

        const pkg = readJSON(pkgPath);
        if (pkg.private) continue;

        index.set(pkg.name, {
            dir: path.join(PACKAGES_DIR, dirName),
            version: pkg.version,
            // Most packages publish compiled output, but not all of them --
            // eslint-config is plain JS with no build step.
            needsBuild: (pkg.main || '').startsWith('dist/'),
        });
    }

    return index;
}

/**
 * `pnpm pack` each package into `destDir`
 * @returns {Promise<Map<string, string>>} package name -> absolute tarball path
 */
async function packPackages(index, destDir, skipPack) {
    fs.mkdirSync(destDir, { recursive: true });
    const tarballs = new Map();

    for (const [name, pkg] of index) {
        if (pkg.needsBuild && !fs.existsSync(path.join(pkg.dir, 'dist'))) {
            throw new Error(
                `${name} has no dist directory. Run "pnpm build" in the monorepo first.`
            );
        }

        if (skipPack) {
            const existing = fs
                .readdirSync(destDir)
                .find((file) => file.startsWith(tarballPrefix(name)) && file.endsWith('.tgz'));

            if (existing) {
                tarballs.set(name, path.join(destDir, existing));
                continue;
            }
        }

        const { stdout } = await execa('pnpm', ['pack', '--pack-destination', destDir], {
            cwd: pkg.dir,
        });

        // pnpm prints the tarball path as the last line of its output
        const tarballPath = stdout.trim().split('\n')
            .pop()
            .trim();
        if (!tarballPath.endsWith('.tgz') || !fs.existsSync(tarballPath)) {
            throw new Error(`Unable to determine tarball path for ${name} from:\n${stdout}`);
        }

        tarballs.set(name, tarballPath);
    }

    return tarballs;
}

/** `@terascope/job-components` -> `terascope-job-components-` */
function tarballPrefix(name) {
    return `${name.replace('@', '').replace('/', '-')}-`;
}

/**
 * Every asset repo must have `asset` directory at the root,
 * with the asset.json manifest within.
 */
function assertAssetRepo(dir, description) {
    const assetDir = path.join(dir, 'asset');
    if (!fs.existsSync(assetDir) || !fs.statSync(assetDir).isDirectory()) {
        throw new Error(`${description} has no "asset" directory at its root.`);
    }

    const manifest = path.join(assetDir, 'asset.json');
    if (!fs.existsSync(manifest)) {
        throw new Error(`${description} has an "asset" directory but no asset/asset.json.`);
    }
}

/** Resolve and validate a `--local` checkout. Called before any work is done. */
function resolveLocalSource(localPath) {
    const srcDir = path.resolve(localPath);
    if (!fs.existsSync(srcDir)) {
        throw new Error(`Local asset repo "${srcDir}" does not exist.`);
    }
    assertAssetRepo(srcDir, `"${srcDir}"`);
    return srcDir;
}

/**
 * Put a clean copy of the asset repo in the work directory.
 */
async function stageSource(args, stageDir) {
    fs.rmSync(stageDir, { recursive: true, force: true });

    if (!args.local) {
        const url = `https://github.com/${args.org}/${args.repo}.git`;
        log(`* cloning ${url}${args.ref ? ` at ${args.ref}` : ''}`);
        await execa('git', [
            'clone',
            '--depth',
            '1',
            ...(args.ref ? ['--branch', args.ref] : []),
            url,
            stageDir,
            // A typo in --repo or --org is a 404, and git answers a 404 by
            // asking for credentials. Fail instead of hanging on a prompt.
        ], { stdio: 'inherit', env: { GIT_TERMINAL_PROMPT: '0' } });

        assertAssetRepo(stageDir, `${args.org}/${args.repo}${args.ref ? `@${args.ref}` : ''}`);
        return;
    }

    const srcDir = resolveLocalSource(args.local);
    log(`* staging ${srcDir} -> ${stageDir}`);

    const skip = new Set(['node_modules', 'dist', 'build', '.git']);
    fs.cpSync(srcDir, stageDir, {
        recursive: true,
        filter: (source) => {
            const name = path.basename(source);
            return !skip.has(name) && !name.endsWith('.tsbuildinfo');
        },
    });
}

/**
 * Give the staged repo a version of its own before it is bundled, written into
 * the same three files `ts-scripts bump-asset` maintains: package.json,
 * asset/package.json and asset/asset.json.
 *
 * The default, `9999.0.0-compat-test.0`, is deliberately high because:
 * - The zip is named for a version that could not possibly have been released, so
 *   a build is never mistaken for -- or silently written over -- the release it
 *   was built from.
 * - Teraslice resolves an unversioned asset name in a job spec to the highest
 *   matching version, so the build always wins over other versions in autoload.
 *
 * @returns {string} the version that was set
 */
function setAssetVersion(stageDir, version) {
    const assetJsonPath = path.join(stageDir, 'asset', 'asset.json');
    const manifests = [
        path.join(stageDir, 'package.json'),
        path.join(stageDir, 'asset', 'package.json'),
        assetJsonPath,
    ];

    const previous = readJSON(assetJsonPath).version;

    for (const manifest of manifests) {
        const contents = readJSON(manifest);
        contents.version = version;
        fs.writeFileSync(manifest, `${JSON.stringify(contents, null, 4)}\n`, 'utf8');
    }

    log(`* set asset version ${previous} -> ${version}`);

    return version;
}

/**
 * Point pnpm at the local tarballs.
 * `blockExoticSubdeps` has to come off: `file:` specifiers are rejected.
 */
function applyOverrides(stageDir, tarballs) {
    const workspaceFile = path.join(stageDir, 'pnpm-workspace.yaml');
    if (!fs.existsSync(workspaceFile)) {
        throw new Error(`Expected a pnpm workspace at ${workspaceFile}`);
    }

    const workspace = parse(fs.readFileSync(workspaceFile, 'utf8')) || {};
    workspace.overrides = { ...workspace.overrides };

    for (const [name, tarballPath] of tarballs) {
        workspace.overrides[name] = `file:${tarballPath}`;
    }

    workspace.blockExoticSubdeps = false;

    fs.writeFileSync(workspaceFile, stringify(workspace), 'utf8');
    log(`* wrote ${tarballs.size} overrides to ${workspaceFile}`);
}

async function install(stageDir) {
    log('* running pnpm install');
    await execa('pnpm', ['install', '--no-frozen-lockfile'], {
        cwd: stageDir,
        stdio: 'inherit',
    });
}

/**
 * Attempt to compile the asset repo against the injected packages.
 * A type-level break in a monorepo package fails here, before anything is zipped.
 */
async function buildSource(stageDir) {
    const pkg = readJSON(path.join(stageDir, 'package.json'));
    if (!pkg.scripts?.build) {
        log('* no build script in the asset repo, skipping');
        return;
    }

    log('* running pnpm run build in the asset repo');
    await execa('pnpm', ['run', 'build'], { cwd: stageDir, stdio: 'inherit' });
}

/**
 * Confirm the install actually resolved to the local builds.
 *
 * Version numbers cannot answer this on their own. The published package the asset pins and the
 * local package (if not yet bumped) may carry the same version.
 * What we check instead is provenance: where the resolved package physically lives.
 *
 * pnpm names virtual store entries `<name>@<reference>`, flattening `/` and `@`
 * to `+`, so anything installed from our tarballs reads as `...@file+...` and
 * anything from the registry reads as `...@<version>`.
 */
function verifyInjection(stageDir, tarballs) {
    const assetModules = path.join(stageDir, 'asset', 'node_modules');
    const storePath = path.join(stageDir, 'node_modules', '.pnpm');

    if (!fs.existsSync(storePath)) {
        throw new Error(`No pnpm virtual store at ${storePath}`);
    }

    // Compare realpath to realpath, or the /var -> /private/var symlink on
    // macOS makes every package look like it came from outside the store.
    const storeDir = fs.realpathSync(storePath);
    const storeEntries = fs.readdirSync(storeDir);
    const injected = [];
    const problems = [];

    for (const name of tarballs.keys()) {
        const storePrefix = `${name.replace('/', '+')}@`;

        // Anywhere in the graph, not just at the top level
        for (const entry of storeEntries) {
            if (!entry.startsWith(storePrefix)) continue;
            if (!entry.slice(storePrefix.length).startsWith('file+')) {
                problems.push(`${name}: a published copy is still in the store as "${entry}"`);
            }
        }

        // What the asset itself resolves, followed through pnpm's symlink.
        const installed = path.join(assetModules, ...name.split('/'));
        if (!fs.existsSync(installed)) continue; // not a dependency of this asset

        injected.push(name);
        const realPath = fs.realpathSync(installed);
        if (!path.relative(storeDir, realPath).startsWith(`${storePrefix}file+`)) {
            problems.push(`${name}: asset/ resolved to ${realPath}, which is not one of our tarballs`);
        }
    }

    if (!injected.length) {
        throw new Error(
            `No injected packages found under ${assetModules}. The overrides did not take effect.`
        );
    }

    if (problems.length) {
        throw new Error(`Package injection did not fully take effect:\n  ${problems.join('\n  ')}`);
    }

    log(`* verified ${injected.length} packages injected into asset/: ${injected.join(', ')}`);
}

async function buildAsset(stageDir) {
    const cli = path.join(MONOREPO_ROOT, 'packages', 'teraslice-cli', 'bin', 'teraslice-cli.js');
    if (!fs.existsSync(cli)) {
        throw new Error(`teraslice-cli not found at ${cli}. Run "pnpm build" in the monorepo first.`);
    }

    log('* building asset bundle');
    await execa('node', [cli, 'assets', 'build', '--src-dir', stageDir, '--overwrite'], {
        stdio: 'inherit',
    });

    const buildDir = path.join(stageDir, 'build');
    const zips = fs.existsSync(buildDir)
        ? fs.readdirSync(buildDir).filter((file) => file.endsWith('.zip'))
        : [];

    if (zips.length !== 1) {
        throw new Error(`Expected exactly one zip in ${buildDir}, found ${zips.length}`);
    }

    return path.join(buildDir, zips[0]);
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const tarballDir = path.join(args.work, 'tarballs');

    if (args.local) resolveLocalSource(args.local);

    const index = indexMonorepoPackages();

    if (args.packOnly) {
        log(`Packing ${index.size} local packages for later builds`);
        const packed = await packPackages(index, tarballDir, false);
        log(`\nPacked ${packed.size} packages into ${tarballDir}`);
        return;
    }

    const stageDir = path.join(args.work, args.repo);

    log(`Building "${args.repo}" asset from source against ${index.size} local packages`);

    const tarballs = await packPackages(index, tarballDir, args.skipPack);
    log(`* packed ${tarballs.size} packages into ${tarballDir}`);

    await stageSource(args, stageDir);

    if (!args.keepVersion) {
        setAssetVersion(stageDir, args.assetVersion);
    }

    applyOverrides(stageDir, tarballs);
    await install(stageDir);
    verifyInjection(stageDir, tarballs);
    await buildSource(stageDir);

    const zipPath = await buildAsset(stageDir);

    let finalPath = zipPath;
    if (args.output) {
        const outputDir = path.resolve(args.output);
        fs.mkdirSync(outputDir, { recursive: true });
        finalPath = path.join(outputDir, path.basename(zipPath));

        if (fs.existsSync(finalPath)) {
            log(`* replacing existing ${finalPath}`);
        }

        fs.copyFileSync(zipPath, finalPath);
    }

    log(`* staged source left at ${stageDir}`);
    log(`\nAsset built from source: ${finalPath}`);
}

main().catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
});
