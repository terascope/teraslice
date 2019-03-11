import crypto from 'crypto';
import { promisify } from 'util';

const randomBytesAsync = promisify(crypto.randomBytes);
const pbkdf2Async = promisify(crypto.pbkdf2);

/**
 * Generate a API Token
*/
export async function generateAPIToken(hash: string, username: string) {
    const shasum = crypto.createHash('sha1');
    const buf = await randomBytesAsync(128);

    const str = `${buf}${Date.now()}${hash}${username}`;

    return shasum.update(str).digest('hex');
}

/**
 * Generate a random salt
*/
export async function generateSalt() {
    const buf = await randomBytesAsync(32);
    return buf.toString('hex');
}

/**
 * Generate a secure password hash
*/
export async function generatePasswordHash(password: string, salt: string) {
    const buf = await pbkdf2Async(password, salt, 25000, 512, 'sha1');
    return buf.toString('hex');
}
