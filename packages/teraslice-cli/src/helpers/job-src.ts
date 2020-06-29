import fs from 'fs-extra';
import path from 'path';
import { has, set } from '@terascope/utils';
import reply from '../cmds/lib/reply';
import { getPackage } from '../../src/helpers/utils';

const { version } = getPackage();

// TODO: relook into this use

export default class JobFile {
    /**
     * @param {string} jobPath the path to the job file
     * @param {string} name name of job file.
     */
    jobPath!: string;
    version: string;
    id!: string;
    name!: string;
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

        this.id = this.content.__metadata.cli.job_id;
        this.clusterUrl = this.content.__metadata.cli.cluster;
        this.name = this.content.name;
    }

    validateJob() {
        // TODO: use @teraslice/job-components job-validator to validate job file
        // this minimum requirement will work for now
        if (!(
            has(this.content, 'name')
            && has(this.content, 'workers')
            && has(this.content, 'operations')
            && this.content.operations.length >= 2
        )) {
            reply.fatal('Job must have a name, workers, and at least 2 operations');
        }
    }

    readFile() {
        try {
            this.content = fs.readJsonSync(this.jobPath);
        } catch (e) {
            if (e.message.includes('no such file or directory')) {
                reply.fatal(`Cannot find ${this.jobPath}, check your path and file name and try again`);
                return;
            }

            reply.fatal(e.message);
        }
    }

    addMetaData(id: string, clusterUrl: string) {
        set(this.content, '__metadata.cli.cluster', clusterUrl);
        set(this.content, '__metadata.cli.version', this.version);
        set(this.content, '__metadata.cli.job_id', id);
        set(this.content, '__metadata.cli.updated', new Date().toISOString());
    }

    get hasMetaData() {
        return has(this.content, '__metadata');
    }

    overwrite() {
        fs.writeJsonSync(this.jobPath, this.content, { spaces: 4 });
    }
}
