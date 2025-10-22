import { has } from '@terascope/core-utils';
import { Teraslice } from '@terascope/types';
import { TerasliceClient } from 'teraslice-client-js';

export default class TerasliceUtil {
    config: any;
    constructor(cliConfig: Record<string, any>) {
        this.config = cliConfig;
    }

    get client(): TerasliceClient {
        return new TerasliceClient({ host: this.config.clusterUrl });
    }

    async info(): Promise<Teraslice.ApiRootResponse> {
        return this.client.cluster.info();
    }

    async type(): Promise<Teraslice.ClusterManagerType> {
        let clusterInfo = {};
        let clusteringType: Teraslice.ClusterManagerType = 'native';

        try {
            clusterInfo = await this.info();
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
}
