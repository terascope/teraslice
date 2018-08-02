'use strict';

const Jobs = require('./jobs');
const Cluster = require('./cluster');
const Assets = require('./assets');

class TerasliceClient {
    constructor(config) {
        this.config = config;

        this.assets = new Assets(config);
        this.cluster = new Cluster(config);
        this.jobs = new Jobs(config);
    }
}

module.exports = TerasliceClient;
