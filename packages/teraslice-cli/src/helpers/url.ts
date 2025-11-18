import { startsWith, TSError } from '@terascope/core-utils';

export default class Url {
    private defaultPort = 5678;

    check(inUrl: string): boolean {
        // check that url starts with http:// but allow for https://
        return (startsWith(inUrl, 'http://') || startsWith(inUrl, 'https://'));
    }

    build(inUrl: string): string {
        let outUrl = '';
        if (inUrl === '') {
            throw new TSError('Empty url', { statusCode: 400 });
        }
        if (inUrl.includes(':')) {
            outUrl = this.check(inUrl) ? inUrl : `http://${inUrl}`;
        } else {
            outUrl = this.check(inUrl) ? `${inUrl}:${this.defaultPort}` : `http://${inUrl}:${this.defaultPort}`;
        }

        return outUrl;
    }
}
