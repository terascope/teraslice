import fs from 'node:fs';
import path from 'node:path';
import fse from 'fs-extra';
import { execaCommand } from 'execa';
import { load } from 'js-yaml';
import { parseDocument } from 'yaml';
import { packageUpSync } from 'package-up';
import sortPackageJson from 'sort-package-json';
import {
    isPlainObject, get, toTitleCase,
    defaultsDeep, debugLogger
} from '@terascope/core-utils';

const logger = debugLogger('ts-scripts:misc');
import { Service } from '@terascope/types';
import { PackageInfo, RootPackageInfo } from './interfaces.js';
import config from './config.js';
import signale from './signale.js';

const {
    NPM_DEFAULT_REGISTRY, DEV_TAG, DEV_DOCKER_IMAGE,
    ENV_SERVICES
} = config;
let rootDir: string | undefined;

export function getRootDir(cwd: string = process.cwd()): string {
    if (rootDir) return rootDir;

    const rootPkgJSON = packageUpSync({ cwd });

    if (!rootPkgJSON) {
        throw new Error(`Unable to find root directory, run in the root of the repo. cwd is ${cwd}, rootPkgJSON is ${rootPkgJSON}`);
    }

    if (_getRootInfo(rootPkgJSON) != null) {
        rootDir = path.dirname(rootPkgJSON);
        return rootDir;
    }

    const upOne = path.join(path.dirname(rootPkgJSON), '..');

    if (!fse.existsSync(upOne) || !fse.statSync(upOne).isDirectory()) {
        throw new Error('Unable to find root directory');
    }

    return getRootDir(upOne);
}

function _getRootInfo(pkgJSONPath: string): RootPackageInfo | undefined {
    const pkg = fse.readJSONSync(pkgJSONPath);
    const isRoot = get(pkg, 'terascope.root', false);
    const dir = path.dirname(pkgJSONPath);
    const pathAsset = `${dir}/asset/asset.json`;
    const isRootAsset = fse.existsSync(pathAsset);
    if (!isRoot && !isRootAsset) return undefined;

    const folderName = path.basename(dir);

    if (isRootAsset) {
        return sortPackageJson(defaultsDeep(pkg, {
            dir,
            relativeDir: '.',
            folderName,
            displayName: getName(pkg.name),
            engines: {
                node: '>=16.0.0',
                // TODO: re-enable once all repos are fully migrated to pnpm
                // pnpm: '>=10.25.0'
            },
            terascope: {
                root: true,
                asset: true,
                tests: {
                    suites: {}
                },
            },
        } as Partial<RootPackageInfo>));
    }
    if (isRoot) {
        return sortPackageJson(defaultsDeep(pkg, {
            dir,
            relativeDir: '.',
            folderName,
            displayName: getName(pkg.name),
            documentation: '',
            homepage: '',
            bugs: {
                url: '',
            },
            engines: {
                node: '>=16.0.0',
                // TODO: re-enable once all repos are fully migrated to pnpm
                // pnpm: '>=10.25.0'
            },
            terascope: {
                root: true,
                asset: false,
                type: 'monorepo',
                target: 'es2019',
                version: 1,
                tests: {
                    suites: {}
                },
                docker: {
                    registries: [`terascope/${folderName}`],
                },
                npm: {
                    registry: NPM_DEFAULT_REGISTRY
                },
            },
        } as Partial<RootPackageInfo>));
    }
}

let _rootInfo: RootPackageInfo;

export function getRootInfo(): RootPackageInfo {
    if (_rootInfo) return _rootInfo;
    _rootInfo = _getRootInfo(path.join(getRootDir(), 'package.json'))!;
    return _rootInfo;
}

export function getAvailableTestSuites(): string[] {
    return Object.keys(getRootInfo().terascope.tests.suites);
}

export function getServicesForSuite(suite: string): Service[] {
    const services = getRootInfo().terascope.tests.suites[suite] || [];

    if (ENV_SERVICES.length) {
        services.push(...ENV_SERVICES);
    }

    const invalidServices = services.filter((name) => !Object.values(Service).includes(name));

    if (invalidServices.length) {
        const actual = invalidServices.join(', ');
        const expected = Object.values(Service).join(', ');
        throw new Error(`Unsupported service(s) ${actual}, expected ${expected}`);
    }

    return services;
}

export function getDevDockerImage(nodeVersion?: string): string {
    if (DEV_DOCKER_IMAGE) return `${DEV_DOCKER_IMAGE}-nodev${nodeVersion}`;

    const rootInfo = getRootInfo();
    const [registry] = rootInfo.terascope.docker.registries;
    return `${registry}:dev-${DEV_TAG}-nodev${nodeVersion}`;
}

export function getName(input: string): string {
    return toTitleCase(input);
}

export function listMdFiles(dir: string, levels = 10): string[] {
    if (levels < 1) return [];
    if (!dir || !fse.statSync(dir).isDirectory()) {
        throw new Error(`Invalid directory "${dir}" given to listMdFiles`);
    }

    const files: string[] = [];
    for (const fileName of fse.readdirSync(dir)) {
        const filePath = path.join(dir, fileName);
        if (fse.statSync(filePath).isDirectory()) {
            files.push(...listMdFiles(filePath, levels - 1));
        } else if (path.extname(fileName) === '.md') {
            files.push(filePath);
        }
    }
    return files;
}

export type WriteIfChangedOptions = { mkdir?: boolean; log?: boolean };
export async function writeIfChanged(
    filePath: string,
    contents: unknown,
    options: WriteIfChangedOptions = {}
): Promise<boolean> {
    if (options.mkdir) {
        await fse.ensureDir(path.dirname(filePath));
    }

    const exists = fse.existsSync(filePath);
    if (exists && !fse.statSync(filePath).isFile()) {
        throw new Error('Unable to write to non-file type');
    }

    if (!contents) {
        if (exists) {
            await fse.unlink(filePath);
        }
        return true;
    }

    if (typeof contents === 'string') {
        const _contents = `${contents.trim()}\n`;
        if (exists) {
            const existing = await fse.readFile(filePath, 'utf8');
            if (existing === _contents) {
                return false;
            }
        }
        if (options.log !== false) {
            signale.debug(`wrote ${path.relative(getRootDir(), filePath)} file`);
        }
        await fse.writeFile(filePath, _contents, 'utf8');
        return true;
    }
    if (isPlainObject(contents) || Array.isArray(contents)) {
        if (exists) {
            const existing = await fse.readJSON(filePath);
            if (JSON.stringify(existing) === JSON.stringify(contents)) {
                return false;
            }
        }

        if (options.log !== false) {
            signale.debug(`wrote ${path.relative(getRootDir(), filePath)} JSON file`);
        }
        await fse.writeJSON(filePath, contents, {
            spaces: 4,
        });
        return true;
    }

    throw new Error('Invalid contents given to writeIfChanged');
}

export function formatList(list: string[]): string {
    return `\n - ${list.join('\n - ')}`;
}

export function writeHeader(msg: string, prefixNewline?: boolean): void {
    if (prefixNewline) process.stderr.write('\n');
    signale.star(`${msg}`);
}

export function writePkgHeader(
    prefix: string,
    pkgInfos: PackageInfo[],
    prefixNewline?: boolean
): void {
    const names = pkgInfos.map(({ name }) => name).join(', ');
    writeHeader(`${prefix} for ${names}`, prefixNewline);
}

export const TEST_CONFIGS = 'test-configs';

export type ArgsMap = { [key: string]: string | string[] };
export function mapToArgs(input: ArgsMap): string[] {
    const args: string[] = [];
    for (const [key, value] of Object.entries(input)) {
        const vals = Array.isArray(value) ? value : [value];
        if (key.length > 1) {
            args.push(`--${key}`, ...vals);
        } else {
            args.push(`-${key}`, ...vals);
        }
    }
    return args.filter((str) => str != null && str !== '');
}

export async function getConfigValueFromCustomYaml(
    configFilePath: string,
    valuePath: string
): Promise<any> {
    const customConfig = load(fs.readFileSync(configFilePath, 'utf8')) as any;

    const value = get(customConfig, valuePath, undefined);
    return value;
}

export async function setConfigValuesForCustomYaml(
    configFilePath: string,
    valuePath: string,
    valueToSet: unknown
): Promise<void> {
    try {
        const customConfig = parseDocument(fs.readFileSync(configFilePath, 'utf8'));
        const splitPath = valuePath.split('.');
        customConfig.setIn(splitPath, valueToSet);
        fs.writeFileSync(configFilePath, customConfig.toString(), 'utf8');
    } catch (err) {
        throw new Error(`Failed to set ${valuePath} to ${valueToSet} in config file ${configFilePath}. Reason: ${err.message}`);
    }
}

export async function logTCPPorts(service: string) {
    try {
        const command = 'netstat -an | grep \'^tcp\' | awk \'{print $4}\' | tr ".:" " " | awk \'{print $NF}\' | sort -n | uniq | tr "\n" " "';
        const subprocess = await execaCommand(command, { shell: true, reject: false });
        const { stdout, stderr } = subprocess;

        if (stderr) {
            throw new Error(stderr);
        }
        signale.info(`TCP Ports currently in use when starting ${service}:\n ${stdout}`);
    } catch (err) {
        signale.error(`Execa command failed trying to log ports: ${err}`);
    }
}

export async function pgrep(name: string): Promise<string> {
    const subprocess = await execaCommand('ps aux', { reject: false });
    if (!subprocess.stdout) {
        throw new Error('Invalid result from ps aux');
    }
    const found = subprocess.stdout.split('\n').find((line) => {
        if (!line) return false;
        return line.toLowerCase().includes(name.toLowerCase());
    });
    if (found) {
        logger.trace('found process', found);
        return found;
    }
    return '';
}
