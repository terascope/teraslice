'use strict';

const _ = require('lodash');
const path = require('path');
const url = require('url');
const yaml = require('node-yaml');
const fs = require('fs');

const homeDir = require('os').homedir();
const process = require('process');

class TerasliceCliConfig {
    constructor(cliArgs) {
        this.args = _.clone(cliArgs);
        // list command line args map to config items
        // TODO
        this.version = require('../../package.json').version;
        this.default_cluster_manager_type = 'native';
        // TODO: configDir should be `${homeDir}/.teraslice` by default in yargs
        // read config file, creates configDir if necessary
        this.config = this.getConfig();
        this.output_style = _.get(this.args, 'o', 'txt');
        this.annotation = _.get(this.args, 'n', null);

        // this.cluster_alias = this.getClusterAlias();
        // this.cluster_url = this.getClusterUrl();

        //this.cluster_alias = _.get(this, `config.clusters[${this.args.cluster_sh}]`, null);
        //this.cluster_url = _.get(this, `config.clusters.${this.args.c}.host`, 'http://localhost:5678');
    }

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


    get clusterAlias() {
        const clusterAlias = _.get(this.args, 'cluster_alias', '');
        if (clusterAlias !== '') {
            if (!_.has(this.config.clusters, clusterAlias)) {
                throw new Error(`alias not defined in config file: ${clusterAlias}`);
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
            // return this._urlCheck(_.get(this.args, 'cluster_url', ''));
        } else {
            throw new Error('Either cluster_alias or cluster_url must be set on the command line.');
        }
        return this._urlCheck(r);
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

        // console.log(this.configDir);

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

/*
module.exports = (cliArgs) => {
    function setConfig() {
        const cliConfig = {};
        cliConfig.args = _.clone(cliArgs);
        // list command line args map to config items
        // TODO

        cliConfig.version = require('../../package.json').version;
        cliConfig.cluster_manager_type = 'native';

        // read config file
        // TODO: configDir should be `${homeDir}/.teraslice` by default in yargs
        cliConfig.config = getConfig(cliConfig.args.configDir);

        // set output format
        // console.log(cliConfig);
        // console.log(cliArgs.output);

        cliConfig.output_style = _.get(cliConfig.args, 'o', 'txt');
        cliConfig.annotation = _.get(cliConfig.args, 'n', null);

        cliConfig.cluster_alias = _.get(cliConfig, `config.clusters.${cliConfig.args.cluster_sh}`, null);
        cliConfig.cluster_url = _.get(cliConfig, `config.clusters.${cliConfig.args.c}.host`, 'http://localhost:5678');
        // console.log(cliConfig.cluster_url);
        // cliConfig.cluster_alias = null
        // cliConfig.cluster_url = http://...

        // cliConfig.cluster_alias = tera4
        // cliConfig.cluster_url = http://...

        return cliConfig;
    }

    function getCluster(config) {
        let cluster = '';
        if (config.cluster_sh in config.config.clusters) {
            cluster = config.cluster_sh;
        }
        return cluster;
    }

    function getClusterHost(config) {
        let clusterUrl = '';
        if (config.cluster_sh in config.config.clusters) {
            clusterUrl = config.config.clusters[config.cluster_sh].host;
        } else {
            clusterUrl = _urlCheck(config.cluster_sh);
        }
        return clusterUrl;
    }


    function getConfig(configDir) {
        const configFile = `${configDir}/config-cli.yaml`;
        const defaultConfigData = {
            clusters: {
                localhost: { host: 'http://localhost:5678' }
            },
            paths: {
                job_state_dir: `${configDir}/job_state_files`,
                asset_dir: `${configDir}/assets`
            }
        };

        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir);
        }

        // TODO: Loop over paths and make sure they all exist
        if (!fs.existsSync(defaultConfigData.paths.job_state_dir)) {
            fs.mkdirSync(defaultConfigData.paths.job_state_dir);
        }

        if (!fs.existsSync(configFile)) {
            yaml.writeSync(configFile, defaultConfigData);
        }

        return yaml.readSync(configFile);
    }


    function createConfigFile() {
        const configDir = `${homeDir}/.teraslice`;
        const configFile = `${configDir}/config-cli.yaml`;
        const defaultConfigData = {
            clusters:
               { localhost: { host: 'http://localhost:5678' } },
            paths: { job_state_dir: `${configDir}/job_state_files` }
        };
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir);
        }
        if (!fs.existsSync(defaultConfigData.paths.job_state_dir)) {
            fs.mkdirSync(defaultConfigData.paths.job_state_dir);
        }

        if (!fs.existsSync(configFile)) {
            yaml.writeSync(configFile, defaultConfigData);
        }

        return configFile;
    }

    function stateFileHandler(cliConfig) {
        let fName = cliConfig.job_file;

        if (!fName) {
            reply.fatal('Missing the job file!');
        }

        if (fName.lastIndexOf('.json') !== fName.length - 5) {
            fName += '.json';
        }

        const jobFilePath = path.join(process.cwd(), fName);
        let jobContents;

        try {
            jobContents = require(jobFilePath);
        } catch (err) {
            reply.fatal(`Sorry, can't find the JSON file: ${fName}`);
        }

        if (_.isEmpty(jobContents)) {
            reply.fatal('JSON file contents cannot be empty');
        }

        cliConfig.job_file_path = jobFilePath;
        cliConfig.job_file_content = jobContents;
    }

    function _urlCheck(inUrl) {
        // check that url starts with http:// but allow for https://
        const defaultPort = 5678;
        let outUrl = '';
        if (inUrl === '') {
            reply.fatal('empty url');
        }
        if (inUrl.indexOf(':') === -1) {
            outUrl = inUrl.indexOf('http') === -1 ? `http://${inUrl}:${defaultPort}` : `${inUrl}:${defaultPort}`;
        } else {
            outUrl = inUrl.indexOf('http') === -1 ? `http://${inUrl}` : inUrl;
        }
        return outUrl;
    }

    return {
        setConfig,
        stateFileHandler,
        getClusterHost,
        _urlCheck
    };
};
*/
