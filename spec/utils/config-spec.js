'use strict';

const fs = require('fs');
const events = require('events');
const config = require('../../lib/utils/config');

const eventEmitter = new events.EventEmitter();

describe('config', () => {
    const testPath = `${process.cwd()}/testing_for_teraslice`;

    function deleteFolder(path) {
        try {
            fs.readdirSync(path).forEach((file) => {
                const curPath = `${path}/${file}`;
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteFolder(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        } catch (e) {
            if (e.code !== 'ENOENT') {
                console.error(e); // eslint-disable-line no-console
            }
        }
    }

    const jobConfig = JSON.stringify({
        name: 'Data Generator',
        lifecycle: 'once',
        analytics: false,
        operations: [
            {
                _op: 'elasticsearch_data_generator',
                size: 5000,
                file_path: '/Users/Projects/data.js'
            },
            {
                _op: 'elasticsearch_index_selector',
                index: 'bigdata5',
                type: 'events'
            },
            {
                _op: 'elasticsearch_bulk',
                size: 5000
            }
        ]
    });

    // used for get job
    process.env.job = jobConfig;

    afterAll(() => {
        // remove enviroment variable
        delete process.env.job;

        deleteFolder(testPath);
    });

    it('getClient returns client with certain defaults', () => {
        const context = {
            foundation: {
                getConnection(clientConfig) {
                    return {
                        client() {
                            return clientConfig;
                        }
                    };
                },
                getEventEmitter() {
                    return eventEmitter;
                }
            }
        };
        const opConfig1 = {};
        const opConfig2 = {
            connection: 'otherConnection'
        };
        const opConfig3 = {
            connection: 'thirdConnection',
            connection_cache: false
        };

        const type = 'elasticsearch';

        const results1 = config.getClient(context, opConfig1, type);
        const results2 = config.getClient(context, opConfig2, type);
        const results3 = config.getClient(context, opConfig3, type);

        expect(typeof results1).toEqual('function');
        expect(results1()).toEqual({ endpoint: 'default', cached: true, type: 'elasticsearch' });

        expect(typeof results2).toEqual('function');
        expect(results2()).toEqual({ endpoint: 'otherConnection', cached: true, type: 'elasticsearch' });

        expect(typeof results3).toEqual('function');
        expect(results3()).toEqual({ endpoint: 'thirdConnection', cached: false, type: 'elasticsearch' });
    });

    it('getOpConfig will fetch the correct opConfig of a job', () => {
        const name = 'myOP';
        const resultsOP = { _op: name, more: 'data' };
        const job = { operations: [{ _op: 'other' }, { _op: 'second' }, resultsOP, { _op: 'last' }] };
        const results = config.getOpConfig(job, name);

        expect(results._op).toEqual(name);
        expect(JSON.stringify(results)).toEqual(JSON.stringify(resultsOP));
    });
});
