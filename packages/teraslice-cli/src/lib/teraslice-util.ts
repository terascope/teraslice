
import _ from 'lodash';
import TerasliceClient, { Client } from 'teraslice-client-js';

export default class TerasliceUtil {
    config: any;
    constructor(cliConfig: any) {
        this.config = cliConfig;
    }

    get client():Client  {
        return TerasliceClient({ host: this.config.clusterUrl });
    }

    async info() {
        return this.client.cluster.info();
    }

    async type() {
        let clusterInfo = {};
        let clusteringType = 'native';
        try {
            clusterInfo = await this.info();
            if (_.has(clusterInfo, 'clustering_type')) {
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
}
