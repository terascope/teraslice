'use strict';

const fs = require('fs');

const _ = require('lodash');
const yaml = require('node-yaml');

const terasliceClientJs = require('teraslice-client-js');


class TerasliceCliConfig {
    constructor(cliArgs) {
        this.args = _.clone(cliArgs);
        this.assetName = _.get(this.args, 'asset_name', '');
        this.baseDir = _.get(this.args, 'base_dir', '');
        // TODO - move require to top and make version constant
        this.version = require('../../package.json').version;
        this.default_cluster_manager_type = 'native';
        this.config = this.getConfig();
        this.output_style = _.get(this.args, 'o', 'txt');
        this.annotation = _.get(this.args, 'n', null);
    }

    // TODO: MAYBE this should be a property
    get terasliceClient() {
        return terasliceClientJs({ host: this.clusterUrl });
    }

    // TODO: should probably just be a property
    get configDir() {
        return this.args.config_dir;
    }

    get configFile() {
        return `${this.configDir}/config-cli.yaml`;
    }

    get paths() {
        return {
            job_state_dir: `${this.configDir}/job_state_files`,
            asset_dir: `${this.configDir}/assets`
        };
    }

    // clusterAlias should support the following scenarios
    //   earl alias add alias url
    //   earl alias list
    //   earl alias remove alias
    //   earl alias update alias url
    get clusterAlias() {
        let clusterAlias;
        if (_.has(this.args, 'cluster_alias') && _.has(this.args, 'cluster_url')) {
            clusterAlias = _.get(this.args, 'cluster_alias', '');
        } else {
            clusterAlias = _.get(this.args, 'cluster_alias', '');
            if (clusterAlias !== '') {
                if (!_.has(this.config.clusters, clusterAlias)) {
                    throw new Error(`alias not defined in config file: ${clusterAlias}`);
                }
            }
        }
        return clusterAlias;
    }

    get clusterUrl() {
        let r;
        if (_.has(this.args, 'cluster_alias') || _.has(this.args, 'cluster_url')) {
            r = _.get(this.args, 'cluster_url', '');
            if (r === '') {
                r = _.get(this.config.clusters[this.clusterAlias], 'host');
            }
        } else {
            throw new Error('Either cluster_alias or cluster_url must be set on the command line.');
        }
        return this._urlCheck(r);
    }

    get newClusterUrl() {
        return this._urlCheck(_.get(this.args, 'new_cluster_url'));
    }

    get newClusterAlias() {
        return _.get(this.args, 'new_cluster_alias');
    }

    _urlCheck(inUrl) {
        // check that url starts with http:// but allow for https://
        const defaultPort = 5678;
        let outUrl = '';
        if (inUrl === '') {
            throw new Error('empty cluster_url');
        }
        if (inUrl.indexOf(':') === -1) {
            outUrl = inUrl.indexOf('http') === -1 ? `http://${inUrl}:${defaultPort}` : `${inUrl}:${defaultPort}`;
        } else {
            outUrl = inUrl.indexOf('http') === -1 ? `http://${inUrl}` : inUrl;
        }
        return outUrl;
    }

    getConfig() {
        const defaultConfigData = {
            clusters: {
                localhost: { host: 'http://localhost:5678' }
            }
        };

        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir);
        }

        // TODO: Loop over paths and make sure they all exist
        if (!fs.existsSync(this.paths.job_state_dir)) {
            fs.mkdirSync(this.paths.job_state_dir);
        }

        if (!fs.existsSync(this.configFile)) {
            yaml.writeSync(this.configFile, defaultConfigData);
        }

        return yaml.readSync(this.configFile);
    }
}

module.exports = TerasliceCliConfig;
