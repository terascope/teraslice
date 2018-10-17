'use strict';

const request = require('request');
const { Fetcher } = require('@terascope/job-components');

class ExampleFetcher extends Fetcher {
    async fetch(startingData) {
        const statusCode = await this.getStatusCode(startingData.fromUrl);
        return Array.from(statusCode, (_, n) => ({
            id: n,
            statusCode,
            data: [
                Math.random(),
                Math.random(),
                Math.random(),
            ]
        }));
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
