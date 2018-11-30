'use strict';

exports.args = (yargs) => {
    yargs
        .option('cluster_url', {
            alias: 'c',
            describe: 'terslice cluster URL',
            type: 'string',
            requiresArg: 1
        });
    return yargs.option;
};
