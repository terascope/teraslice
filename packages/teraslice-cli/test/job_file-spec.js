'use strict';

const { createTempDirSync } = require('jest-fixtures');
const path = require('path');
const fs = require('fs-extra');

describe('job_file read() testing', () => {
    const tmpDir = createTempDirSync();
    const testJobId = '99999999-9999-9999-9999-999999999999';

    it('read a job file', async () => {
        const jobFile = path.join(tmpDir, 'test-regJobFile.json');
        fs.copyFileSync(path.join(__dirname, 'fixtures', 'cliJobFile.json'), jobFile);
        const cluster = 'clusterTwo';
        const clusterUrl = `http://${cluster}`;
        const cliConfig = {
            baseDir: tmpDir,
            cluster_url: clusterUrl,
            c: clusterUrl,
            deets: {
                cluster: 'clusterTwo',
                file: jobFile
            }
        };
        const jobFileLib = require('../cmds/lib/job_file')(cliConfig);
        const result = await jobFileLib.read();
        expect(result).toBe(undefined);
        expect(cliConfig.job_file_content.__metadata.cli.cluster_url).toBe(clusterUrl);
        expect(cliConfig.job_file_content.__metadata.cli.cluster).toBe(cluster);
        expect(cliConfig.job_file_content.__metadata.cli.job_id).toBe(testJobId);
        expect(cliConfig.job_file_content.__metadata.cli.version).toBe('0.0.1');
        expect(cliConfig.job_file_content.__metadata.cli.updated).toBe('10/22/2018 12:00:00');
    });


    it('missing job file throws error', () => {
        const cliConfig = {
            baseDir: tmpDir,
            deets: {}
        };
        const jobFileLib = require('../cmds/lib/job_file')(cliConfig);
        expect(jobFileLib.read).toThrow('Missing the job file!');
    });
});
