import { createWriteStream } from 'node:fs';
import { mkdir, chmod } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import yauzl, { type Entry, type ZipFile } from 'yauzl';
import { TSError } from './errors.js';

/**
 * Extract a zip file on disk into `destDir`, streaming one entry at a time so
 * peak memory stays at a single entry instead of the whole archive.
 *
 * yauzl handles the scary parts by default: it rejects zip-slip paths (`..`,
 * absolute, drive-letter, backslash) via validateFileName, and verifies each
 * entry's uncompressed size against its header (zip-bomb) while piping. On top
 * of that we create implicit parent dirs, preserve unix permissions so
 * executables stay executable, and refuse symlink entries.
 */
export async function unzip(zipFilePath: string, destDir: string): Promise<void> {
    const zipfile = await yauzl.openPromise(zipFilePath); // forces lazyEntries: true
    await mkdir(destDir, { recursive: true });

    try {
        for await (const entry of zipfile.eachEntry()) {
            await extractEntry(zipfile, entry, destDir);
        }
    } finally {
        zipfile.close();
    }
}

async function extractEntry(zipfile: ZipFile, entry: Entry, destDir: string): Promise<void> {
    const destPath = path.join(destDir, entry.fileName);

    // Directory file names end with '/'.
    if (entry.fileName.endsWith('/')) {
        await mkdir(destPath, { recursive: true });
        return;
    }

    // our zips are built on linux using the zip cli and we run on linux too
    // so file permissions live in the top 16 bits here.
    // ">>> 16" drops the lower half and keeps just the permissions.
    // This bit shift is the same way gos zip library grabs permissions:
    // https://github.com/golang/go/blob/go1.23.4/src/archive/zip/struct.go#L316
    const mode = entry.externalFileAttributes >>> 16;
    if (isSymlink(mode)) {
        throw new TSError(`Refusing to extract symlink entry "${entry.fileName}"`, {
            statusCode: 422
        });
    }

    // An entry's parent directories aren't always listed as their own entries.
    await mkdir(path.dirname(destPath), { recursive: true });

    const readStream = await zipfile.openReadStreamPromise(entry);
    await pipeline(readStream, createWriteStream(destPath));

    // grab just the permission part -- the same read/write/execute number you
    // use in "chmod 755". some zips don't save permissions, which shows up as 0;
    // in that case we leave the file at the default instead of setting nothing.
    const permissions = mode & 0o777;
    if (permissions !== 0) {
        await chmod(destPath, permissions);
    }
}

function isSymlink(mode: number): boolean {
    // part of the mode says what kind of file it is. this pulls out that part
    // and checks if it's the "symlink" value.
    // where these two magic numbers come from (the unix file-type table):
    // https://man7.org/linux/man-pages/man7/inode.7.html
    // S_IFMT bit mask is 0170000
    // S_IFLNK  value is 0120000
    return (mode & 0o170000) === 0o120000;
}
