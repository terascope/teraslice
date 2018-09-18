'use strict';

const prompts = require('prompts');
const _ = require('lodash');
const path = require('path');
const fs = require('fs-extra');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'init <asset_name>';
exports.desc = 'creates asset basic asset directory and files that can be posted to teraslice';
exports.builder = (yargs) => {
    cli().args('cluster', 'alias', yargs);
    yargs.example('tjm asset init asset_name');
};

exports.handler = async (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'asset:init').returnConfigData(false, false);
    // inject prompts answers for testing
    if (_testFunctions) {
        await prompts.inject({
            asset: _testFunctions.asset,
            processor: _testFunctions.processor,
            processor_name: _testFunctions.processor_name,
            asset_name: _testFunctions.asset_name,
            asset_desc: _testFunctions.asset_desc,
            asset_version: _testFunctions.asset_version
        });
    }
    const { baseDir } = cliConfig;
    // create asset directory
    reply.yellow(`This will create an 'asset' directory in ${baseDir}.`);
    const create = await prompts({
        type: 'confirm',
        name: 'asset',
        message: 'Continue and create an asset directory?'
    });
    if (!create.asset) reply.fatal('Exiting asset init process');
    // create asset directory
    try {
        await fs.ensureDir(path.join(cliConfig.baseDir, 'asset'));
    } catch (e) {
        reply.fatal('Could not create asset directory');
    }
    reply.green(`Created asset directory in ${baseDir}`);
    const questions = [
        {
            type: 'text',
            name: 'asset_desc',
            message: 'Asset description:'
        },
        {
            type: 'text',
            name: 'asset_version',
            message: 'Asset version (defaults to 0.0.1):'
        }
    ];
    const assetData = await prompts(questions);
    const assetFileData = {
        name: cliConfig.asset_name,
        description: assetData.asset_desc,
        version: assetData.asset_version === '' ? '0.0.1' : assetData.asset_version
    };
    try {
        await fs.writeJson(path.join(baseDir, 'asset', 'asset.json'), assetFileData, { spaces: 4 });
    } catch (e) {
        reply.fatal(e);
    }
    const processor = await prompts({
        type: 'confirm',
        name: 'processor',
        message: 'Would you like to add a processor to the asset?'
    });
    if (!processor.processor) reply.green('Finished with asset init');
    const processorName = await prompts([{ type: 'text', name: 'processor_name', message: 'Processor name:' }]);
    try {
        await fs.ensureFile(path.join(baseDir, 'asset', processorName.processor_name, 'index.js'));
    } catch (e) {
        reply.fatal(e);
    }
    reply.green(`Directory ${processorName.name} was created in ${baseDir}/asset`);
    reply.green('Your asset directory has been created!');
};
