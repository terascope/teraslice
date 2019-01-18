'use strict';
'use console';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
const datetime = require('node-datetime');

const fs = require('fs-extra');
const _ = require('lodash');
const jsonDiff = require('json-diff');
const reply = require('../../lib/reply')();

module.exports = (cliConfig) => {
    const terasliceClient = require('teraslice-client-js')({
        host: cliConfig.cluster_url
    });
    const checks = require('../../lib/checks')(cliConfig);
    // const asset = require('../../lib/asset')(cliConfig);
    cliConfig.type = 'tjm';

    async function stop() {
        if (await checks.alreadyRegistered(false)) {
            const response = await terasliceClient.jobs.wrap(cliConfig.job_id).stop();
            if (response.status.status === 'stopped' || response.status === 'stopped') {
                console.log('> job: %s stopped', cliConfig.job_id);
            } else {
                console.log('> job: %s error stopping', cliConfig.job_id);
            }
        }
    }

    async function start(doNotStart = false) {
        let response = '';
        const jobContents = cliConfig.job_file_content;
        if (await checks.alreadyRegistered(false)) {
            response = await terasliceClient.jobs.wrap(cliConfig.job_id).start();
            if (_.has(response, 'job_id')) {
                cliConfig.job_id = response.job_id;
                console.log(`> job: ${cliConfig.job_id} started`);
            }
        } else {
            response = await terasliceClient.jobs.submit(jobContents, doNotStart);
            try {
                cliConfig.job_id = response.id();
                console.log(`> job: ${cliConfig.job_id} started`);
            } catch (error) {
                console.log(error);
                reply.fatal(`Unable to start job: ${cliConfig.job_id}`);
            }
        }
    }

    async function updateJobFile() {
        const jobContents = cliConfig.job_file_content;
        const jobFilePath = cliConfig.job_file_path;
        _.set(jobContents, '__metadata.cli.cluster', cliConfig.cluster_url);
        _.set(jobContents, '__metadata.cli.version', cliConfig.version);
        _.set(jobContents, '__metadata.cli.job_id', cliConfig.job_id);
        _.set(jobContents, '__metadata.cli.updated', datetime.create()
            .format('m/d/Y H:M:S'));
        await createJsonFile(jobFilePath, jobContents);
        reply.green('Updated job file with cli metadata');
    }

    async function register() {
        if (!await checks.alreadyRegistered(false)) {
            // await asset.load();
            const registeredResponse = await terasliceClient.jobs.submit(
                cliConfig.job_file_content, !cliConfig.run
            );
            cliConfig.job_id = registeredResponse ? registeredResponse.id() : cliConfig.job_file_content.cli.job_id;
            reply.green(`Successfully registered job: ${cliConfig.job_id} on ${cliConfig.cluster}`);
            await updateJobFile();
            if (cliConfig.run) {
                reply.green(`New job started on ${cliConfig.cluster}`);
            }
        } else {
            reply.yellow(`job: ${cliConfig.job_id} is already registered on ${cliConfig.cluster}`);
        }
    }

    function createJsonFile(filePath, jsonObject) {
        return fs.writeJson(filePath, jsonObject, { spaces: 4 });
    }

    async function init() {
        const newExampleJobFile = {
            name: 'Data Generator',
            lifecycle: 'persistent',
            workers: 1,
            operations: [
                {
                    _op: 'elasticsearch_data_generator',
                    size: 5000
                },
                {
                    _op: 'elasticsearch_index_selector',
                    index: 'example-logs',
                    type: 'events'
                },
                {
                    _op: 'elasticsearch_bulk',
                    size: 5000
                }]
        };
        if (fs.existsSync(cliConfig.job_file)) {
            reply.fatal(`${cliConfig.job_file} already exists`);
        }

        try {
            createJsonFile(cliConfig.job_file, newExampleJobFile);
            reply.green(`created ${cliConfig.job_file}`);
        } catch (e) {
            reply.fatal(e);
        }
    }

    async function reset() {
        if (_.has(cliConfig.job_file_content, '__metadata.cli')) {
            delete cliConfig.job_file_content.__metadata;
            try {
                createJsonFile(cliConfig.job_file_path, cliConfig.job_file_content);
            } catch (err) {
                reply.fatal(err.message);
            }
            reply.green(`metadata was removed from ${cliConfig.job_file_path}`);
        } else {
            reply.fatal(`job file ${cliConfig.job_file_path} does no contain metadata `);
        }
    }

    async function update() {
        let stopStatus = false;
        if (await checks.alreadyRegistered(false)) {
            cliConfig.job_id = cliConfig.job_file_content.__metadata.cli.job_id;
            const putStatus = await terasliceClient.cluster.put(`/jobs/${cliConfig.job_id}`, cliConfig.job_file_content);
            let jobStatus = 'stopped';
            if (_.has(putStatus, 'job_id')) {
                reply.green(`Updated job ${cliConfig.job_id} config on ${cliConfig.cluster}`);
                try {
                    jobStatus = await terasliceClient.jobs.wrap(cliConfig.job_id).status();
                } catch (e) {
                    reply.error(e);
                }
                if (jobStatus === 'running' || jobStatus === 'failing') {
                    stopStatus = await stop();
                }
                if (stopStatus) {
                    const startStatus = await terasliceClient.jobs.wrap(cliConfig.job_id).start();
                    if (startStatus.job_id === cliConfig.job_id) {
                        reply.green(`Started job ${cliConfig.job_id} on ${cliConfig.cluster}`);
                    }
                }
            }
        }
    }

    async function run() {
        await start();
    }

    async function view() {
        // view job on cluster using details from job file
        if (cliConfig.job_file !== undefined) {
            const tsClient = require('teraslice-client-js')({
                host: cliConfig.cluster_url
            });

            const jobId = cliConfig.job_file_content.__metadata.cli.job_id;
            const jobSpec = await tsClient.jobs.wrap(jobId).config();
            reply.yellow(`Current Job File on Cluster ${cliConfig.cluster}:`);
            console.log(JSON.stringify(jobSpec, null, 4));
            // display diffs of local job file with cluster job file
            const excludeList = ['_context', 'job_id', '_updated', '_created'];
            // check if there's any diffs
            let jobDiff = false;
            _.each(jobSpec, (value, key) => {
                if (!excludeList.includes(key)) {
                    if (jsonDiff.diff(cliConfig.job_file_content[key], jobSpec[key]) !== undefined) {
                        jobDiff = true;
                    }
                }
            });
            if (jobDiff) {
                reply.error('Job file differences local -> cluster:');
                _.each(jobSpec, (value, key) => {
                    if (!excludeList.includes(key)) {
                        if (jsonDiff.diff(cliConfig.job_file_content[key], jobSpec[key]) !== undefined) {
                            console.log(`${key}:`);
                            console.log(jsonDiff.diffString(cliConfig.job_file_content[key], jobSpec[key]));
                        }
                    }
                });
            } else {
                reply.green(`Job definition matches local -> cluster (${cliConfig.cluster})`);
            }
        }
    }

    async function errors() {
        const response = await terasliceClient.jobs.wrap(cliConfig.job_id).errors();
        if (response.length === 0) {
            console.log(`job_id:${cliConfig.job_id} no errors`);
        } else {
            let count = 0;
            const size = parseInt(cliConfig.size, 10);
            console.log(`Errors job_id:${cliConfig.job_id}`);
            _.each(response, (error) => {
                _.each(error, (value, key) => {
                    console.log(`${key} : ${value}`);
                });
                count += 1;
                console.log('-'.repeat(80));
                if (count >= size) {
                    return false;
                }
            });
        }
    }

    return {
        errors,
        init,
        reset,
        run,
        register,
        start,
        stop,
        view,
        update
    };
};
