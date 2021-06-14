import signale from 'signale';
import { has, parseErrorInfo } from '@terascope/utils';
import TerasliceClient from 'teraslice-client-js';
import fs from 'fs';
import path from 'path';

function sanitize(str: string) {
    return str.replace(/[?$#@_-]/g, ' ');
}

export function kebabCase(str: string): string {
    return sanitize(str)
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

export function snakeCase(str: string): string {
    if (!str) return '';

    return sanitize(str)
        .replace(/^[^A-Za-z0-9]*|[^A-Za-z0-9]*$/g, '')
        .replace(/([a-z])([A-Z])/g, (m, a, b) => `${a}_${b.toLowerCase()}`)
        .replace(/[^A-Za-z0-9]+|_+/g, '_')
        .toLowerCase();
}

export function camelCase(str: string): string {
    return sanitize(str)
        .replace(/\W+(.)/g, (match, chr) => chr.toUpperCase());
}

export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getPackage(filePath?: string): any {
    let dataPath = filePath || path.join(__dirname, '../..', 'package.json');
    if (!fs.existsSync(dataPath)) {
        dataPath = path.join(__dirname, '../../../', 'package.json');
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
            // @ts-expect-error
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
