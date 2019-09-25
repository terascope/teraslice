import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import yaml from 'js-yaml';
import { cloneDeep } from '@terascope/utils';
import * as i from './interfaces';

export function getDefaultConfigFile() {
    const cwd = process.cwd();

    if (process.env.TERAFOUNDATION_CONFIG) {
        return path.resolve(process.env.TERAFOUNDATION_CONFIG);
    }

    if (fs.existsSync('/app/config/config.yaml')) {
        return '/app/config/config.yaml';
    }

    if (fs.existsSync('/app/config/config.yml')) {
        return '/app/config/config.yml';
    }

    if (fs.existsSync('/app/config/config.json')) {
        return '/app/config/config.json';
    }

    if (fs.existsSync(path.join(cwd, './config.yaml'))) {
        return path.join(cwd, './config.yaml');
    }

    if (fs.existsSync(path.join(cwd, './config.yml'))) {
        return path.join(cwd, './config.yml');
    }

    if (fs.existsSync(path.join(cwd, './config.json'))) {
        return path.join(cwd, './config.json');
    }

    return undefined;
}

export function getArgs(
    scriptName: string,
    defaultConfigFile?: string
): { configFile: i.FoundationSysConfig<any>; bootstrap: boolean } {
    const { argv } = yargs.usage('Usage: $0 [options]')
        .scriptName(scriptName)
        .version()
        .alias('v', 'version')
        .help()
        .alias('h', 'help')
        .detectLocale(false)
        .option('c', {
            alias: 'configfile',
            default: getDefaultConfigFile(),
            describe: `Terafoundation configuration file to load.
                        Defaults to env TERAFOUNDATION_CONFIG.`,
            coerce: (arg) => parseConfigFile(arg || defaultConfigFile),
        })
        .option('b', {
            alias: 'bootstrap',
            describe: 'Perform initial setup'
        })
        .wrap(yargs.terminalWidth());

    return {
        bootstrap: Boolean(argv.bootstrap),
        configFile: argv.configfile as i.FoundationSysConfig<any>,
    };
}

export function parseConfigFile(file: string) {
    const configFile = file ? path.resolve(file) : undefined;
    if (!configFile || !fs.existsSync(configFile)) {
        throw new Error(`Could not find a usable config file at the path: ${configFile}`);
    }

    if (['.yaml', '.yml'].includes(path.extname(configFile))) {
        return yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
    }

    return cloneDeep(require(configFile));
}
