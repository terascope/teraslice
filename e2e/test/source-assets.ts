import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import semver from 'semver';
import { execa } from 'execa';
import signale from './signale.js';
import { ASSETS_PATH, AUTOLOAD_PATH, BASE_PATH } from './constants.js';
import {
    defaultAssetBundles, assetFileInfo, listAssets, nodeVersion
} from './download-assets.js';

/**
 * Driven by the ASSETS_FROM_SOURCE env var:
 *   ASSETS_FROM_SOURCE='all'                       every bundle in defaultAssetBundles
 *   ASSETS_FROM_SOURCE='elasticsearch'             one, by asset name
 *   ASSETS_FROM_SOURCE='kafka-assets@v6.8.0'       one, by repo, pinned to a ref
 *   ASSETS_FROM_SOURCE='elasticsearch,standard'    a subset
 *
 * Unset (or 'false') leaves the download path exactly as it was.
 */
export interface SourceAssetBuild {
    /** GitHub repo to build, e.g. "elasticsearch-assets" */
    repo: string;
    /** Git ref to build; the repo's default branch when unset */
    ref?: string;
}

// The builder is a standalone script so it can be run manually
const BUILD_SCRIPT = path.join(BASE_PATH, 'scripts', 'buildAssetsFromSource.js');
const WORK_DIR = path.join(os.tmpdir(), 'teraslice-e2e-asset-build');
const ENABLED_VALUES = ['true', '1', 'yes', 'on', 'all'];
const DISABLED_VALUES = ['', 'false', '0', 'no', 'off', 'none'];
export const COMPAT_TEST_PRERELEASE_ID = 'compat-test';

/**
 * Parse ASSETS_FROM_SOURCE into the list of asset repos to build.
 * @returns {SourceAssetBuild[]} empty when the feature is off
 */
export function getSourceAssetBuilds(): SourceAssetBuild[] {
    const raw = (process.env.ASSETS_FROM_SOURCE || '').trim();
    const lowered = raw.toLowerCase();

    if (DISABLED_VALUES.includes(lowered)) {
        return [];
    }

    if (ENABLED_VALUES.includes(lowered)) {
        return defaultAssetBundles.map(({ repo }) => ({ repo }));
    }

    return raw
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map(parseBuildEntry);
}

function parseBuildEntry(entry: string): SourceAssetBuild {
    const [target, ref, ...extra] = entry.split('@');

    if (extra.length) {
        throw new Error(`Invalid ASSETS_FROM_SOURCE entry "${entry}". Expected "<repo>" or "<repo>@<ref>".`);
    }

    // The repo name also names a directory in the work dir, so keep it to a
    // bare name rather than an org/repo pair or a path.
    if (!/^[\w.-]+$/.test(target)) {
        throw new Error(`Invalid asset repo "${target}" in ASSETS_FROM_SOURCE.`);
    }

    // The three default bundles are usually referred to by asset name
    // ("elasticsearch") rather than repo name ("elasticsearch-assets").
    const known = defaultAssetBundles.find(({ name }) => name === target);

    return { repo: known ? known.repo : target, ref: ref || undefined };
}

/** Was this asset built from source by us, rather than downloaded? */
function isCompatTestAsset(version: semver.SemVer | null): boolean {
    return Boolean(version?.prerelease.includes(COMPAT_TEST_PRERELEASE_ID));
}

/**
 * Delete every trace of a source build: the bundle zip in the autoload directory
 * and the copy teraslice unpacked into the assets volume.
 */
export function deleteCompatTestAssets(): void {
    deleteCompatTestBundles();
    deleteUnpackedCompatTestAssets();
}

/** The built zips, in the autoload directory. */
function deleteCompatTestBundles(): void {
    for (const asset of listAssets()) {
        if (!isCompatTestAsset(asset.version)) continue;
        signale.warn(`Deleting asset ${asset.fileName}, it was built from source rather than released`);
        fs.unlinkSync(path.join(AUTOLOAD_PATH, asset.fileName));
    }
}

/** What teraslice extracted out of autoload zips, in the assets volume. */
function deleteUnpackedCompatTestAssets(): void {
    if (!fs.existsSync(ASSETS_PATH)) return;

    for (const entry of fs.readdirSync(ASSETS_PATH)) {
        const assetDir = path.join(ASSETS_PATH, entry);
        const manifestPath = path.join(assetDir, 'asset.json');

        if (!fs.statSync(assetDir).isDirectory() || !fs.existsSync(manifestPath)) continue;

        let manifest: { name?: string; version?: string };
        try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (err) {
            signale.warn(`Unable to read ${manifestPath}, leaving ${entry} in place: ${err.message}`);
            continue;
        }

        if (!isCompatTestAsset(semver.parse(manifest.version ?? null))) continue;

        signale.warn(`Deleting unpacked asset ${manifest.name}@v${manifest.version} (${entry}), it was built from source rather than released`);

        // Teraslice writes this volume as another uid, so a permission problem
        // here is plausible and is not worth failing a run over.
        try {
            fs.rmSync(assetDir, { recursive: true });
        } catch (err) {
            signale.error(`Unable to delete ${assetDir}: ${err.message}`);
        }
    }
}

/**
 * Build each asset repo against the local monorepo packages and put the
 * resulting zips in the autoload directory.
 *
 * The builds run concurrently. Each one clones, installs and bundles in a
 * directory of its own, so the only thing they share is the tarball directory.
 */
export async function buildAssetsFromSource(builds: SourceAssetBuild[]): Promise<void> {
    if (!builds.length) return;

    if (!fs.existsSync(BUILD_SCRIPT)) {
        throw new Error(`Unable to build assets from source, no build script at ${BUILD_SCRIPT}`);
    }

    signale.time('build assets from source');

    fs.rmSync(WORK_DIR, { recursive: true, force: true });

    signale.info(`Packing local packages for ${builds.length} asset build(s)..`);
    await runBuildScript(['--work', WORK_DIR, '--pack-only'], 'pack');

    const results = await Promise.allSettled(builds.map((build) => buildAssetFromSource(build)));

    const failures = results.flatMap((result, index) => (
        result.status === 'rejected'
            ? [`${describeBuild(builds[index])}: ${result.reason?.message ?? result.reason}`]
            : []
    ));

    if (failures.length) {
        throw new Error(`Failed to build ${failures.length} asset(s) from source:\n  ${failures.join('\n  ')}`);
    }

    for (const [index, build] of builds.entries()) {
        installBuiltAsset(build, (results[index] as PromiseFulfilledResult<string>).value);
    }

    signale.timeEnd('build assets from source');
}

/** Build one asset repo, and return the directory its zip landed in. */
async function buildAssetFromSource(build: SourceAssetBuild): Promise<string> {
    const outputDir = path.join(WORK_DIR, 'built', build.repo);
    const args = [
        '--repo',
        build.repo,
        '--work',
        WORK_DIR,
        '--output',
        outputDir,
        '--prerelease-id',
        COMPAT_TEST_PRERELEASE_ID,
        '--skip-pack',
    ];

    if (build.ref) {
        args.push('--ref', build.ref);
    }

    signale.info(`Building ${describeBuild(build)} from source..`);
    await runBuildScript(args, build.repo);

    return outputDir;
}

/**
 * Run the builder, tagging each line of its output with which build it came from.
 */
async function runBuildScript(args: string[], label: string): Promise<void> {
    const subprocess = execa('node', [BUILD_SCRIPT, ...args], { all: true, buffer: false });

    for await (const line of subprocess.iterable({ from: 'all' })) {
        process.stdout.write(`[${label}] ${line}\n`);
    }

    await subprocess;
}

function describeBuild(build: SourceAssetBuild): string {
    return `${build.repo}${build.ref ? `@${build.ref}` : ''}`;
}

/**
 * Move a freshly built zip into the autoload directory.
 */
function installBuiltAsset(build: SourceAssetBuild, outputDir: string) {
    const zips = fs.existsSync(outputDir)
        ? fs.readdirSync(outputDir).filter((file) => path.extname(file) === '.zip')
        : [];

    if (zips.length !== 1) {
        throw new Error(`Expected exactly one zip built from ${build.repo}, found ${zips.length} in ${outputDir}`);
    }

    const fileName = zips[0];
    const { name, version, assetNodeVersion } = assetFileInfo(fileName);

    if (assetNodeVersion !== nodeVersion) {
        throw new Error(`Asset ${fileName} was built for node ${assetNodeVersion} but e2e is running node ${nodeVersion}`);
    }

    if (!isCompatTestAsset(version)) {
        throw new Error(`Asset ${fileName} was built from ${build.repo} source without a "${COMPAT_TEST_PRERELEASE_ID}" prerelease version`);
    }

    fs.copyFileSync(path.join(outputDir, fileName), path.join(AUTOLOAD_PATH, fileName));

    for (const existing of listAssets()) {
        if (existing.name !== name || existing.fileName === fileName) continue;
        if (version && existing.version && semver.gt(version, existing.version)) continue;

        throw new Error(`Asset ${existing.fileName} outranks the ${version} build in ${AUTOLOAD_PATH} and would be used in its place`);
    }

    signale.success(`Built ${fileName} from ${build.repo} source`);
}
