'use strict';
'use console';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const display = require('../../lib/display')();

async function displayControllers(header, controllers, style) {

    let parsedControllers = '';

    if (style === 'txt') {
        parsedControllers = await parseControllersTxt(header, controllers);
    } else {
        parsedControllers = await parseControllersPretty(header, controllers);
    }
    await display.display(header, parsedControllers, style);
}

async function parseControllersPretty(header, controllers) {
    const rows = [];
    _.each(controllers, (value, controller) => {
        const row = [];
        _.each(header, (item) => {
            row.push(controllers[controller][item]);
        });
        rows.push(row);
    });
    return rows;
}

async function parseControllersTxt(header, controllers) {
    const rows = [];
    _.each(controllers, (value, controller) => {
        const row = {};
        _.each(header, (item) => {
            row[item] = controllers[controller][item];
        });
        rows.push(row);
    });
    return rows;
}

module.exports = (cliConfig) => {
    const terasliceClient = require('teraslice-client-js')({
        host: cliConfig.cluster_url
    });
    async function list() {
        const header = ['name', 'job_id', 'workers_available', 'workers_active', 'failed', 'queued', 'processed']
        const response = await terasliceClient.cluster.slicers();
        if (response.length > 0) {
            await displayControllers(header, response, cliConfig.output_style);
        } else {
            console.log('> no active controllers');
        }
    }
    async function stats() {
        // TODO add object_id filtering of results
        // TODO make output configurable
        const header = ['name', 'ex_id', 'job_id', 'workers_available', 'workers_active', 'failed', 'queued', 'processed', 'started']
        /*
        const header = ['name',
            'ex_id',
            'job_id',
            'workers_available',
            'workers_active',
            //'workers_joined',
            // 'workers_reconnected',
            // 'workers_disconnected',
            'failed',
            'subslices',
            'queued',
            'slice_range_expansion',
            'processed',
            'slicers',
            'subslice_by_key',
            'started']
         */
        const response = await terasliceClient.cluster.slicers();

        if (response.length > 0) {
            await displayControllers(header, response, cliConfig.output_style);
        } else {
            console.log('> no active controllers');
        }
    }

    return {
        list,
        stats
    };
};
