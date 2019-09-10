
import signale from 'signale';
import { has, parseErrorInfo } from '@terascope/utils';
import TerasliceClient from 'teraslice-client-js';
import fs from 'fs';
import path from 'path';

export function kebabCase(str: string) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

export function snakeCase(str: string) {
    if (!str) return '';

    return String(str)
        .replace(/^[^A-Za-z0-9]*|[^A-Za-z0-9]*$/g, '')
        .replace(/([a-z])([A-Z])/g, (m, a, b) => `${a}_${b.toLowerCase()}`)
        .replace(/[^A-Za-z0-9]+|_+/g, '_')
        .toLowerCase();
}

export function camelCase(str: string) {
    return str.replace(/\W+(.)/g, (match, chr) => chr.toUpperCase());
}

export function getPackage(filePath?: string) {
    let dataPath = filePath || path.join(__dirname, '../..', 'package.json');
    if (!fs.existsSync(dataPath)) {
        dataPath = path.join(__dirname, '../../../', 'package.json');
    }
    const file = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(file);
}

// TODO: figure out types
export function getTerasliceClient(cliConfig: any) {
    return new TerasliceClient({ host: cliConfig.clusterUrl });
}

// @ts-ignore
export async function getTerasliceClusterType(terasliceClient) {
    let clusterInfo = {};
    let clusteringType = 'native';
    try {
        clusterInfo = await terasliceClient.cluster.info();
        if (has(clusterInfo, 'clustering_type')) {
            // @ts-ignore
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

// @ts-ignore
export function handleWrapper(fn) {
    // @ts-ignore
    return (argv) => {
        try {
            // @ts-ignore TODO: this does not work
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
