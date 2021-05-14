import path from 'path';
import pkgUp from 'pkg-up';
import fse from 'fs-extra';
import defaultsDeep from 'lodash/defaultsDeep';
import { isPlainObject, get, toTitleCase } from '@terascope/utils';
import sortPackageJson from 'sort-package-json';
import { PackageInfo, RootPackageInfo, Service } from './interfaces';
import { NPM_DEFAULT_REGISTRY, DEV_TAG } from './config';
import signale from './signale';

let rootDir: string | undefined;

export function getRootDir(cwd: string = process.cwd()): string {
    if (rootDir) return rootDir;
    const rootPkgJSON = pkgUp.sync({ cwd });
    if (!rootPkgJSON) {
        throw new Error('Unable to find root directory, run in the root of the repo');
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
    if (!isRoot) return undefined;

    const dir = path.dirname(pkgJSONPath);
    const folderName = path.basename(dir);

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
        terascope: {
            root: isRoot,
            type: 'monorepo',
            target: 'es2020',
            tests: {
                suites: {}
            },
            docker: {
                registries: [`terascope/${folderName}`],
            },
            npm: {
                registry: NPM_DEFAULT_REGISTRY
            }
        },
    } as Partial<RootPackageInfo>));
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
    const invalidServices = services.filter((name) => !Object.values(Service).includes(name));
    if (invalidServices.length) {
        const actual = invalidServices.join(', ');
        const expected = Object.values(Service).join(', ');
        throw new Error(`Unsupported service(s) ${actual}, expected ${expected}`);
    }
    return services;
}

export function getDevDockerImage(): string {
    const rootInfo = getRootInfo();
    const [registry] = rootInfo.terascope.docker.registries;
    return `${registry}:dev-${DEV_TAG}`;
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
