'use strict';

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const reply = require('../cmds/lib/reply')();

class JobFile {
    /**
     * @param {string} jobPath the path to the job file
     * @param {string} name name of job file.
     */
    constructor(argv) {
        this.jobPath = path.join(argv.srcDir, argv.jobName);
        this.content = '';
        this.version = require('../package.json').version;
    }

    validateJob() {
        // TODO: use @teraslice/job-components job-validator to validate job file
        // this minimum requirement will work for now to get everything up and running
        // Job file must contain name, number of workers and at least 2 operations
        if (!(
            _.has(this.content, 'name')
            && _.has(this.content, 'workers')
            && _.has(this.content, 'operations')
            && this.content.operations.length >= 2
        )) {
            reply.fatal('Job must have a name, workers, and at least 2 operations');
        }
    }

    readFile() {
        if (!fs.pathExistsSync(this.jobPath)) {
            reply.fatal(`Cannot find ${this.jobPath}, check your path and file name and try again`);
        }
        this.content = fs.readJsonSync(this.jobPath);
    }

    addMetaData(id, clusterUrl) {
        _.set(this.content, '__metadata.cli.cluster', clusterUrl);
        _.set(this.content, '__metadata.cli.version', this.version);
        _.set(this.content, '__metadata.cli.job_id', id);
        _.set(this.content, '__metadata.cli.updated', new Date().toISOString());
    }

    get hasMetaData() {
        return _.has(this.content, '__metadata');
    }

    overwrite() {
        fs.writeJsonSync(this.jobPath, this.content, { spaces: 4 });
    }
}

module.exports = JobFile;
