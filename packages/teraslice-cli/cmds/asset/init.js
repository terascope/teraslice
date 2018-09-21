'use strict';

const prompts = require('prompts');
const _ = require('lodash');
const path = require('path');
const fs = require('fs-extra');

const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');
const rootPackageJson = require('./lib/init_files/rootPackage');
const assetPackageJson = require('./lib/init_files/assetPackage');
const eslintrc = require('./lib/init_files/eslintrc');

exports.command = 'init <asset_name>';
exports.desc = 'creates asset basic asset directory and files that can be posted to teraslice';
exports.builder = (yargs) => {
    cli().args('cluster', 'alias', yargs);
    yargs.example('tjm asset init asset_name');
};

exports.handler = async (argv, _testFunctions) => {
    const assetFunctions = _testFunctions || require('./lib')();
    const cliConfig = _.clone(argv);
    config(cliConfig, 'asset:init').returnConfigData(false, false);
    // inject prompts answers for testing
    if (_testFunctions) {
        await prompts.inject({
            asset: _testFunctions.asset,
            processor: _testFunctions.processor,
            dependencies: _testFunctions.dependencies,
            processor_name: _testFunctions.processor_name,
            asset_name: _testFunctions.asset_name,
            asset_desc: _testFunctions.asset_desc,
            asset_version: _testFunctions.asset_version,
            installer: _testFunctions.installer
        });
    }
    const { baseDir } = cliConfig;
    // create asset directory
    reply.yellow('This will create a package.json, README.md, asset dir, spec dir,'
        + `asset/asset.json, asset/package.json, and install various npm packages in ${baseDir}.`);

    const create = await prompts({
        type: 'confirm',
        name: 'asset',
        message: 'Continue and create the asset related files and directories?'
    });

    if (!create.asset) reply.fatal('Exiting asset creation process');
    // get description and version
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
    // package.jsons and asset.json all have this data
    const packageJson = {
        name: cliConfig.asset_name,
        version: assetData.asset_version,
        description: assetData.asset_desc
    };
    // create needed files and directories
    try {
        await fs.ensureDir(path.join(cliConfig.baseDir, 'asset'));
        await fs.writeJSON(path.join(baseDir, 'package.json'), _.merge(rootPackageJson, packageJson), { spaces: 4 });
        await fs.writeJSON(path.join(baseDir, 'asset', 'package.json'), _.merge(assetPackageJson, packageJson), { spaces: 4 });
        await fs.writeJson(path.join(baseDir, 'asset', 'asset.json'), packageJson, { spaces: 4 });
        await fs.ensureDir(path.join(baseDir, 'spec'));
        await fs.writeJSON(path.join(baseDir, '.eslintrc'), eslintrc, { spaces: 4 });
        await fs.writeFile(path.join(baseDir, 'README.md'), '');
        reply.green(`Created initial directories and files in ${baseDir}`);
    } catch (e) {
        reply.fatal(e);
    }
    // add a processor
    const processor = await prompts({
        type: 'confirm',
        name: 'processor',
        message: 'Would you like to add a processor to the asset?'
    });
    if (processor.processor) {
        const processorName = await prompts([{ type: 'text', name: 'processor_name', message: 'Processor name:' }]);
        reply.green(`Directory ${processorName.processor_name} was created in ${baseDir}/asset`);
        try {
            await fs.ensureFile(path.join(baseDir, 'asset', processorName.processor_name, 'index.js'));
            await fs.writeFile(path.join(baseDir, 'spec', `${processorName.processor_name}-spec.js`), '');
        } catch (e) {
            reply.fatal(e);
        }
    }
    reply.yellow('The next step will install some basic dependencies for the asset.'
    + '  The dependencies will be installed with npm or yarn.');
    const dependencies = await prompts([{
        type: 'confirm',
        name: 'dependencies',
        message: 'Continue?'
    }]);
    if (!dependencies.dependencies) {
        reply.yellow('Try using npm or yarn to install the needed dependencies');
        reply.fatal('Exiting the init process');
    }
    const installer = await prompts([{
        type: 'select',
        name: 'installer',
        message: 'Select yarn or npm or the cli can try to determine what to use',
        choices: [
            { title: 'yarn', value: 'yarn' },
            { title: 'npm', value: 'npm' },
            { title: 'cli', value: 'cli' }
        ]
    }]);
    let installCmd;
    if (installer.installer === 'cli') {
        const yarn = await assetFunctions.isInstalled('yarn');
        const npm = await assetFunctions.isInstalled('npm');
        if (!yarn && !npm) {
            reply.fatal('The dependencies were not installed, because a package manager was not found.'
            + 'Install yarn and then run yarn install in both root dir and rood dir asset');
        }
        installCmd = yarn ? 'yarn install' : 'npm install';
    } else {
        installCmd = `${installer.installer} install`;
    }
    // install dependencies in root dir and asset dir
    try {
        // install in base dir
        reply.green('installing root dependences, this could take a few minutes');
        const rootDependencies = await assetFunctions.command(installCmd);
        reply.yellow(rootDependencies.stderr);
        reply.green(rootDependencies.stdout);
        // install in base/asset dir
        reply.green('installing asset dependences, this could take a few minutes');
        const assetDependencies = await assetFunctions.command(`cd asset && ${installCmd}`);
        reply.yellow(assetDependencies.stderr);
        reply.green(assetDependencies.stdout);
    } catch (e) {
        reply.fatal(e);
    }
    reply.green('Your asset directory has been created!');
};
