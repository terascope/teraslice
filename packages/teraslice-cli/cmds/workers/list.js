'use strict';

const _ = require('lodash');
const reply = require('../lib/reply')();
const display = require('../lib/display')();

const Config = require('../../lib/config');
const { getTerasliceClient } = require('../../lib/utils');
const { getTerasliceClusterType } = require('../../lib/utils');

const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'list <cluster-alias> [id]';
exports.desc = 'List the workers in a cluster\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.strict()
        .example('$0 workers list cluster1')
        .example('$0 workers list cluster1 99999999-9999-9999-9999-999999999999');
};

exports.handler = async (argv) => {
    let response;
    const cliConfig = new Config(argv);

    const terasliceClient = await getTerasliceClient(cliConfig);
    const terasliceClusterType = await getTerasliceClusterType(terasliceClient);

    let header = ['assignment', 'job_id', 'ex_id', 'node_id', 'pid'];
    if (terasliceClusterType === 'kubernetes') {
        // total and pid are n/a with kubernetes, so they are removed from the output
        header = ['assignment', 'job_id', 'ex_id', 'pod_ip', 'worker_id', 'teraslice_version'];
    }

    try {
        response = await terasliceClient.cluster.state();
    } catch (err) {
        reply.fatal(`Error getting cluster state on ${cliConfig.args.clusterAlias}\n${err}`);
    }

    if (Object.keys(response).length === 0) {
        reply.fatal(`> No workers on ${cliConfig.args.clusterAlias}`);
    }

    let rows;
    if (cliConfig.args.output === 'pretty') {
        rows = await parseWorkerResponse(response, cliConfig.args.id, header);
    } else {
        rows = await parseWorkerResponseTxt(response, cliConfig.args.id, terasliceClusterType);
    }
    if (rows.length > 0) {
        await display.display(header, rows, cliConfig.args.output);
    } else {
        reply.fatal(`> No workers match id ${cliConfig.args.id}`);
    }
};

async function parseWorkerResponse(response, id) {
    const rows = [];

    _.each(response, (value, node) => {
        _.each(response[node].active, (workerValue) => {
            const row = [];
            if (id === undefined || workerValue.job_id === id || workerValue.ex_id === id) {
                row.push(workerValue.assignment);
                row.push(workerValue.job_id);
                row.push(workerValue.ex_id);
                row.push(node);
                row.push(workerValue.worker_id);
                row.push(response[node].teraslice_version);
                rows.push(row);
            }
        });
    });

    return rows;
}

async function parseWorkerResponseTxt(response, id, clusterType) {
    const rows = [];
    _.each(response, (value, node) => {
        _.each(response[node].active, (workerValue) => {
            const row = {};
            row[node] = row;
            row[node].node_version = response[node].node_version;
            row[node].teraslice_version = response[node].teraslice_version;
            if (workerValue.assignment !== undefined) {
                row[node].assignment = workerValue.assignment;
            } else {
                row[node].assignment = workerValue.assignment;
            }
            if (id !== undefined) {
                if (id === undefined || workerValue.job_id === id || workerValue.ex_id === id) {
                    row[node].job_id = workerValue.job_id;
                    row[node].ex_id = workerValue.ex_id;
                    row[node].node_id = node;
                    if (clusterType === 'kubernetes') {
                        row[node].worker_id = workerValue.worker_id;
                        row[node].teraslice_version = response[node].teraslice_version;
                    } else {
                        row[node].pid = workerValue.pid;
                    }
                    rows.push(row);
                }
            } else {
                row[node].job_id = workerValue.job_id;
                row[node].ex_id = workerValue.ex_id;
                row[node].pod_ip = node;

                if (clusterType === 'kubernetes') {
                    row[node].worker_id = workerValue.worker_id;
                    row[node].teraslice_version = response[node].teraslice_version;
                } else {
                    row[node].pid = workerValue.pid;
                }
                rows.push(row);
            }
        });
    });
    return rows;
}
