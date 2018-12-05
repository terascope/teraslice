'use strict';

const _ = require('lodash');

class Url {
    constructor() {
        this.defaultPort = 5678;
    }

    check(inUrl) {
        // check that url starts with http:// but allow for https://
        return (_.startsWith(inUrl, 'http://' || 'https://') || _.startsWith(inUrl, 'https://'));
    }

    build(inUrl) {
        let outUrl = '';
        if (inUrl === '') {
            throw new Error('empty url');
        }
        if (_.includes(inUrl, ':')) {
            outUrl = this.check(inUrl) ? inUrl : `http://${inUrl}`;
        } else {
            outUrl = this.check(inUrl) ? `${inUrl}:${this.defaultPort}` : `http://${inUrl}:${this.defaultPort}`;
        }

        return outUrl;
    }
}

module.exports = Url;
