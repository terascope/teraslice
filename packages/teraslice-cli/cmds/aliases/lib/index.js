'use strict';
'use console';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const yaml = require('node-yaml');
const _ = require('lodash');
const display = require('../../lib/display')();
const reply = require('../../lib/reply')();
const config = require('../../lib/config')();

async function displayClusters(clusters, style) {
    const header = ['cluster', 'host', 'cluster_manager_type'];
    let parsedClusters = '';

    if (style === 'txt') {
        parsedClusters = await parseClustersTxt(header, clusters);
    } else {
        parsedClusters = await parseClustersPretty(header, clusters);
    }
    await display.display(header, parsedClusters, style);
}

async function parseClustersPretty(header, clusters) {
    const rows = [];
    _.each(clusters, (value, cluster) => {
        const row = [];
        _.each(header, (item) => {
            if (item === 'cluster') {
                row.push(cluster);
            } else {
                row.push(clusters[cluster][item]);
            }
        });
        rows.push(row);
    });
    return rows;
}

async function parseClustersTxt(header, clusters) {
    const rows = [];
    _.each(clusters, (value, cluster) => {
        const row = {};
        _.each(header, (item) => {
            if (item === 'cluster') {
                row.cluster = cluster;
            } else {
                row[item] = clusters[cluster][item];
            }
        });
        rows.push(row);
    });
    return rows;
}

module.exports = (cliConfig) => {
    async function remove() {
        if (_.has(cliConfig.config.clusters, cliConfig.cluster)) {
            reply.green(`> Removed cluster alias ${cliConfig.cluster}`);
            delete cliConfig.config.clusters[cliConfig.cluster];
            yaml.writeSync(cliConfig.configFile, cliConfig.config);
        } else {
            reply.error(`alias ${cliConfig.cluster} not in aliases list`);
        }
        await list();
    }

    async function add() {
        reply.green(`> Added cluster alias ${cliConfig.cluster}`);

        cliConfig.config.clusters[cliConfig.cluster] = {
            host: config._urlCheck(cliConfig.host),
            cluster_manager_type: cliConfig.cluster_manager_type,
        };
        yaml.writeSync(cliConfig.configFile, cliConfig.config);
        await list();
    }

    async function update() {
        if (_.has(cliConfig.config.clusters, cliConfig.cluster)) {
            reply.green(`> Updated cluster alias ${cliConfig.cluster}`);
            if (process.argv.indexOf('-t') > 0 || process.argv.indexOf('--cluster-manager-type') > 0) {
                cliConfig.config.clusters[cliConfig.cluster].cluster_manager_type = cliConfig.cluster_manager_type;
            }
            if (process.argv.indexOf('-c') > 0 || process.argv.indexOf('--host-cluster')) {
                cliConfig.config.clusters[cliConfig.cluster].host = config._urlCheck(cliConfig.host);
            }
            yaml.writeSync(cliConfig.configFile, cliConfig.config);
        } else {
            reply.error(`alias ${cliConfig.cluster} not in aliases list`);
        }
        await list();
    }

    async function list() {
        await displayClusters(cliConfig.config.clusters, cliConfig.output_style);
    }

    return {
        list,
        add,
        remove,
        update
    };
};
