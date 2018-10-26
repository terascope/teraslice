'use strict';
'use console';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
const datetime = require('node-datetime');

const fs = require('fs-extra');
const prompt = require('syncprompt');
const _ = require('lodash');
const jsonDiff = require('json-diff');
const reply = require('../../lib/reply')();
const display = require('../../lib/display')();

module.exports = (cliConfig) => {
    const terasliceClient = require('teraslice-client-js')({
        host: cliConfig.cluster_url
    });
    const annotation = require('../../lib/annotation')(cliConfig);
    const checks = require('../../lib/checks')(cliConfig);
    const asset = require('../../lib/asset')(cliConfig);

    async function showPrompt(actionIn) {
        let answer = false;
        const action = _.startCase(actionIn);
        const response = prompt(`${action} (Y/N)? > `);
        if (response === 'Y' || response === 'y') {
            answer = true;
        }
        return answer;
    }

    async function restart() {
        if (await stop()) {
            await start();
        }
        if (cliConfig.add_annotation) {
            await annotation.add('Restart');
        }
    }

    async function stop(action = 'stop') {
        let waitCountStop = 0;
        const waitMaxStop = 10;
        let stopTimedOut = false;
        let jobsStopped = 0;
        let allJobsStopped = false;
        let jobs = [];

        if (cliConfig.deets.file !== undefined) {
            allJobsStopped = await stopWithJobFile(action);
        } else {
            if (cliConfig.all_jobs) {
                jobs = await save();
            } else {
                jobs = await save(false);
                const id = _.find(jobs, { job_id: cliConfig.deets.id });
                if (id !== undefined) {
                    jobs = [];
                    jobs.push(id);
                    console.log(`Stop job: ${cliConfig.deets.id}`);
                }
            }
            if (jobs.length === 0) {
                reply.error(`No jobs to ${action}`);
                return;
            }

            if (cliConfig.yes || await showPrompt(action)) {
                while (!stopTimedOut) {
                    if (waitCountStop >= waitMaxStop) {
                        break;
                    }
                    try {
                        await changeStatus(jobs, action);
                        stopTimedOut = true;
                    } catch (err) {
                        stopTimedOut = false;
                        reply.error(`> ${action} job(s) had an error [${err.message}]`);
                        jobsStopped = await status(false, false);
                    }
                    waitCountStop += 1;
                }

                let waitCount = 0;
                const waitMax = 15;
                while (!allJobsStopped) {
                    jobsStopped = await status(false, false);
                    await _.delay(() => {}, 500);
                    if (jobsStopped.length === 0) {
                        allJobsStopped = true;
                    }
                    if (waitCount >= waitMax) {
                        break;
                    }
                    waitCount += 1;
                }
                if (allJobsStopped) {
                    console.log('> All jobs %s.', await setAction(action, 'past'));
                    if (cliConfig.add_annotation) {
                        console.log('adding annotaion');
                        await annotation.add(_.startCase(action));
                    }
                }
            }
        }
        return allJobsStopped;
    }

    async function stopWithJobFile(action = 'stop') {
        const jobs = [];
        jobs.push(cliConfig.job_file_content.__metadata.cli);
        return changeStatus(jobs, action);
    }

    async function startWithJobFile(action = 'start', doNotStart = false) {
        let response = '';
        const jobContents = cliConfig.job_file_content;
        if (action === 'start') {
            if (await checks.alreadyRegistered()) {
                response = await terasliceClient.jobs.wrap(cliConfig.deets.id).start();
                if (_.has(response, 'job_id')) {
                    cliConfig.job_id = response.job_id;
                }
            } else {
                response = await terasliceClient.jobs.submit(jobContents, doNotStart);
                try {
                    cliConfig.job_id = response.id();
                    reply.green(`Started job: ${cliConfig.job_id}`);
                } catch (error) {
                    console.log(error);
                    reply.fatal(`Unable to start job: ${cliConfig.job_id}`);
                }
            }
        }
        else {
            const jobs = [];
            jobs.push(jobContents.__metadata.cli);
            await changeStatus(jobs, action);
        }
    }

    async function updateJobFile() {
        const jobContents = cliConfig.job_file_content;
        const jobFilePath = cliConfig.job_file_path;
        _.set(jobContents, '__metadata.cli.cluster', cliConfig.cluster);
        _.set(jobContents, '__metadata.cli.cluster_url', cliConfig.cluster_url);
        _.set(jobContents, '__metadata.cli.version', cliConfig.version);
        _.set(jobContents, '__metadata.cli.job_id', cliConfig.job_id);
        _.set(jobContents, '__metadata.cli.updated', datetime.create()
            .format('m/d/Y H:M:S'));
        await createJsonFile(jobFilePath, jobContents);
        reply.green('Updated job file with cli metadata');
    }

    async function register() {
        // TODO error checking
        await asset.load();
        const jobContents = cliConfig.job_file_content;
        const registeredResponse = await terasliceClient.jobs.submit(jobContents, !cliConfig.run);
        cliConfig.job_id = registeredResponse ? registeredResponse.id() : cliConfig.job_file_content.cli.job_id;
        reply.green(`Successfully registered job: ${cliConfig.job_id} on ${cliConfig.cluster}`);
        await updateJobFile();
        if (cliConfig.run) {
            reply.green(`New job started on ${cliConfig.cluster}`);
        }
    }

    async function start(action = 'start') {
        let jobs = [];
        // start job with job file
        if (cliConfig.deets.file !== undefined) {
            await startWithJobFile(action);
        } else {
            if (!cliConfig.all_jobs) {
                const id = await terasliceClient.jobs.wrap(cliConfig.deets.id)
                    .config();
                if (id !== undefined) {
                    id.slicer = {};
                    id.slicer.workers_active = id.workers;
                    jobs.push(id);
                }
            } else {
                jobs = await fs.readJson(cliConfig.state_file);
            }
            if (jobs.length === 0) {
                reply.error(`No jobs to ${action}`);
                return;
            }

            if (cliConfig.info) {
                await displayInfo();
            }
            await displayJobs(jobs, true);

            if (cliConfig.yes || await showPrompt(action)) {
                await changeStatus(jobs, action);
                let waitCount = 0;
                const waitMax = 15;
                let jobsStarted = 0;
                let allWorkersStarted = false;
                // TODO check for json?
                while (!allWorkersStarted || waitCount < waitMax) {
                    jobsStarted = await status(false, false);
                    await _.delay(() => {}, 5000);
                    waitCount += 1;
                    allWorkersStarted = await checkWorkerCount(jobs, jobsStarted);
                }

                let allAddedWorkersStarted = false;
                if (allWorkersStarted) {
                    // add extra workers
                    waitCount = 0;
                    await addWorkers(jobs, jobsStarted);
                    while (!allAddedWorkersStarted || waitCount < waitMax) {
                        jobsStarted = await status(false, false);
                        await _.delay(() => {
                        }, 5000);
                        waitCount += 1;
                        allAddedWorkersStarted = await checkWorkerCount(jobs, jobsStarted, true);
                    }
                }
                if (allAddedWorkersStarted) {
                    await status(false, true);
                    console.log('> All jobs and workers %s', await setAction(action, 'past'));
                    if (cliConfig.add_annotation) {
                        await annotation.add(_.startCase(action));
                    }
                }
            } else {
                console.log('bye!');
            }
        }
    }


    async function workers() {
        const response = await terasliceClient.jobs.wrap(cliConfig.deets.id).changeWorkers(cliConfig.action, cliConfig.num);
        await reply.green(response);
    }

    async function pause() {
        console.log(cliConfig.deets.id);
        await stop('pause');
    }

    async function resume() {
        await start('resume');
    }

    async function addWorkers(expectedJobs, actualJobs) {
        for (const job of actualJobs) {
            for (const expectedJob of expectedJobs) {
                let addWorkersOnce = true;

                if (expectedJob.job_id === job.job_id) {
                    if (expectedJob.name.toLowerCase().includes('virgil')) {
                        continue;
                    }
                    if (addWorkersOnce) {
                        const workers2add = expectedJob.slicer.workers_active - expectedJob.workers;
                        if (workers2add > 0) {
                            console.log(`> Adding ${workers2add} worker(s) to ${job.job_id}`);
                            await terasliceClient.jobs.wrap(job.job_id).changeWorkers('add', workers2add);
                            await _.delay(() => {}, 5000);
                        }
                        addWorkersOnce = false;
                    }
                }
            }
        }
    }

    async function checkWorkerCount(expectedJobs, actualJobs, addedWorkers = false) {
        let allWorkersStartedCount = 0;
        let allWorkers = false;
        let expectedWorkers = 0;
        for (const job of actualJobs) {
            for (const expectedJob of expectedJobs) {
                if (expectedJob.job_id === job.job_id) {
                    if (addedWorkers) {
                        expectedWorkers = expectedJob.slicer.workers_active;
                    } else {
                        expectedWorkers = expectedJob.workers;
                    }
                    // virgil doesn't always have active workers, so ignore active workers
                    // todo add exceptions to this check in a config file
                    if (expectedJob.name.toLowerCase().includes('virgil')) {
                        allWorkersStartedCount += 1;
                    } else if (expectedWorkers === job.slicer.workers_active) {
                        allWorkersStartedCount += 1;
                    }
                }
            }
        }
        if (allWorkersStartedCount === expectedJobs.length) {
            allWorkers = true;
        }
        return allWorkers;
    }

    async function save() {
        return status(true, true);
    }

    async function status(saveState = false, showJobs = true) {
        const jobs = [];
        if (cliConfig.info) {
            await displayInfo();
        }
        let controllers = '';
        try {
            controllers = await terasliceClient.cluster.controllers();
        } catch (e) {
            controllers = await terasliceClient.cluster.slicers();
        }
        for (const jobStatus of cliConfig.statusList) {
            let jobsTemp = '';
            const exResult = await terasliceClient.jobs.list(jobStatus);
            jobsTemp = await controllerStatus(exResult, jobStatus, controllers);

            _.each(jobsTemp, (job) => {
                jobs.push(job);
            });
        }

        if (jobs.length > 0) {
            if (showJobs) {
                await displayJobs(jobs);
            }
            if (saveState) {
                await fs.writeJson(cliConfig.state_file, jobs, { spaces: 4 });
            }
        }

        return jobs;
    }

    function createJsonFile(filePath, jsonObject) {
        return fs.writeJson(filePath, jsonObject, { spaces: 4 });
    }

    async function list() {
        if (cliConfig.info) {
            await displayInfo();
        }
        const jobs = await terasliceClient.jobs.jobs();
        if (jobs.length > 0) {
            await displayJobsList(jobs, false);
        }

        return jobs;
    }

    async function init() {
        // todo
    }

    async function reset() {
        if (_.has(cliConfig.job_file_content, '__metadata.cli')) {
            delete cliConfig.job_file_content.__metadata.cli;
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
        if (await checks.alreadyRegistered()) {
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
        if (cliConfig.add_annotation) {
            await annotation.add('update');
        }
    }

    async function run() {
        await start();
    }

    async function recover() {
        // todo set options
        const response = await terasliceClient.jobs.wrap(cliConfig.deets.id).recover();
        // todo parse response
        console.log(response);
    }

    async function view() {
        // view job on cluster using details from job file
        if (cliConfig.deets.file !== undefined) {
            await checks.returnJobData();
            const jobId = cliConfig.job_file_content.__metadata.cli.job_id;
            cliConfig.cluster = cliConfig.job_file_content.__metadata.cli.cluster;
            cliConfig.cluster_url = cliConfig.job_file_content.__metadata.cli.cluster_url;
            const tsClient = require('teraslice-client-js')({
                host: cliConfig.cluster_url
            });

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
        } else {
            // view job on cluster
            const response = await terasliceClient.jobs.wrap(cliConfig.deets.id).config();
            reply.yellow(`Current Job File on Cluster ${cliConfig.cluster}:`);
            console.log(JSON.stringify(response, null, 4));
        }
    }

    async function errors() {
        const response = await terasliceClient.jobs.wrap(cliConfig.deets.id).errors();
        if (response.length === 0) {
            console.log(`job_id:${cliConfig.deets.id} no errors`);
        } else {
            let count = 0;
            const size = parseInt(cliConfig.size, 10);
            console.log(`Errors job_id:${cliConfig.deets.id}`);
            _.each(response, (error) => {
                _.each(error, (value, key) => {
                    console.log(`${key} : ${value}`);
                });
                count += 1;
                console.log('--------------------------------------------------------------------------------------');
                if (count >= size) {
                    return false;
                }
            });
        }
    }

    async function displayJobs(jobs, file = false) {
        const headerJobs = await setHeaderDefaults(file);
        let jobsParsed = '';
        if (cliConfig.output_style === 'txt') {
            jobsParsed = await parseJobResponseTxt(jobs, file);
        } else {
            jobsParsed = await parseJobResponse(jobs, file);
        }
        await display.display(headerJobs, jobsParsed, cliConfig.output_style);
    }

    async function displayJobsList(jobs, file = false) {
        const headerJobs = ['job_id', 'name', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];
        let jobsParsed = '';
        if (cliConfig.output_style === 'txt') {
            jobsParsed = await parseJobResponseTxt(jobs, true);
        } else {
            jobsParsed = await parseJobResponse(jobs, file, true);
        }
        await display.display(headerJobs, jobsParsed, cliConfig.output_style);
    }


    async function setAction(action, tense) {
        if (action === 'stop' && tense === 'past') {
            return 'stopped';
        }
        if (action === 'stop' && tense === 'present') {
            return 'stopping';
        }
        if (action === 'start' && tense === 'past') {
            return 'started';
        }
        if (action === 'stop' && tense === 'present') {
            return 'starting';
        }
        if (action === 'pause' && tense === 'past') {
            return 'paused';
        }
        if (action === 'stop' && tense === 'present') {
            return 'pausing';
        }
        if (action === 'restart' && tense === 'past') {
            return 'restarted';
        }
        if (action === 'restart' && tense === 'present') {
            return 'restarting';
        }
        if (action === 'resume' && tense === 'past') {
            return 'resumed';
        }
        if (action === 'resume' && tense === 'present') {
            return 'resuming';
        }

        return action;
    }

    async function displayInfo() {
        const header = ['host', 'state_file'];
        const rows = [];
        if (cliConfig.output_style === 'txt') {
            const row = {};
            row.host = cliConfig.hostname;
            row.state_file = cliConfig.state_file;
            rows.push(row);
        } else {
            const row = [];
            row.push(cliConfig.hostname);
            row.push(cliConfig.state_file);
            rows.push(row);
        }

        await display.display(header, rows, cliConfig.output_style);
    }
    async function parseJobResponseTxt(response, isList = false) {
        if (!isList) {
            _.each(response, (value, node) => {
                if (response[node].slicer.workers_active === undefined) {
                    response[node].workers_active = 0;
                } else {
                    response[node].workers_active = response[node].slicer.workers_active;
                }
            });
        }
        return response;
    }

    async function parseJobResponse(response, file = false, isList = false) {
        const rows = [];

        _.each(response, (value, node) => {
            const row = [];
            row.push(response[node].job_id);
            row.push(response[node].name);
            if (!file || !isList) {
                row.push(response[node]._status);
            }
            row.push(response[node].lifecycle);
            row.push(response[node].slicers);
            row.push(response[node].workers);
            if (!isList) {
                if (response[node].slicer.workers_active === undefined) {
                    row.push(0);
                } else {
                    row.push(response[node].slicer.workers_active);
                }
            }
            row.push(response[node]._created);
            row.push(response[node]._updated);
            rows.push(row);
        });
        return rows;
    }

    async function setHeaderDefaults(file = false) {
        let defaults = [];
        if (file) {
            defaults = ['job_id', 'name', 'lifecycle', 'slicers', 'workers', 'workers_active', '_created', '_updated'];
        } else {
            defaults = ['job_id', 'name', '_status', 'lifecycle', 'slicers', 'workers', 'workers_active', '_created', '_updated'];
        }
        return defaults;
    }

    async function changeStatus(jobs, action) {
        let response = '';
        console.log(`> Waiting for jobs to ${action}`);
        for (const job of jobs) {
            if (action === 'stop') {
                response = await terasliceClient.jobs.wrap(job.job_id).stop();
                if (response.status.status === 'stopped') {
                    console.log('> job: %s %s', job.job_id, await setAction(action, 'past'));
                } else {
                    console.log('> job: %s error %s', job.job_id, await setAction(action, 'present'));
                }
            }
            if (action === 'start') {
                response = await terasliceClient.jobs.wrap(job.job_id).start();
                if (response.job_id === job.job_id) {
                    console.log('> job: %s %s', job.job_id, await setAction(action, 'past'));
                } else {
                    console.log('> job: %s error %s', job.job_id, await setAction(action, 'present'));
                }
            }
            if (action === 'resume') {
                response = await terasliceClient.jobs.wrap(job.job_id).resume();
                if (response.status.status === 'running') {
                    console.log('> job: %s %s', job.job_id, await setAction(action, 'past'));
                } else {
                    console.log('> job: %s error %s', job.job_id, await setAction(action, 'present'));
                }
            }
            if (action === 'pause') {
                response = await terasliceClient.jobs.wrap(job.job_id).pause();
                if (response.status.status === 'paused') {
                    console.log('> job: %s %s', job.job_id, await setAction(action, 'past'));
                } else {
                    console.log('> job: %s error %s', job.job_id, await setAction(action, 'present'));
                }
            }
        }
        return response;
    }

    async function controllerStatus(result, jobStatus, controllerList) {
        const jobs = [];
        for (const item of result) {
            if (jobStatus === 'running' || jobStatus === 'failing') {
                _.set(item, 'slicer', _.find(controllerList, { job_id: `${item.job_id}` }));
            } else {
                item.slicer = 0;
            }
            jobs.push(item);
        }
        return jobs;
    }

    return {
        errors,
        init,
        list,
        pause,
        recover,
        reset,
        restart,
        resume,
        run,
        register,
        save,
        start,
        status,
        stop,
        workers,
        view,
        update
    };
};
