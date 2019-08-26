
import Jobs from './jobs';
import Cluster from './cluster';
import Assets from './assets';
import Ex from './ex';
import { ClientConfig } from '../interfaces';

export default class TerasliceClient {
    config?: ClientConfig;
    assets: Assets;
    cluster: Cluster;
    jobs: Jobs;
    ex: Ex;

    constructor(config:ClientConfig = {}) {
        this.config = config;
        this.assets = new Assets(config);
        this.cluster = new Cluster(config);
        this.jobs = new Jobs(config);
        this.ex = new Ex(config);
    }
}

module.exports = TerasliceClient;
