'use strict';

const _ = require('lodash');
const request = require('request');
const { Fetcher } = require('@terascope/job-components');

class ExampleFetcher extends Fetcher {
    async fetch(startingData) {
        const statusCode = await this.getStatusCode(startingData.fromUrl);
        const data = _.times(statusCode, n => ({
            id: n,
            statusCode,
            data: [
                _.random(),
                _.random(),
                _.random(),
            ]
        }));
        return this.wrapData(data);
    }

    async getStatusCode(url) {
        return new Promise((resolve, reject) => {
            request.get(url, (err, response) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(response.statusCode);
            });
        });
    }
}

module.exports = ExampleFetcher;
