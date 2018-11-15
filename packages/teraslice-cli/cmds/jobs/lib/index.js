'use strict';
'use console';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const fs = require('fs-extra');
const prompt = require('syncprompt');
const _ = require('lodash');
const reply = require('../../lib/reply')();
const display = require('../../lib/display')();

module.exports = (cliConfig) => {
    const terasliceClient = require('teraslice-client-js')({
        host: cliConfig.cluster_url
    });

    const checks = require('../../lib/checks')(cliConfig);
    checks.getClusteringType();

    const annotation = require('../../lib/annotation')(cliConfig);
    cliConfig.type = 'job';

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

        if (cliConfig.all_jobs) {
            jobs = await save();
        } else {
            await checkForId();
            jobs = await save(false);
            const id = _.find(jobs, { job_id: cliConfig.job_id });
            if (id !== undefined) {
                jobs = [];
                jobs.push(id);
                console.log(`Stop job: ${cliConfig.job_id}`);
            }
        }
        if (jobs.length === 0) {
            reply.error(`No jobs to ${action}`);
            return;
        }
        if (jobs.length === 1) {
            cliConfig.yes = true;
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
                await _.delay(() => {}, 50);
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
                    console.log('adding annotation');
                    await annotation.add(_.startCase(action));
                }
            }
        }
        return allJobsStopped;
    }

    async function checkForId() {
        if (!_.has(cliConfig, 'job_id')) {
            reply.fatal('job id required');
        }
    }
    async function start(action = 'start') {
        let jobs = [];

        reply.green(cliConfig.job_id);
        // start job with job file
        if (!cliConfig.all_jobs) {
            await checkForId();
            const id = await terasliceClient.jobs.wrap(cliConfig.job_id).config();
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
        /*
        if (_.has(cliConfig, 'job_id')) {
            cliConfig.yes = true;
        }
        */
        if (jobs.length === 1) {
            cliConfig.yes = true;
        }
        if (cliConfig.yes || await showPrompt(action)) {
            await changeStatus(jobs, action);
            let waitCount = 0;
            const waitMax = 10;
            let jobsStarted = 0;
            let allWorkersStarted = false;

            console.log('> Waiting for workers to start');
            while (!allWorkersStarted || waitCount < waitMax) {
                jobsStarted = await status(false, false);
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


    async function workers() {
        await checkForId();
        const response = await terasliceClient.jobs.wrap(cliConfig.job_id).changeWorkers(cliConfig.action, cliConfig.num);
        console.log(`> job: ${cliConfig.job_id} ${response}`);
    }

    async function pause() {
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
                        let workers2add = 0;
                        if (_.has(expectedJob, 'slicer.workers_active')) {
                            workers2add = expectedJob.slicer.workers_active - expectedJob.workers;
                        }
                        if (workers2add > 0) {
                            console.log(`> Adding ${workers2add} worker(s) to ${job.job_id}`);
                            await terasliceClient.jobs.wrap(job.job_id).changeWorkers('add', workers2add);
                            await _.delay(() => {}, 50);
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
        let activeWorkers = 0;
        for (const job of actualJobs) {
            for (const expectedJob of expectedJobs) {
                if (expectedJob.job_id === job.job_id) {
                    if (addedWorkers) {
                        if (_.has(expectedJob, 'slicer.workers_active')) {
                            expectedWorkers = job.slicer.workers_active;
                        } else {
                            reply.fatal('no expected workers');
                        }
                    } else {
                        expectedWorkers = expectedJob.workers;
                    }
                    // virgil doesn't always have active workers, so ignore active workers
                    // todo add exceptions to this check in a config file
                    if (_.has(job, 'slicer.workers_active')) {
                        activeWorkers = job.slicer.workers_active;
                    }
                    if (expectedJob.name.toLowerCase().includes('virgil')) {
                        allWorkersStartedCount += 1;
                    } else if (expectedWorkers === activeWorkers) {
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
        // view job on cluster
        await checkForId();
        const response = await terasliceClient.jobs.wrap(cliConfig.job_id).config();
        console.log(JSON.stringify(response, null, 4));
    }

    async function errors() {
        await checkForId();
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
                if (_.has(response[node], 'slicer.workers_active')) {
                    response[node].workers_active = response[node].slicer.workers_active;
                } else {
                    response[node].workers_active = 0;
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
                if (_.has(response[node], 'slicer.workers_active')) {
                    row.push(response[node].slicer.workers_active);
                } else {
                    row.push(0);
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
        console.log(`> Waiting for jobs to ${action}`);
        const response = jobs.map((job) => {
            if (action === 'stop') {
                return terasliceClient.jobs.wrap(job.job_id).stop()
                    .then((stopResponse) => {
                        if (stopResponse.status.status === 'stopped' || stopResponse.status === 'stopped') {
                            return setAction(action, 'past')
                                .then((setActionResult) => {
                                    console.log('> job: %s %s', job.job_id, setActionResult);
                                });
                        } else {
                            return setAction(action, 'present')
                                .then((setActionResult) => {
                                    console.log('> job: %s error %s', job.job_id, setActionResult);
                                });
                        }
                    });
            }
            if (action === 'start') {
                return terasliceClient.jobs.wrap(job.job_id).start()
                    .then((startResponse) => {
                        if (startResponse.job_id === job.job_id) {
                            return setAction(action, 'past')
                                .then((setActionResult) => {
                                    console.log('> job: %s %s', job.job_id, setActionResult);
                                });
                        } else {
                            return setAction(action, 'present')
                                .then((setActionResult) => {
                                    console.log('> job: %s error %s', job.job_id, setActionResult);
                                });
                        }
                    });
            }
            if (action === 'resume') {
                return terasliceClient.jobs.wrap(job.job_id).resume()
                    .then((resumeResponse) => {
                        if (resumeResponse.status.status === 'running' || resumeResponse.status === 'running') {
                            return setAction(action, 'past')
                                .then((setActionResult) => {
                                    console.log('> job: %s %s', job.job_id, setActionResult);
                                });
                        } else {
                            return setAction(action, 'present')
                                .then((setActionResult) => {
                                    console.log('> job: %s error %s', job.job_id, setActionResult);
                                });
                        }
                    });
            }
            if (action === 'pause') {
                return terasliceClient.jobs.wrap(job.job_id).pause()
                    .then((pauseResponse) => {
                        if (pauseResponse.status.status === 'paused' || pauseResponse.status === 'paused') {
                            return setAction(action, 'past')
                                .then((setActionResult) => {
                                    console.log('> job: %s %s', job.job_id, setActionResult);
                                });
                        } else {
                            return setAction(action, 'present')
                                .then((setActionResult) => {
                                    reply.error('> job: %s error %s', job.job_id, setActionResult);
                                });
                        }
                    });
            }
        });
        return Promise.all(response);
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
        list,
        pause,
        recover,
        restart,
        resume,
        run,
        save,
        start,
        status,
        stop,
        workers,
        view,
    };
};
