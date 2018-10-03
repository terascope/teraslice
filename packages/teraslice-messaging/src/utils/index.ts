import os from 'os';
import _ from 'lodash';
import url from 'url';
import nanoid from 'nanoid';

export function newMsgId(): string {
    return nanoid(10);
}

export function formatURL(hostname = os.hostname(), port: number): string {
    let formatOptions;
    try {
        const parsed = new url.URL(hostname);
        formatOptions = _.assign(parsed, {
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
