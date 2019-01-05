'use strict';

const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const _ = require('lodash');
const fs = require('fs-extra');
const prompts = require('prompts');

const Config = require('../../lib/config');
const reply = require('../lib/reply')();
const rootPackageJson = require('./init_files/rootPackage');
const assetPackageJson = require('./init_files/assetPackage');
const eslintrc = require('./init_files/eslintrc');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();


exports.command = 'init <asset-name>';
exports.desc = 'creates a new asset bundle.  This includes package.json, asset.json, README.md, an asset directory and basic dependencies';
exports.builder = (yargs) => {
    yargs.positional('asset-name', yargsOptions.buildPositional('asset-name'));
    yargs.option('base-dir', yargsOptions.buildOption('base-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('earl asset init asset_name');
};

// TODO: This should be refactored to decouple the CLI code (prompts) from
// the actual asset creation code.  Then tests should be implemented for the
// asset creation code.
exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const assetOutDir = cliConfig.args.baseDir;

    reply.yellow('This will create a package.json, README.md, asset dir, spec dir,'
        + `asset/asset.json, asset/package.json, and install various npm packages in ${assetOutDir}.`);

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
    // package.json and asset.json all have this data
    if (assetData.asset_version === '') {
        assetData.asset_version = '0.0.1';
    }
    const packageJson = {
        name: cliConfig.args.assetName,
        version: assetData.asset_version,
        description: assetData.asset_desc
    };

    // create needed files and directories
    try {
        await fs.ensureDir(path.join(assetOutDir, 'asset'));
        await fs.writeJSON(path.join(assetOutDir, 'package.json'), _.merge(rootPackageJson, packageJson), { spaces: 4 });
        await fs.writeJSON(path.join(assetOutDir, 'asset', 'package.json'), _.merge(assetPackageJson, packageJson), { spaces: 4 });
        await fs.writeJson(path.join(assetOutDir, 'asset', 'asset.json'), packageJson, { spaces: 4 });
        await fs.ensureDir(path.join(assetOutDir, 'spec'));
        await fs.writeJSON(path.join(assetOutDir, '.eslintrc'), eslintrc, { spaces: 4 });
        await fs.writeFile(path.join(assetOutDir, 'README.md'), '');
        reply.green(`Created initial directories and files in ${assetOutDir}`);
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
        reply.green(`Directory ${processorName.processor_name} was created in ${assetOutDir}/asset`);
        try {
            await fs.ensureFile(path.join(assetOutDir, 'asset', processorName.processor_name, 'index.js'));
            await fs.writeFile(path.join(assetOutDir, 'spec', `${processorName.processor_name}-spec.js`), '');
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
        const yarn = await isInstalled('yarn');
        const npm = await isInstalled('npm');
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
        reply.green('installing root dependencies, this could take a few minutes');
        const rootDependencies = await exec(installCmd);
        reply.yellow(rootDependencies.stderr);
        reply.green(rootDependencies.stdout);
        // install in base/asset dir
        reply.green('installing asset dependencies, this could take a few minutes');
        const assetDependencies = await exec(`cd asset && ${installCmd}`);
        reply.yellow(assetDependencies.stderr);
        reply.green(assetDependencies.stdout);
    } catch (e) {
        reply.fatal(e);
    }
    reply.green('Your asset directory has been created!');
};


// TODO: this should be extracted to a top level module
// Supporting Functions

// check if yarn or npm is installed, prefer yarn
async function isInstalled(name) {
    let installed;
    try {
        await exec(`which ${name}`);
        installed = true;
    } catch (e) {
        installed = false;
    }
    return installed;
}
