'use strict';
'use console';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const yaml = require('node-yaml');
const _ = require('lodash');
const display = require('../../lib/display')();

async function displayClusters(clusters, style) {
    const header = ['cluster', 'host', 'port', 'env'];
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
    async function alias() {
        if (cliConfig.remove) {
            console.log(`> Remove cluster alias ${cliConfig.cluster}`);
            delete cliConfig.config.clusters[cliConfig.cluster];
        } else {
            console.log(`> Added cluster alias ${cliConfig.cluster}`);
            const newClusterAlias = {};
            newClusterAlias[cliConfig.cluster] = {
                host: cliConfig.host,
                port: cliConfig.port,
                env: cliConfig.env
            };
            cliConfig.config.clusters[cliConfig.cluster] = {
                host: cliConfig.host,
                port: cliConfig.port,
                env: cliConfig.env
            };
        }
        yaml.writeSync(cliConfig.configFile, cliConfig.config);
        await list();
    }

    async function list() {
        await displayClusters(cliConfig.config.clusters, cliConfig.output_style);
    }

    return {
        list,
        alias
    };
};
