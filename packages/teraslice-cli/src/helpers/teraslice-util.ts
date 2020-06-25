import { has } from '@terascope/utils';
import TerasliceClient, { RootResponse } from 'teraslice-client-js';

export default class TerasliceUtil {
    config: any;
    constructor(cliConfig: Record<string, any>) {
        this.config = cliConfig;
    }

    get client(): TerasliceClient {
        return new TerasliceClient({ host: this.config.clusterUrl });
    }

    async info(): Promise<RootResponse> {
        return this.client.cluster.info();
    }

    async type(): Promise<string> {
        let clusterInfo = {};
        let clusteringType = 'native';
        try {
            clusterInfo = await this.info();
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
}
