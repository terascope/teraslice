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

    list(output) {
        const header = ['cluster', 'host'];
        const clusters = _.map(
            _.mapValues(this.config.clusters, o => o.host),
            (value, key) => ({ cluster: key, host: value })
        );
        display.display(header, clusters, output);
    }

    remove(clusterAlias) {
        if (_.has(this.config.clusters, clusterAlias)) {
            delete this.config.clusters[clusterAlias];
            yaml.writeSync(this.aliasesFile, this.config);
        } else {
            throw new Error(`Alias ${clusterAlias} not in aliases list`);
        }
    }

    update(clusterAlias, newClusterUrl) {
        if (_.has(this.config.clusters, clusterAlias)) {
            this.config.clusters[clusterAlias] = {
                host: newClusterUrl,
            };
            yaml.writeSync(this.aliasesFile, this.config);
        } else {
            throw new Error(`Alias ${clusterAlias} not in aliases list`);
        }
    }
}

module.exports = Aliases;
