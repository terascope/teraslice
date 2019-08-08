'use strict';

exports.args = (yargs) => {
    yargs
        .option('base_dir', {
            describe: 'specify the base directory to use, defaults to cwd',
            default: process.cwd(),
            type: 'string'
        });
    return yargs.option;
};
