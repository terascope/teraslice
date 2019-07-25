import fse from 'fs-extra';
import path from 'path';
import pkgUp from 'pkg-up';
import { words, isPlainObject } from 'lodash';
import { PackageInfo } from './interfaces';

export let rootDir: string | undefined;
export function getRootDir() {
    if (rootDir) return rootDir;
    const rootPkgJSON = pkgUp.sync();
    if (!rootPkgJSON) {
        throw new Error('Unable to find root directory, run in the root of the repo');
    }
    rootDir = path.dirname(rootPkgJSON);
    return rootDir;
}

export function getName(input: string): string {
    return words(input)
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
            // tslint:disable-next-line: no-console
            console.error(`* wrote ${path.relative(getRootDir(), filePath)} file`);
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
            // tslint:disable-next-line: no-console
            console.error(`* wrote ${path.relative(getRootDir(), filePath)} JSON file`);
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

export function cliError<T>(prefix: string, error: string, ...args: any[]): never {
    console.error(`\n${prefix}: ${error}`, ...args);
    return process.exit(1);
}

export function writePkgHeader(prefix: string, pkgInfos: PackageInfo[], prefixNewline?: boolean): void {
    const names = pkgInfos.map(({ name }) => name).join(', ');
    process.stderr.write(`${prefixNewline ? '\n' : ''}* ${prefix} for ${names}\n\n`);
}
