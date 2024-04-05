import fs from 'node:fs';
import path from 'node:path';
import yargs from 'yargs';
import yaml from 'js-yaml';
import { cloneDeep } from '@terascope/utils';
import * as i from './interfaces.js';

export function getDefaultConfigFile(): string|undefined {
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

export function getArgs<S = Record<string, unknown>>(
    defaultConfigFile?: string,
): i.ParsedArgs<S> {
    const { argv } = yargs.usage('Usage: $0 [options]')
        .version()
        .alias('v', 'version')
        .help()
        .alias('h', 'help')
        .detectLocale(false)
        .option('configfile', {
            alias: 'c',
            default: getDefaultConfigFile(),
            describe: `Terafoundation configuration file to load.
                        Defaults to env TERAFOUNDATION_CONFIG.`,
            coerce(arg) {
                return parseConfigFile(arg || defaultConfigFile);
            }
        })
        .wrap(yargs.terminalWidth());

    return (argv as unknown) as i.ParsedArgs<S>;
}

export async function parseConfigFile<D = Record<string, any>>(file: string): Promise<D> {
    const configFile = file ? path.resolve(file) : undefined;
    if (!configFile || !fs.existsSync(configFile)) {
        throw new Error(`Could not find a usable config file at the path: ${configFile}`);
    }

    if (['.yaml', '.yml'].includes(path.extname(configFile))) {
        return yaml.load(fs.readFileSync(configFile, 'utf8')) as any;
    }
    // TODO: find out if there is a better way to do this
    const json = await import(configFile);
    return cloneDeep(json);
}
