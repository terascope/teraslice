import signale from 'signale';
import {
    has,
    parseErrorInfo,
    toKebabCase,
    toSnakeCase,
    toCamelCase
} from '@terascope/core-utils';
import { TerasliceClient } from 'teraslice-client-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PackageManager } from '../interfaces.js';

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
    return new TerasliceClient({ host: cliConfig.clusterUrl });
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
