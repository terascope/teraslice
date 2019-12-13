import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import Reply from '../cmds/lib/reply';
import { getPackage } from '../../src/helpers/utils';

const { version } = getPackage();
const reply = new Reply();

// TODO: relook into this use!!!!!!!!!!!!!!

export default class JobFile {
    /**
     * @param {string} jobPath the path to the job file
     * @param {string} name name of job file.
     */
    jobPath!: string;
    version: string;
    jobId!: string;
    name!: string;
    id!: string;
    clusterUrl!: string;
    content: any;

    constructor(argv: any) {
        try {
            this.jobPath = path.join(argv.srcDir, argv.jobFile);
        } catch (e) {
            reply.fatal('The job file or source directory are missing');
        }
        this.version = version;
    }

    init() {
        // This is not in the constructor so that command tjm create
        // can use this class without requiring a job file
        this.readFile();
        this.validateJob();
        if (!this.hasMetaData) {
            reply.fatal('Job file does not contain cli data, register the job first');
        }

        this.jobId = this.content.__metadata.cli.job_id;
        this.id = this.content.__metadata.cli.job_id;
        this.clusterUrl = this.content.__metadata.cli.cluster;
        this.name = this.content.name;
    }

    validateJob() {
        // TODO: use @teraslice/job-components job-validator to validate job file
        // this minimum requirement will work for now
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

    addMetaData(id: string, clusterUrl: string) {
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
