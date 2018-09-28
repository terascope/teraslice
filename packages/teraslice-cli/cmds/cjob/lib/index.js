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
    const annotation = require('../../lib/annotation')(cliConfig);

    async function showPrompt(actionIn) {
        let answer = false;
        const action = _.startCase(actionIn);
        const response = prompt(`${action} jobs (Y/N)? > `);
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
            jobs = await save();
            const id = _.find(jobs, { job_id: cliConfig.deets.id });
            if (id !== undefined) {
                jobs = [];
                jobs.push(id);
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
                    jobsStopped = await list(false, false);
                }
                waitCountStop += 1;
            }

            let waitCount = 0;
            const waitMax = 15;
            while (!allJobsStopped) {
                jobsStopped = await list(false, false);
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
                    await annotation.add(_.startCase(action));
                }
            }
        }
        return allJobsStopped;
    }

    async function start(action = 'start') {
        let jobs = [];
        if (!cliConfig.all_jobs) {
            const id = await terasliceClient.jobs.wrap(cliConfig.deets.id).spec();
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
                jobsStarted = await list(false, false);
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
                    jobsStarted = await list(false, false);
                    await _.delay(() => {}, 5000);
                    waitCount += 1;
                    allAddedWorkersStarted = await checkWorkerCount(jobs, jobsStarted, true);
                }
            }
            if (allAddedWorkersStarted) {
                await list(false, true);
                console.log('> All jobs and workers %s', await setAction(action, 'past'));
                if (cliConfig.add_annotation) {
                    await annotation.add(_.startCase(action));
                }
            }
        } else {
            console.log('bye!');
        }
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
        return list(true);
    }

    async function list(saveState = false, showJobs = true) {
        const jobs = [];
        if (cliConfig.info) {
            await displayInfo();
        }
        for (const status of cliConfig.statusList) {
            let jobsTemp = '';
            const exResult = await terasliceClient.jobs.list(status);
            jobsTemp = await slicerStatus(exResult, status);

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

    async function init() {
        // todo
        return;
    }
    async function reset() {
        // todo
        return;
    }

    async function update() {
        // todo
        return;
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
        const response = await terasliceClient.jobs.wrap(cliConfig.deets.id).spec();
        console.log(response);
    }

    async function errors() {
        const response = await terasliceClient.jobs.wrap(cliConfig.deets.id).errors();
        if (response.length === 0) {
            console.log('job_id: %s no errors', cliConfig.deets.id);
            console.log('--------------------------------------------------------------------------------------');
        } else {
            let count = 0;
            const size = parseInt(cliConfig.size, 10);
            console.log(`Errors job_id: ${cliConfig.deets.id}`);
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
    async function parseJobResponseTxt(response) {
        _.each(response, (value, node) => {
            if (response[node].slicer.workers_active === undefined) {
                response[node].workers_active = 0;
            } else {
                response[node].workers_active = response[node].slicer.workers_active;
            }
        });
        return response;
    }
    async function parseJobResponse(response, file = false) {
        const rows = [];

        _.each(response, (value, node) => {
            const row = [];
            row.push(response[node].job_id);
            row.push(response[node].name);
            if (!file) {
                row.push(response[node]._status);
            }
            row.push(response[node].lifecycle);
            row.push(response[node].slicers);
            row.push(response[node].workers);
            if (response[node].slicer.workers_active === undefined) {
                row.push(0);
            } else {
                row.push(response[node].slicer.workers_active);
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

    async function slicerStatus(result, status) {
        const jobs = [];
        for (const item of result) {
            if (status === 'running' || status === 'failing') {
                const slicer = await terasliceClient.jobs.wrap(item.job_id).slicer();
                // only add first slicer
                _.set(item, 'slicer', slicer[0]);
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
        save,
        start,
        stop,
        view,
        update
    };
};
