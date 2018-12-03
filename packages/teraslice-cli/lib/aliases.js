'use strict';

const fs = require('fs');

const _ = require('lodash');
const yaml = require('node-yaml');

const display = require('../cmds/lib/display')();

const defaultConfigData = {
    clusters: {
        localhost: { host: 'http://localhost:5678' }
    }
};


class Aliases {
    constructor(aliasesFile) {
        this.aliasesFile = aliasesFile;
        this.config = this._getConfig();
    }

    _getConfig() {
        let config;

        if (!fs.existsSync(this.aliasesFile)) {
            yaml.writeSync(this.aliasesFile, defaultConfigData);
        }

        try {
            config = yaml.readSync(this.aliasesFile);
        } catch (err) {
            throw new Error(`Failed to load ${this.Aliases}: ${err}`);
        }
        return config;
    }

    // FIXME: we need to ensure newClusterUrl is valid
    //   1: a valid URL
    //   2: an actual cluster that responds
    add(newClusterAlias, newClusterUrl) {
        this.config.clusters[newClusterAlias] = {
            host: newClusterUrl,
        };
        yaml.writeSync(this.aliasesFile, this.config);
    }

    async list() {
        await this.displayClusters(this.config.clusters, 'txt');
    }

    remove() {

    }

    update() {

    }

    // TODO: these "presentation" functions should probably be generalized and
    // moved out to its own lib
    async displayClusters(clusters, style) {
        const header = ['cluster', 'host'];
        let parsedClusters = '';

        if (style === 'txt') {
            parsedClusters = await this.parseClustersTxt(header, clusters);
        } else {
            parsedClusters = await this.parseClustersPretty(header, clusters);
        }
        await display.display(header, parsedClusters, style);
    }

    async parseClustersPretty(header, clusters) {
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

    async parseClustersTxt(header, clusters) {
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
}

module.exports = Aliases;
