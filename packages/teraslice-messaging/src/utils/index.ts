import os from 'os';
import _ from 'lodash';
import url from 'url';
import nanoid from 'nanoid/generate';

export function newMsgId(lowerCase: boolean = false, length: number = 15): string {
    let characters = '-0123456789abcdefghijklmnopqrstuvwxyz';
    if (!lowerCase) {
        characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    const id = _.trim(nanoid(characters, length), '-');
    return _.padEnd(id, length, 'abcdefghijklmnopqrstuvwxyz');
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
