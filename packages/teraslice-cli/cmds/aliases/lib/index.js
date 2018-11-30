'use strict';
'use console';

/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const yaml = require('node-yaml');
const _ = require('lodash');
const display = require('../../lib/display')();
const reply = require('../../lib/reply')();

async function displayClusters(clusters, style) {
    const header = ['cluster', 'host'];
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
        if (_.has(cliConfig.config.clusters, cliConfig.clusterAlias)) {
            reply.green(`> Removed cluster alias ${cliConfig.clusterAlias}`);
            delete cliConfig.config.clusters[cliConfig.clusterAlias];
            yaml.writeSync(cliConfig.configFile, cliConfig.config);
        } else {
            reply.error(`alias ${cliConfig.clusterAlias} not in aliases list`);
        }
        await list();
    }

    async function add() {
        reply.green(`> Added cluster alias ${cliConfig.newClusterAlias}`);

        cliConfig.config.clusters[cliConfig.newClusterAlias] = {
            host: urlCheck(cliConfig.newClusterUrl),
        };
        yaml.writeSync(cliConfig.configFile, cliConfig.config);
        await list();
    }

    function urlCheck(url) {
        // check that url starts with http:// but allow for https://
        return url.indexOf('http') === -1 ? `http://${url}` : url;
    }

    async function update() {
        if (_.has(cliConfig.config.clusters, cliConfig.clusterAlias)) {
            reply.green(`> Updated cluster alias ${cliConfig.clusterAlias}`);
            cliConfig.config.clusters[cliConfig.clusterAlias].host = urlCheck(cliConfig.newClusterUrl);
            yaml.writeSync(cliConfig.configFile, cliConfig.config);
        } else {
            reply.error(`alias ${cliConfig.clusterAlias} not in aliases list`);
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
