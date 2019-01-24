import crypto from 'crypto';
import { promisify } from 'util';
import { cloneDeep, isPlainObject, uniq } from '@terascope/utils';

const randomBytesAsync = promisify(crypto.randomBytes);
const pbkdf2Async = promisify(crypto.pbkdf2);

export function addDefaults(source: object, from: object = {}) {
    const output = cloneDeep(source);
    const _mapping = cloneDeep(from);

    for (const [key, val] of Object.entries(_mapping)) {
        if (output[key] != null) {
            if (isPlainObject(val)) {
                output[key] = Object.assign(output[key], val);
            } else if (Array.isArray(val)) {
                output[key] = uniq(output[key].concat(val));
            } else {
                output[key] = val;
            }
        }
    }

    return output;
}

export async function generateAPIToken(hash: string, username: string) {
    const shasum = crypto.createHash('sha1');
    const buf = await randomBytesAsync(128);

    const str = `${buf}${Date.now()}${hash}${username}`;

    return shasum.update(str).digest('hex');
}

export async function generateSalt() {
    const buf = await randomBytesAsync(32);
    return buf.toString('hex');
}

export async function generatePasswordHash(password: string, salt: string) {
    const buf = await pbkdf2Async(password, salt, 25000, 512, 'sha1');
    return buf.toString('hex');
}
