'use strict';

const _ = require('lodash');
const path = require('path');
const url = require('url');
const yaml = require('node-yaml');
const fs = require('fs');
const homeDir = require('os').homedir();
const process = require('process');
const reply = require('./reply')();
const shortHand = require('./shorthand')();

module.exports = (cliConfig, command) => {
    function returnConfigData(notsuCheck) {
        cliConfig.version = require('../../package.json').version;
        // some commands should not have tsu data, otherwise file is checked for tsu data
        cliConfig.tsu_check = !notsuCheck;
        // add job data to the cliConfig object for easy reference
        // explicitly state the cluster that the code will reference for the job
        // read config file
        cliConfig.configFile = createConfigFile(cliConfig);
        cliConfig.config = yaml.readSync(cliConfig.configFile);
        // set output format
        cliConfig.output_style = cliConfig.o;
        // set annotation
        if (cliConfig.n === '') {
            cliConfig.add_annotation = false;
        } else {
            cliConfig.add_annotation = true;
            cliConfig.annotation_env = cliConfig.n;
        }

        if (cliConfig._[2] !== undefined) {
            _.set(cliConfig, 'cluster_sh', cliConfig._[2]);
            cliConfig.deets = shortHand.parse(cliConfig.cluster_sh);
        } else {
            reply.fatal('cluster alias required');
        }

        if (command === 'cluster:list') {
            return;
        }
        if (command === 'cluster:alias') {
            _.set(cliConfig, 'cluster_sh', cliConfig._[2]);
            cliConfig.deets = shortHand.parse(cliConfig.cluster_sh);
            cliConfig.cluster = cliConfig.deets.cluster;
            cliConfig.port = cliConfig.p;
            cliConfig.host = cliConfig.c;
            cliConfig.cluster_manager_type = cliConfig.t;
        } else {
            if (cliConfig.status) {
                cliConfig.statusList = _.split(cliConfig.status, ':');
            } else {
                cliConfig.statusList = ['running', 'failing'];
            }
            if (_.has(cliConfig, 'deets.cluster')) {
                cliConfig.cluster = cliConfig.deets.cluster;
                cliConfig.cluster_url = getClusterHost(cliConfig);
            } else {
                cliConfig.cluster_url = cliConfig.l ? 'http://localhost:5678' : getClusterHost(cliConfig);
            }
            if (!cliConfig.cluster_url) {
                reply.fatal('Use -c to specify a cluster or use -l for localhost');
            }
            cliConfig.hostname = url.parse(cliConfig.cluster_url).hostname;
            if (cliConfig.a === undefined || cliConfig.a === false) {
                cliConfig.all_jobs = false;
            } else {
                cliConfig.all_jobs = true;
            }
            // set the state file name
            if (cliConfig.d) {
                cliConfig.state_file = path.join(cliConfig.d, `${cliConfig.cluster}-state.json`);
            } else {
                cliConfig.state_file = path.join(cliConfig.config.paths.job_state_dir, `${cliConfig.cluster}-state.json`);
            }
            // env isn't always needed
            if (cliConfig.env === '' && cliConfig.config.clusters[cliConfig.cluster]) {
                cliConfig.env = cliConfig.config.clusters[cliConfig.cluster].env;
            }
            cliConfig.cluster_manager_type = cliConfig.config.clusters[cliConfig.cluster].cluster_manager_type;
        }
    }

    function getClusterHost(config) {
        let host = '';
        let port = 0;
        let clusterUrl = '';
        if (config.cluster in config.config.clusters) {
            host = config.config.clusters[config.cluster].host;
            port = config.config.clusters[config.cluster].port;
            clusterUrl = _urlCheck(`${host}:${port}`);
        } else {
            clusterUrl = _urlCheck(config.cluster);
        }
        return clusterUrl;
    }

    function createConfigFile() {
        const configDir = `${homeDir}/.teraslice`;
        const configFile = `${configDir}/earl.yaml`;
        const defaultConfigData = {
            clusters:
               { localhost: { host: 'localhost', port: 5678, cluster_manager_type: 'native' } },
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
        if (inUrl.indexOf(':') === -1) {
            outUrl = inUrl.indexOf('http') === -1 ? `http://${inUrl}:${defaultPort}` : `${inUrl}:${defaultPort}`;
        } else {
            outUrl = inUrl.indexOf('http') === -1 ? `http://${inUrl}` : inUrl;
        }
        return outUrl;
    }

    return {
        returnConfigData,
        _urlCheck
    };
};
