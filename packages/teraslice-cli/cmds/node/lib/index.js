'use strict';
'use console';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const display = require('../../lib/display')();

module.exports = (cliConfig) => {
    const terasliceClient = require('teraslice-client-js')({
        host: cliConfig.cluster_url
    });

    async function list() {
        let parsedResponse = '';
        let header = ['node_id', 'state', 'hostname', 'total', 'active', 'pid', 'teraslice_version', 'node_version'];
        const response = await terasliceClient.cluster.state();
        if (cliConfig.cluster_manager_type === 'kubernetes') {
            // total and pid are n/a with kubernetes, so they are removed from the output
            header = ['node_id', 'state', 'hostname', 'active', 'teraslice_version', 'node_version'];
        }
        if (cliConfig.output_style === 'txt') {
            parsedResponse = await parseNodeResponseTxt(response);
        } else {
            parsedResponse = await parseNodeResponse(response, cliConfig.deets.id);
        }
        await display.display(header, parsedResponse, cliConfig.output_style);
    }

    async function parseNodeResponseTxt(response) {
        _.each(response, (value, node) => {
            const activeLength = response[node].active.length;
            response[node].active = activeLength;
        });
        return response;
    }

    async function parseNodeResponse(response) {
        const rows = [];

        _.each(response, (value, node) => {
            const row = [];
            row.push(response[node].node_id);
            row.push(response[node].state);
            row.push(response[node].hostname);
            if (cliConfig.cluster_manager_type === 'kubernetes') {
                row.push(response[node].total);
            }
            row.push(response[node].active.length);
            if (cliConfig.cluster_manager_type === 'kubernetes') {
                row.push(response[node].pid);
            }
            row.push(response[node].teraslice_version);
            row.push(response[node].node_version);
            rows.push(row);
        });

        return rows;
    }

    return {
        list
    };
};
