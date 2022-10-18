import path from 'path';
import random from 'lodash/random';
import BufferStreams from 'bufferstreams';
import archiver from 'archiver';
import { newId } from '../../../lib/utils/id_utils.js';

export default function zipDirectory(dir) {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.append(JSON.stringify({
            name: path.basename(dir),
            version: `${random(0, 100)}.${random(0, 100)}.${random(0, 100)}`,
            someProp: newId()
        }, null, 4), { name: 'asset.json' });
        archive.pipe(new BufferStreams((err, buf) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(buf);
        }));
        archive.directory(dir, 'asset').finalize();
    });
}
