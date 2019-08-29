
import Jobs from './jobs';
import Cluster from './cluster';
import Assets from './assets';
import Ex from './ex';
import * as i from './interfaces';

class TerasliceClient {
    config?: i.ClientConfig;
    assets: Assets;
    cluster: Cluster;
    jobs: Jobs;
    ex: Ex;

    constructor(config: i.ClientConfig = {}) {
        this.config = config;
        this.assets = new Assets(config);
        this.cluster = new Cluster(config);
        this.jobs = new Jobs(config);
        this.ex = new Ex(config);
    }
}

export * from './interfaces';
export { TerasliceClient };
export default TerasliceClient;
