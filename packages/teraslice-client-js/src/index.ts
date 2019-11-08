
import Jobs from './jobs';
import Cluster from './cluster';
import Assets from './assets';
import Executions from './executions';
import * as i from './interfaces';

class TerasliceClient {
    config?: i.ClientConfig;
    assets: Assets;
    cluster: Cluster;
    jobs: Jobs;
    executions: Executions;

    constructor(config: i.ClientConfig = {}) {
        this.config = config;
        this.assets = new Assets(config);
        this.cluster = new Cluster(config);
        this.jobs = new Jobs(config);
        this.executions = new Executions(config);
    }

    protected get ex(): never {
        throw new Error('TerasliceClient->ex is now removed in favor of executions and ex (wrapper) like a jobs/job');
    }
}

export * from './interfaces';
export { TerasliceClient };
export default TerasliceClient;
