'use strict';
'use console';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const display = require('../../lib/display')();
const reply = require('../../lib/reply')();

module.exports = (cliConfig) => {
    const terasliceClient = require('teraslice-client-js')({
        host: cliConfig.cluster_url
    });

    const checks = require('../../lib/checks')(cliConfig);

    async function list() {
        await checks.getClusteringType();

        let header = ['assignment', 'job_id', 'ex_id', 'node_id', 'pid'];
        if (cliConfig.cluster_manager_type === 'kubernetes') {
            // total and pid are n/a with kubernetes, so they are removed from the output
            header = ['assignment', 'job_id', 'ex_id', 'node_id', 'pod'];
        }
        const response = await terasliceClient.cluster.state();
        if (Object.keys(response).length === 0) {
            reply.fatal(`> No workers on ${cliConfig.cluster}`);
        }
        let parsedResponse = '';
        if (cliConfig.output_style === 'txt') {
            parsedResponse = await parseWorkerResponseTxt(response, cliConfig.id);
        } else {
            parsedResponse = await parseWorkerResponse(response, cliConfig.id);
        }
        if (parsedResponse.length > 0) {
            await display.display(header, parsedResponse, cliConfig.output_style);
        } else {
            reply.error(`> no ids match ${cliConfig.id}`);
        }
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
                if (id !== undefined) {
                    if (checks.matchId(id, workerValue)) {
                        row[node].job_id = workerValue.job_id;
                        row[node].ex_id = workerValue.ex_id;
                        row[node].node_id = node;
                        if (cliConfig.cluster_manager_type === 'kubernetes') {
                            row[node].pod = workerValue.pid;
                        } else {
                            row[node].pid = workerValue.pid;
                        }
                        rows.push(row);
                    }
                } else {
                    row[node].job_id = workerValue.job_id;
                    row[node].ex_id = workerValue.ex_id;
                    row[node].node_id = node;
                    if (cliConfig.cluster_manager_type === 'kubernetes') {
                        row[node].pod = workerValue.pid;
                    } else {
                        row[node].pid = workerValue.pid;
                    }
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
                if (checks.matchId(id, workerValue)) {
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
