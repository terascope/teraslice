'use strict';

const _ = require('lodash');
const path = require('path');
const url = require('url');
const yaml = require('node-yaml');
const fs = require('fs');
const request = require('request');

// const rp = require('request-promise');
const homeDir = require('os').homedir();
const process = require('process');
const reply = require('./reply')();
const shortHand = require('./shorthand')();

module.exports = (cliConfig, command) => {
    function returnConfigData() {
        cliConfig.version = require('../../package.json').version;
        cliConfig.cluster_manager_type = 'native';
        // read config file
        cliConfig.configFile = createConfigFile(cliConfig);
        cliConfig.config = yaml.readSync(cliConfig.configFile);

        // set output format
        cliConfig.output_style = cliConfig.o;
        // set annotation
        if (cliConfig.n === '' || cliConfig.n === undefined) {
            cliConfig.add_annotation = false;
        } else {
            cliConfig.add_annotation = true;
            cliConfig.annotation_env = cliConfig.n;
        }

        if (!_.has(cliConfig, 'baseDir')) {
            cliConfig.baseDir = process.cwd();
        }

        // tjm command config
        if (command.startsWith('tjm')) {
            if (command === 'tjm:init') {
                return;
            }

            if (_.has(cliConfig, 'cluster')) {
                cliConfig.cluster_url = getClusterHost(cliConfig);
            }
            const jobFile = require('./job_file')(cliConfig);

            if (command === 'tjm:reset') {
                jobFile.read(false);
            } else {
                jobFile.read();
            }

            if (_.has(cliConfig.job_file_content, '__metadata.cli')) {
                cliConfig.cluster_url = cliConfig.job_file_content.__metadata.cli.cluster;
                cliConfig.deets = {};
                cliConfig.deets.file = cliConfig.job_file;
                cliConfig.deets.id = cliConfig.job_file_content.__metadata.cli.job_id;
                let match = false;
                _.each(cliConfig.config.clusters, (clusterAliasItem, clusterAlias) => {
                    if (clusterAliasItem.host === cliConfig.cluster_url) {
                        cliConfig.cluster = clusterAlias;
                        match = true;
                    }
                });
                if (!match) {
                    cliConfig.cluster = cliConfig.cluster_url;
                }
            }

            if (!_.has(cliConfig, 'cluster') && command !== 'tjm:reset') {
                reply.fatal('cluster is required with an unregistered job');
            }
            return;
        }

        // other command configs
        if (cliConfig.cluster_sh !== undefined) {
            cliConfig.deets = shortHand.parse(cliConfig.cluster_sh, cliConfig.type);
        }

        if (command === 'aliases:list' || command === 'jobs:reset') {
            return;
        }

        if (command.startsWith('assets:init')) {
            return;
        }

        if (command === 'assets:status') {
            if (_.has(cliConfig.deets, 'cluster')) {
                cliConfig.cluster = cliConfig.deets.cluster;
                if (_.has(cliConfig.config.clusters, cliConfig.deets.cluster)) {
                    cliConfig.cluster_url = getClusterHost(cliConfig);
                } else {
                    reply.fatal(`cluster alias ${cliConfig.deets.cluster} not defined`);
                }
            }
            return;
        }
        if (command === 'jobs:init') {
            return;
        }

        if (command === 'aliases:add' || command === 'aliases:remove' || command === 'aliases:update') {
            cliConfig.cluster = cliConfig.deets.cluster;
            cliConfig.host = cliConfig.c;
        } else {
            if (cliConfig.status) {
                cliConfig.statusList = _.split(cliConfig.status, ',');
            } else {
                cliConfig.statusList = ['running', 'failing'];
            }

            if (_.has(cliConfig, 'deets.cluster')) {
                cliConfig.cluster = cliConfig.deets.cluster;
                if (_.has(cliConfig.config.clusters, cliConfig.deets.cluster)) {
                    cliConfig.cluster_url = getClusterHost(cliConfig);
                } else {
                    reply.fatal(`cluster alias ${cliConfig.deets.cluster} not defined`);
                }
            } else {
                cliConfig.c = undefined;
                cliConfig.cluster_url = cliConfig.l ? 'http://localhost:5678' : getClusterHost(cliConfig);
            }
            if (!cliConfig.cluster_url) {
                reply.fatal('Use -c to specify a cluster or use -l for localhost');
            }
            cliConfig.hostname = url.parse(cliConfig.cluster_url).hostname;
            cliConfig.all_jobs = !(cliConfig.a === undefined || cliConfig.a === false);
            // set the state file name
            if (cliConfig.d) {
                cliConfig.state_file = path.join(cliConfig.d, `${cliConfig.cluster}-state.json`);
            } else {
                cliConfig.state_file = path.join(cliConfig.config.paths.job_state_dir, `${cliConfig.cluster}-state.json`);
            }
        }
    }



    function getClusterHost(config) {
        let clusterUrl = '';
        if (config.cluster in config.config.clusters) {
            clusterUrl = config.config.clusters[config.cluster].host;
        } else {
            clusterUrl = _urlCheck(config.cluster);
        }
        return clusterUrl;


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

    function stateFileHandler() {
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
        returnConfigData,
        stateFileHandler,
        getClusterHost,
        _urlCheck
    };
};
