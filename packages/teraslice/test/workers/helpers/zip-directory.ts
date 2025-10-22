import path from 'node:path';
import { random } from '@terascope/core-utils';
// @ts-expect-error
import BufferStreams from 'bufferstreams';
import archiver from 'archiver';
import { newId } from '../../../src/lib/utils/id_utils.js';

export function zipDirectory(dir: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.append(JSON.stringify({
            name: path.basename(dir),
            version: `${random(0, 100)}.${random(0, 100)}.${random(0, 100)}`,
            someProp: newId()
        }, null, 4), { name: 'asset.json' });
        archive.pipe(new BufferStreams((err: Error, buf: Buffer) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(buf);
        }));
        archive.directory(dir, 'asset').finalize();
    });
}
