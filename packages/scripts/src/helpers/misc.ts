import path from 'path';
import pkgUp from 'pkg-up';
import fse from 'fs-extra';
import { isPlainObject, get } from '@terascope/utils';
import { PackageInfo, RootPackageInfo } from './interfaces';
import signale from './signale';

export let rootDir: string | undefined;
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

    return getRootDir(path.join(path.dirname(rootPkgJSON), '..'));
}

function _getRootInfo(pkgJSONPath: string): RootPackageInfo | undefined {
    const pkg = fse.readJSONSync(pkgJSONPath);
    const isRoot = get(pkg, 'terascope.root', false);
    if (!isRoot) return undefined;
    return {
        root: isRoot,
        type: get(pkg, 'terascope.type', 'monorepo'),
        docker: {
            image: get(pkg, 'terascope.docker.registry', 'terascope/teraslice'),
            cache_layers: get(pkg, 'terascope.docker.cache_layers', []),
        },
    };
}

export function getRootInfo() {
    return _getRootInfo(path.join(getRootDir(), 'package.json'))!;
}

export function getName(input: string): string {
    return input
        .split(/\W/g)
        .map((str) => str.trim())
        .filter((str) => str.length > 0)
        .map((str: string) => `${str.charAt(0).toUpperCase()}${str.slice(1)}`)
        .join(' ');
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
export async function writeIfChanged(filePath: string, contents: any, options: WriteIfChangedOptions = {}): Promise<boolean> {
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

export function formatList(list: string[]) {
    return `\n\n - ${list.join('\n - ')}`;
}

export function writeHeader(msg: string, prefixNewline?: boolean): void {
    if (prefixNewline) process.stderr.write('\n');
    signale.star(`${msg}`);
}

export function writePkgHeader(prefix: string, pkgInfos: PackageInfo[], prefixNewline?: boolean): void {
    const names = pkgInfos.map(({ name }) => name).join(', ');
    writeHeader(`${prefix} for ${names}`, prefixNewline);
}
