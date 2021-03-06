'use strict';

const got = require('got');
const { Fetcher } = require('@terascope/job-components');

class ExampleFetcher extends Fetcher {
    async fetch(startingData) {
        const statusCode = await this.getStatusCode(startingData.fromUrl);
        const result = [];
        for (let i = 0; i < statusCode; i++) {
            result.push({
                id: i,
                statusCode,
                data: [
                    Math.random(),
                    Math.random(),
                    Math.random(),
                ]
            });
        }
        return result;
    }

    async getStatusCode(url) {
        const response = await got(url, {
            throwHttpErrors: false,
        });
        return response.statusCode;
    }
}

module.exports = ExampleFetcher;
