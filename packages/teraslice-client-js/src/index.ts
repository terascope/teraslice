import Assets from './assets.js';
import Cluster from './cluster.js';
import Ex from './ex.js';
import Executions from './executions.js';
import Job from './job.js';
import Jobs from './jobs.js';
import * as i from './interfaces.js';

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

export * from './interfaces.js';
export {
    TerasliceClient,
    Assets,
    Cluster,
    Executions,
    Ex,
    Jobs,
    Job
};
export default TerasliceClient;
