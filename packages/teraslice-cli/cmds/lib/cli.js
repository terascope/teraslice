'use strict';

const homeDir = require('os').homedir();

module.exports = () => {
    function args(commandLevel1, commandLevel2, yargs) {
        yargs
            .option('cluster', {
                alias: 'c',
                describe: 'Cluster to list job from.',
                default: 'http://localhost:5678'
            })
            .option('conf', {
                describe: 'Config file',
                default: `${homeDir}/.teraslice/tsu.yaml`
            })
            .option('state-file-dir', {
                alias: 'd',
                describe: 'Directory to save job state files to.',
                default: `${homeDir}/.teraslice/job_state_files`
            })
            .option('output', {
                alias: 'o',
                describe: 'Output display format pretty or txt, default is pretty',
                default: 'txt'
            })
            /*
            .option('env', {
                alias: 'e',
                describe: 'environment, used by annotations',
                default: ''
            })
            */
            .option('cluster-manager-type', {
                alias: 't',
                describe: 'cluster manager type, kubernetes or native',
                default: 'native'
            })
            .option('info', {
                alias: 'i',
                describe: 'show cluster info',
                default: false
            })

            .example(`tjm ${commandLevel1} ${commandLevel2} localhost`);
        return yargs.option;
    }

    return {
        args
    };
};
