
import signale from 'signale';
import { has, parseErrorInfo } from '@terascope/utils';
import TerasliceClient from 'teraslice-client-js';

// TODO: figure out types
export function getTerasliceClient(cliConfig:any) {
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
