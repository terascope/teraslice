
import siganle from 'siganle';
import { has, parseErrorInfo } from '@terascope/utils';
// @ts-ignore TODO: convert to ts
import tsClient from 'teraslice-client-js';

// TODO: figure out types
export function getTerasliceClient(cliConfig:any) {
    return tsClient({ host: cliConfig.clusterUrl });
}

export async function getTerasliceClusterType(terasliceClient) {
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

export async function handleWrapper(fn) {
    return (argv) => {
        try {
            await fn(argv);
        } catch (err) {
            const { statusCode } = parseErrorInfo(err);
            if (statusCode < 500 && statusCode >= 400) {
                siganle.error(err.message);
            } else {
                siganle.fatal(err);
            }
        }
    }
}
