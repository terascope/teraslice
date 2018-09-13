'use strict';
'use console';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const display = require('../../lib/display')();
const sh = require('../../lib/shorthand')();


module.exports = (cliConfig) => {
    const terasliceClient = require('teraslice-client-js')({
        host: cliConfig.cluster_url
    });

    async function list() {
        let header = ['assignment', 'job_id', 'ex_id', 'node_id', 'pid'];
        if (_.startsWith(cliConfig.env, 'k8s')) {
            // total and pid are n/a with k8s, so they are removed from the output
            header = ['assignment', 'job_id', 'ex_id', 'node_id', 'pod'];
        }
        const response = await terasliceClient.cluster.state();
        let parsedResponse = '';
        if (cliConfig.output_style === 'txt') {
            parsedResponse = await parseWorkerResponseTxt(response, cliConfig.deets.id);
        } else {
            parsedResponse = await parseWorkerResponse(response, cliConfig.deets.id);
        }
        await display.display(header, parsedResponse, cliConfig.output_style);
    }

    async function parseWorkerResponseTxt(response, id) {
        const rows = [];
        _.each(response, (value, node) => {
            _.each(response[node].active, (workerValue) => {
                const row = {};
                row[node] = row;
                if (workerValue.assignment !== undefined) {
                    row[node].assignment = workerValue.assignment;
                } else {
                    row[node].assignment = workerValue.assignment;
                }
                if (sh.idCheck(id, workerValue)) {
                    row[node].job_id = workerValue.job_id;
                    row[node].ex_id = workerValue.ex_id;
                    row[node].node_id = node;
                    row[node].pid = workerValue.pid;
                    rows.push(row);
                }
            });
        });
        return rows;
    }

    async function parseWorkerResponse(response, id) {
        const rows = [];

        _.each(response, (value, node) => {
            _.each(response[node].active, (workerValue) => {
                const row = [];
                if (sh.idCheck(id, workerValue)) {
                    row.push(workerValue.assignment);
                    row.push(workerValue.job_id);
                    row.push(workerValue.ex_id);
                    row.push(node);
                    row.push(workerValue.pid);
                    rows.push(row);
                }
            });
        });

        return rows;
    }

    return {
        list
    };

};
