import _ from 'lodash';
import TerasliceClient from 'teraslice-client-js';

export default class TerasliceUtil {
    config: any;
    constructor(cliConfig: any) {
        this.config = cliConfig;
    }

    get client(): TerasliceClient {
        return new TerasliceClient({ host: this.config.clusterUrl });
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
