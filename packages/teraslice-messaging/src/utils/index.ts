import os from 'node:os';
import url from 'node:url';
import { nanoid } from 'nanoid';

export function newMsgId(): Promise<string> {
    return new Promise((resolve) => {
        const id = nanoid(10);
        resolve(id);
    });
}

export function formatURL(hostname: string, port: number): string {
    let formatOptions;
    try {
        const parsed = new url.URL(hostname ?? os.hostname());
        formatOptions = Object.assign(parsed, {
            port,
        });
    } catch (err) {
        formatOptions = {
            protocol: 'http:',
            slashes: true,
            hostname: hostname ?? os.hostname(),
            port,
        };
    }

    return url.format(formatOptions);
}
