'use strict';
'use console';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const fs = require('fs-extra');
const _ = require('lodash');
const reply = require('../../lib/reply')();
const display = require('../../lib/display')();

module.exports = (cliConfig) => {
    const terasliceClient = require('teraslice-client-js')({
        host: cliConfig.cluster_url
    });
    cliConfig.type = 'ex';

    async function stop() {
        let waitCountStop = 0;
        const waitMaxStop = 10;
        let stopTimedOut = false;
        let exStopped = false;
        let response = '';
        while (!stopTimedOut) {
            if (waitCountStop >= waitMaxStop) {
                break;
            }
            try {
                response = await terasliceClient.ex.stop(cliConfig.ex_id);
                stopTimedOut = true;
                console.log(`> ex_id: ${cliConfig.ex_id} stopped`);
            } catch (err) {
                reply.error(`> Stopping ex_id had an error [${err.message}]`);
                if (err.message.indexOf(' no active execution context was found') > 0) {
                    stopTimedOut = true;
                } else {
                    stopTimedOut = false;
                }
            }
            await _.delay(() => {}, 500);
            waitCountStop += 1;
        }
        if (response.status === 'stopped') {
            exStopped = true;
        }

        return exStopped;
    }

    async function save() {
        return list(true);
    }

    async function status() {
        if (cliConfig.ex_id === undefined) {
            reply.error('ex_id required for status');
        } else {
            await list();
        }
    }
    async function list(showInfo = false, showExIds = true) {
        const exIds = [];
        if (showInfo) {
            await displayInfo();
        }
        for (const statusEx of cliConfig.statusList) {
            const exResult = await terasliceClient.ex.list(statusEx);
            if (exResult.length > 0) {
                _.each(exResult, (ex) => {
                    if (cliConfig.ex_id === undefined) {
                        exIds.push(ex);
                    } else if (cliConfig.ex_id === ex.ex_id) {
                        exIds.push(ex);
                    }
                });
            }
        }
        if (exIds.length > 0) {
            if (showExIds) {
                await displayExIds(exIds);
            }
            if (save) {
                await fs.writeJson(cliConfig.state_file, exIds, { spaces: 4 });
            }
        }

        return exIds;
    }
    async function errors() {
       reply.fatal('function currently no implemented');
    }

    async function displayExIds(exIds, file = false) {
        const headerExIds = await setHeaderDefaults(file);
        let exParsed = '';
        if (cliConfig.output_style === 'txt') {
            exParsed = await parseExResponseTxt(exIds, file);
        } else {
            exParsed = await parseExResponse(exIds, file);
        }
        await display.display(headerExIds, exParsed, cliConfig.output_style);
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
    async function parseExResponseTxt(response) {
        return response;
    }
    async function parseExResponse(response, file = false) {
        const rows = [];

        _.forEach(response, (value, node) => {
            const row = [];
            row.push(response[node].name);
            row.push(response[node].lifecycle);
            row.push(response[node].slicers);
            row.push(response[node].workers);
            if (!file) {
                row.push(response[node]._status);
            }

            row.push(response[node].ex_id);
            row.push(response[node].job_id);
            row.push(response[node]._created);
            row.push(response[node]._updated);
            rows.push(row);
        });
        return rows;
    }

    async function setHeaderDefaults(file = false) {
        let defaults = [];
        if (file) {
            defaults = ['name', 'lifecycle', 'slicers', 'workers', 'ex_id', 'job_id', '_created', '_updated'];
        } else {
            defaults = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];
        }
        return defaults;
    }

    return {
        list,
        errors,
        stop,
        save,
        status
    };
};
