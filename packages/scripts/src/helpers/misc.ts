import fse from 'fs-extra';
import path from 'path';
import pkgUp from 'pkg-up';
import { words, isEqual, isPlainObject } from 'lodash';

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
        let _contents = contents;
        // ensure it ends with a new line
        if (!_contents.endsWith('\n\n')) {
            _contents = `${_contents}\n\n`;
        }
        if (exists) {
            const existing = await fse.readFile(filePath, 'utf8');
            if (isEqual(existing, _contents)) {
                return false;
            }
        }
        if (options.log !== false) {
            // tslint:disable-next-line: no-console
            console.log(`* wrote ${path.relative(getRootDir(), filePath)} file`);
        }
        await fse.writeFile(filePath, _contents, 'utf8');
        return true;
    }
    if (isPlainObject(contents) || Array.isArray(contents)) {
        if (exists) {
            const existing = await fse.readJSON(filePath);
            if (isEqual(existing, contents)) {
                return false;
            }
        }

        if (options.log !== false) {
            // tslint:disable-next-line: no-console
            console.log(`* wrote ${path.relative(getRootDir(), filePath)} JSON file`);
        }
        await fse.writeJSON(filePath, contents, {
            spaces: 4,
        });
        return true;
    }

    throw new Error('Invalid contents given to writeIfChanged');
}
