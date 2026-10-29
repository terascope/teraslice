import 'jest-extended';
import {
    mkdtemp, mkdir, writeFile, readFile, stat, rm, symlink, chmod
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import { unzip } from '../src/unzip.js';

describe('unzip', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await mkdtemp(path.join(os.tmpdir(), 'unzip-spec-'));
    });

    afterEach(async () => {
        await rm(tmpDir, { recursive: true, force: true });
    });

    /** Zip the contents of a source dir into `<tmpDir>/<name>` via the system
     *  zip CLI (the same tool teraslice-cli uses to build asset bundles). */
    async function zipDir(srcDir: string, name: string): Promise<string> {
        const zipPath = path.join(tmpDir, name);
        await execa('zip', ['-qr', '--symlinks', zipPath, '.'], { cwd: srcDir });
        return zipPath;
    }

    it('extracts files, creates nested dirs, and preserves unix permissions', async () => {
        const src = path.join(tmpDir, 'src');
        await mkdir(path.join(src, 'nested'), { recursive: true });
        await writeFile(path.join(src, 'file.txt'), 'hello');
        await writeFile(path.join(src, 'run.sh'), '#!/bin/sh\necho hi\n');
        await chmod(path.join(src, 'run.sh'), 0o755);
        await writeFile(path.join(src, 'nested', 'deep.txt'), 'deep');

        const zipPath = await zipDir(src, 'good.zip');
        const out = path.join(tmpDir, 'out');
        await unzip(zipPath, out);

        expect(await readFile(path.join(out, 'file.txt'), 'utf8')).toBe('hello');
        expect(await readFile(path.join(out, 'nested', 'deep.txt'), 'utf8')).toBe('deep');
        expect((await stat(path.join(out, 'run.sh'))).mode & 0o777).toBe(0o755);
    });

    it('rejects symlink entries', async () => {
        const src = path.join(tmpDir, 'src');
        await mkdir(src, { recursive: true });
        await writeFile(path.join(src, 'ok.txt'), 'ok');
        await symlink('ok.txt', path.join(src, 'link.txt'));

        const zipPath = await zipDir(src, 'sym.zip');

        await expect(unzip(zipPath, path.join(tmpDir, 'out')))
            .rejects.toThrow('Refusing to extract symlink entry');
    });

    it('rejects entries that escape the target directory (zip-slip)', async () => {
        const src = path.join(tmpDir, 'src');
        await mkdir(path.join(src, 'zz'), { recursive: true });
        await writeFile(path.join(src, 'zz', 'escaped.txt'), 'pwned');

        // The zip CLI won't emit a `../` entry, so rewrite the stored name to a
        // same-length traversal path. Equal length keeps every header offset and
        // the CRC valid; only the entry name changes.
        const zipPath = await zipDir(src, 'slip.zip');
        const rewritten = (await readFile(zipPath))
            .toString('latin1')
            .replaceAll('zz/escaped.txt', '../escaped.txt');
        await writeFile(zipPath, Buffer.from(rewritten, 'latin1'));

        await expect(unzip(zipPath, path.join(tmpDir, 'out'))).rejects.toThrow();
    });
});
