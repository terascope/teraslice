import os from 'os';
import url from 'url';
import nanoid from 'nanoid/async';

export function newMsgId(): Promise<string> {
    return nanoid(10);
}

export function formatURL(hostname = os.hostname(), port: number): string {
    let formatOptions;
    try {
        const parsed = new url.URL(hostname);
        formatOptions = Object.assign(parsed, {
            port,
        });
    } catch (err) {
        formatOptions = {
            protocol: 'http:',
            slashes: true,
            hostname,
            port,
        };
    }

    return url.format(formatOptions);
}
