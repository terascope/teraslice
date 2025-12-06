import { fileURLToPath } from 'node:url';
import path from 'node:path';
import semver from 'semver';
import { toBoolean } from '@terascope/core-utils';
import { getRootInfo } from '@terascope/scripts';
import { customAlphabet } from 'nanoid';

/**
 * Compute BASE_PATH from the current module path
 */
function getBasePath(): string {
    const filePath = fileURLToPath(new URL(import.meta.url));
    /*
    from the execution of the test from how its called internally and externally it deviates
    "some/path/terascope/teraslice/e2e/test/constants.ts
                vs
    "some/path/terascope/teraslice/e2e/dist/test/constants.js
    so we search for the e2e part and slice that off to make both work
    */
    const pathLength = filePath.lastIndexOf('e2e') + 3;
    return filePath.slice(0, pathLength);
}

/**
 * Check current teraslice for pre release tag. Use dev assets if present.
 */
function getUseDevAssets(): boolean {
    const envValue = process.env.USE_DEV_ASSETS;
    if (envValue) {
        return toBoolean(envValue) || false;
    }

    const terasliceVersion = semver.coerce(getRootInfo().version, { includePrerelease: true });
    return terasliceVersion?.prerelease
        ? terasliceVersion.prerelease.length > 0
        : false;
}

/**
 * Generate a random ID with optional prefix
 */
export function newId(prefix?: string, lowerCase = false, length = 15) {
    let characters = '0123456789abcdefghijklmnopqrstuvwxyz';

    if (!lowerCase) {
        characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    const id = customAlphabet(characters, length)();

    if (prefix) {
        return `${prefix}-${id}`;
    }

    return id;
}

// Path Constants
export const BASE_PATH = getBasePath();
export const ASSET_BUNDLES_PATH = '/tmp/teraslice_assets';
export const AUTOLOAD_PATH = path.join(BASE_PATH, 'autoload');
export const ASSETS_PATH = path.join(BASE_PATH, '../assets');
export const CONFIG_PATH = path.join(BASE_PATH, '.config');
export const LOG_PATH = path.join(BASE_PATH, 'logs/teraslice.log');

// Worker & Node Constants
/** The number of teraslice-worker instances (see the docker-compose.yml) */
export const DEFAULT_WORKERS = 2;

/** The teraslice-master + the number of teraslice-worker instances */
export const DEFAULT_NODES = DEFAULT_WORKERS + 1;

/** The number of workers per node (see the process-master.yaml and process-worker.yaml) */
export const WORKERS_PER_NODE = 8;

// Test Data Constants
/** Example index sizes for test data */
export const EXAMPLE_INDEX_SIZES = [100, 1000];

// Computed Values
/** Whether to use dev assets */
export const USE_DEV_ASSETS = getUseDevAssets();

export interface E2EConstants {
    ASSET_BUNDLES_PATH: string;
    ASSETS_PATH: string;
    AUTOLOAD_PATH: string;
    BASE_PATH: string;
    CONFIG_PATH: string;
    DEFAULT_NODES: number;
    DEFAULT_WORKERS: number;
    EXAMPLE_INDEX_SIZES: number[];
    LOG_PATH: string;
    USE_DEV_ASSETS: boolean;
    WORKERS_PER_NODE: number;
    newId: typeof newId;
}
