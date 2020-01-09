import Assets from './assets';
import Cluster from './cluster';
import Ex from './ex';
import Executions from './executions';
import Job from './job';
import Jobs from './jobs';

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
