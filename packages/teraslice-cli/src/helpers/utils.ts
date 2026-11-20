import signale from 'signale';
import {
    has,
    isPlainObject,
    parseErrorInfo,
    toKebabCase,
    toSnakeCase,
    toCamelCase
} from '@terascope/core-utils';
import { TerasliceApiV2 } from '@terascope/types';
import { TerasliceClient } from 'teraslice-client-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PackageManager } from '../interfaces.js';
import { ApiVersion } from './aliases.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

function sanitize(str: string) {
    return str.replace(/[?$#@_-]/g, ' ');
}

export function kebabCase(str: string): string {
    return toKebabCase(sanitize(str));
}

export function snakeCase(str: string): string {
    return toSnakeCase(sanitize(str));
}

export function camelCase(str: string): string {
    return toCamelCase(sanitize(str));
}

export function getPackage(filePath?: string): any {
    let dataPath = filePath || path.join(dirname, '../', 'package.json');
    if (!fs.existsSync(dataPath)) {
        dataPath = path.join(dirname, '../../', 'package.json');
    }
    const file = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(file);
}

// TODO: figure out types
export function getTerasliceClient(cliConfig: Record<string, any>): TerasliceClient {
    return new TerasliceClient({
        host: cliConfig.clusterUrl,
        apiVersion: cliConfig.apiVersion
    });
}

export interface ApiVersionResult {
    apiVersion: ApiVersion;
    /** Why the cluster was set to v1, unset when it supports v2 */
    reason?: string;
}

/**
 * Returns v2 when GET /v2 responds with the v2 cluster info, otherwise
 * v1 with the reason /v2 couldn't be confirmed
 */
export async function detectApiVersion(host: string): Promise<ApiVersionResult> {
    const client = new TerasliceClient({ host, apiVersion: 'v2', timeout: 10000 });
    let info: unknown;
    try {
        info = await client.cluster.info();
    } catch (err) {
        if (err.statusCode === 404) {
            return { apiVersion: 'v1', reason: `the cluster at ${host} does not have the /v2 API, it is likely running an older version of Teraslice` };
        }
        if (err.statusCode != null) {
            return { apiVersion: 'v1', reason: `the cluster at ${host} responded to /v2 with status ${err.statusCode}: ${err.message}` };
        }
        if (err.name === 'ParseError') {
            return { apiVersion: 'v1', reason: `${host} responded to /v2 with something other than JSON, it may not be a Teraslice cluster or may be behind a proxy` };
        }
        return { apiVersion: 'v1', reason: `unable to reach the cluster at ${host}: ${err.message}` };
    }

    if (TerasliceApiV2.ClusterInfoSchema.safeParse(info).success) {
        return { apiVersion: 'v2' };
    }
    if (isPlainObject(info) && (info as Record<string, unknown>).error === 'api is not available') {
        return { apiVersion: 'v1', reason: `the cluster at ${host} is still starting up and its API is not available yet` };
    }
    return { apiVersion: 'v1', reason: `the cluster at ${host} responded to /v2 with an unexpected response: ${JSON.stringify(info)}` };
}

export async function getTerasliceClusterType(
    terasliceClient: TerasliceClient
): Promise<string> {
    let clusterInfo = {};
    let clusteringType = 'native';
    try {
        clusterInfo = await terasliceClient.cluster.info();
        if (has(clusterInfo, 'clustering_type')) {
            clusteringType = clusterInfo.clustering_type;
        } else {
            clusteringType = 'native';
        }
    } catch (err) {
        if (err.code === 405 && err.error === 405) {
            clusteringType = 'native';
        }
    }
    return clusteringType;
}

export function handleWrapper(fn: (argv: any) => any) {
    return (argv: unknown): void => {
        try {
            fn(argv);
        } catch (err) {
            const { statusCode } = parseErrorInfo(err);
            if (statusCode < 500 && statusCode >= 400) {
                signale.error(err.message);
            } else {
                signale.fatal(err);
            }
        }
    };
}

/**
 * Detects the package manager from the packageManager field in package.json
 * or by checking for lock files in the given directory.
 * @param packageJson - Parsed package.json object
 * @param dir - Directory to check for lock files as a fallback
 * @returns The detected package manager name
 */
export function detectPackageManager(packageJson: any, dir: string): PackageManager {
    if (packageJson?.packageManager) {
        const name = packageJson.packageManager.split('@')[0];
        if (name === 'yarn' || name === 'npm' || name === 'pnpm') {
            return name;
        }
    }

    if (fs.existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
    if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(dir, 'package-lock.json'))) return 'npm';

    return 'npm';
}

export const wasmPlugin = {
    name: 'wasm',
    setup(build: any) {
        // Resolve ".wasm" files to a path with a namespace
        build.onResolve({ filter: /\.wasm$/ }, (args: any) => {
            if (args.resolveDir === '') {
                return undefined; // Ignore unresolvable paths
            }
            return {
                path: path.isAbsolute(args.path)
                    ? args.path
                    : path.join(args.resolveDir, args.path),
                namespace: 'wasm-binary',
            };
        });

        // Virtual modules in the "wasm-binary" namespace contain the
        // actual bytes of the WebAssembly file. This uses esbuild's
        // built-in "binary" loader instead of manually embedding the
        // binary data inside JavaScript code ourselves.
        build.onLoad({ filter: /.*/, namespace: 'wasm-binary' }, async (args: any) => ({
            contents: await fs.promises.readFile(args.path),
            loader: 'binary',
        }));
    },
};
