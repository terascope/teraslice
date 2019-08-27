
import { startsWith, TSError } from '@terascope/utils';

export default class Url {
    private defaultPort = 5678;

    check(inUrl:string) {
        // check that url starts with http:// but allow for https://
        return (startsWith(inUrl, 'http://' || 'https://') || startsWith(inUrl, 'https://'));
    }

    build(inUrl:string) {
        let outUrl = '';
        if (inUrl === '') {
            throw new TSError('empty url', { statusCode: 400 });
        }
        if (inUrl.includes(':')) {
            outUrl = this.check(inUrl) ? inUrl : `http://${inUrl}`;
        } else {
            outUrl = this.check(inUrl) ? `${inUrl}:${this.defaultPort}` : `http://${inUrl}:${this.defaultPort}`;
        }

        return outUrl;
    }
}
