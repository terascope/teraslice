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
 * Building assets from source instead of downloading a release closes "gap A"
 * from docs/development/asset-compatibility-testing.md: it answers "does an asset
 * built from today's master still work?". The specs never learn where the zip came
 * from, so nothing under test/cases changes.
 *
 * Driven by the ASSETS_FROM_SOURCE env var:
 *   ASSETS_FROM_SOURCE='all'                       every bundle in defaultAssetBundles
 *   ASSETS_FROM_SOURCE='elasticsearch'             one, by asset name
 *   ASSETS_FROM_SOURCE='kafka-assets@v6.8.0'       one, by repo, pinned to a ref
 *   ASSETS_FROM_SOURCE='elasticsearch,standard'    a subset
 *
 * Unset (or 'false') leaves the download path exactly as it was.
 */
export interface SourceAssetBuild {
    /** GitHub repo under terascope to build, e.g. "elasticsearch-assets" */
    repo: string;
    /** Git ref to build; the repo's default branch when unset */
    ref?: string;
}

/**
 * The builder is a standalone CLI rather than a module, and running it as a
 * subprocess keeps it that way -- it stays usable by hand and by CI without e2e
 * being the only supported entry point.
 */
const BUILD_SCRIPT = path.join(BASE_PATH, 'scripts', 'buildAssetsFromSource.js');
const WORK_DIR = path.join(os.tmpdir(), 'teraslice-e2e-asset-build');

/**
 * The prerelease identifier the builder versions an asset under, so any repo at
 * any ref is built and loaded as `9999.0.0-compat-test.0`.
 *
 * That version is what tells a source build apart from a release -- in the zip
 * file name and in `GET /assets` -- and, being unreachable by any real release,
 * it is also what makes teraslice choose the build over the release when both are
 * autoloaded, with no need to delete one to make room for the other.
 *
 * It is passed to the builder rather than assumed, so the two cannot drift.
 */
export const COMPAT_TEST_PRERELEASE_ID = 'compat-test';

const ENABLED_VALUES = ['true', '1', 'yes', 'on', 'all'];
const DISABLED_VALUES = ['', 'false', '0', 'no', 'off', 'none'];

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
 *
 * Both directories describe *released* assets to everything else that reads them.
 * The autoload directory doubles as the download cache -- getNeededAssetBundles
 * and deleteOlderAssets both assume a zip in it is a cache entry, which a source
 * build is not: nothing will refresh it, and it is not what a plain e2e run is
 * supposed to be testing. Leaving one behind is how a run ends up reporting on
 * code nobody asked it to exercise.
 *
 * Called after the suite to put both directories back the way they were, and
 * again before the next build, because a run that dies partway through never
 * reaches its teardown.
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

/**
 * What teraslice extracted out of those zips, in the assets volume.
 *
 * `teardown()` empties this directory wholesale on a normal run, so this is for
 * the runs where that does not happen -- one that crashed, or one left up with
 * KEEP_OPEN. Each asset is unpacked into a directory named for its id, with the
 * manifest it was built from sitting inside, which is the only thing that tells
 * a build apart from a release once the file name is gone.
 */
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
 * directory of its own, so the only thing they share is the tarball directory --
 * which is why the pack step is hoisted out and run once before any of them
 * start, rather than being paid by the first build with the rest following on
 * --skip-pack.
 */
export async function buildAssetsFromSource(builds: SourceAssetBuild[]): Promise<void> {
    if (!builds.length) return;

    if (!fs.existsSync(BUILD_SCRIPT)) {
        throw new Error(`Unable to build assets from source, no build script at ${BUILD_SCRIPT}`);
    }

    signale.time('build assets from source');

    // The builds below run with --skip-pack, reusing whatever tarballs are in
    // the work directory. That is only safe for tarballs packed by this run:
    // anything left behind by an earlier session may have come from a different
    // build of the monorepo, which is precisely the false pass this whole thing
    // exists to avoid. Cheaper to repack than to reason about it.
    fs.rmSync(WORK_DIR, { recursive: true, force: true });

    signale.info(`Packing local packages for ${builds.length} asset build(s)..`);
    await runBuildScript(['--work', WORK_DIR, '--pack-only'], 'pack');

    const results = await Promise.allSettled(builds.map((build) => buildAssetFromSource(build)));

    // allSettled rather than all: a rejection from Promise.all would leave the
    // other builds running unsupervised into the rest of the setup, and would
    // report one failure when several may have gone wrong.
    const failures = results.flatMap((result, index) => (
        result.status === 'rejected'
            ? [`${describeBuild(builds[index])}: ${result.reason?.message ?? result.reason}`]
            : []
    ));

    if (failures.length) {
        throw new Error(`Failed to build ${failures.length} asset(s) from source:\n  ${failures.join('\n  ')}`);
    }

    // Serially, and only once every build is done: each install reads the whole
    // autoload directory to check nothing outranks the build it is installing,
    // which only gives a straight answer when nothing else is writing there.
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
        // Packed once, up front, for every build.
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
 * Run the builder, tagging each line of its output with which build it came
 * from. Inheriting stdio would be simpler, but with several builds running at
 * once -- each one a clone, a pnpm install and a bundle -- the interleaved
 * output is unreadable, and unreadable output is worse than none when a build
 * fails.
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
 * Move a freshly built zip into the autoload directory, alongside the release it
 * was built from rather than on top of it.
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

    // teraslice-cli bundles for the node version it runs under, which is the
    // version e2e runs the cluster on, so these should never disagree. If they
    // ever do the asset silently fails to load, and that is a much harder
    // failure to read than this one.
    if (assetNodeVersion !== nodeVersion) {
        throw new Error(`Asset ${fileName} was built for node ${assetNodeVersion} but e2e is running node ${nodeVersion}`);
    }

    // Everything downstream -- which zip the cluster prefers, which zips the
    // teardown deletes -- keys off the version the builder assigns. Without it
    // this would be a release-named zip written into the release cache, which is
    // the state this whole approach exists to avoid.
    if (!isCompatTestAsset(version)) {
        throw new Error(`Asset ${fileName} was built from ${build.repo} source without a "${COMPAT_TEST_PRERELEASE_ID}" prerelease version`);
    }

    fs.copyFileSync(path.join(outputDir, fileName), path.join(AUTOLOAD_PATH, fileName));

    // The released copy stays where it is. The builder gives every build a
    // version no release can reach, and an unversioned `assets: ['elasticsearch']`
    // resolves to the highest compatible version, so the build is what jobs get
    // without anything having to be moved out of its way.
    //
    // Asserted rather than assumed: if a zip ever did outrank the build, nothing
    // would fail -- the run would just quietly test the release instead, which is
    // the one outcome this feature cannot afford to produce silently.
    for (const existing of listAssets()) {
        if (existing.name !== name || existing.fileName === fileName) continue;
        if (version && existing.version && semver.gt(version, existing.version)) continue;

        throw new Error(`Asset ${existing.fileName} outranks the ${version} build in ${AUTOLOAD_PATH} and would be used in its place`);
    }

    signale.success(`Built ${fileName} from ${build.repo} source`);
}
