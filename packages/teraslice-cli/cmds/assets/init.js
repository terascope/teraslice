'use strict';

const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('node-pty');
const Config = require('../../lib/config');
const YargsOptions = require('../../lib/yargs-options');
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();


exports.command = 'init';
exports.desc = 'Creates a new asset bundle or asset processor.  If called without --processor it builds the whole asset in the current directory.  Used with the --processor it adds an asset to the ./asset dir';
exports.builder = (yargs) => {
    yargs.option('processor', yargsOptions.buildOption('processor'));
    yargs.option('base-dir', yargsOptions.buildOption('base-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 asset init');
    yargs.example('$0 asset init --processor');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const assetBaseDir = cliConfig.args.baseDir;

    function execute() {
        return new Promise((resolve, reject) => {
            const answers = process.stdin;
            answers.setRawMode(true);
            answers.resume();
            answers.setEncoding('utf8');

            answers.on('data', (key) => {
                if (key === '\u0003') resolve();
            });

            let term;
            if (argv.proc) {
                term = spawn('yarn', ['yo', '--no-insight', '--no-update-notifier', path.join(__dirname, '..', '..', 'generators', 'new-processor'), assetBaseDir, '--new'], { cwd: __dirname });
            } else {
                term = spawn('yarn', ['yo', '--no-insight', '--no-update-notifier', path.join(__dirname, '..', '..', 'generators', 'new-asset'), assetBaseDir], { cwd: __dirname });
            }

            term.on('data', data => process.stdout.write(data));
            term.on('error', error => reject(error));

            answers.on('error', error => reject(error));
            answers.pipe(term);

            term.on('exit', () => resolve('done'));
        });
    }

    // if just adding a new processor AssetBaseDir needs to have an asset dir
    if (argv.proc && !fs.pathExistsSync(path.join(assetBaseDir, 'asset'))) {
        reply.fatal('Execute the command in the base directory of an asset or use the --base-dir with the asset\'s full path');
    }

    try {
        await execute();
        reply.green('All done!');
    } catch (e) {
        reply.fatal(e);
    }

    process.exit(0);
};
