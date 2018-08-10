'use strict';

const events = require('events');
const fs = require('fs-extra');
const path = require('path');
const opCode = require('../../lib/cluster/runners/op');

const eventEmitter = new events.EventEmitter();

describe('op runner', () => {
    const logger = {
        error() {},
        info() {},
        warn() {},
        trace() {},
        debug() {}
    };
    const testRegisterApi = {};

    const context = {
        sysconfig: {
            teraslice: {
                ops_directory: null
            }
        },
        apis: {
            foundation: {
                makeLogger: () => logger,
                getSystemEvents: () => eventEmitter,
                getConnection: settings => ({ client: settings })
            },
            registerAPI: (key, obj) => {
                testRegisterApi[key] = obj;
            }
        },
        logger
    };

    const assetId = '1234';
    const testDir = `${__dirname}/op_test`;
    const assetPath = `${testDir}/${assetId}`;
    const processorPath = path.join(__dirname, '../../lib/processors/noop.js');

    beforeAll(() => fs.ensureDir(testDir).then(() => fs.copy(processorPath, `${assetPath}/noop.js`)));

    afterAll(() => fs.remove(testDir));

    it('can instantiate', () => {
        let opRunner;

        expect(() => {
            opRunner = opCode(context);
        }).not.toThrowError();

        expect(typeof opRunner).toEqual('object');
        expect(opRunner.load).toBeDefined();
        expect(typeof opRunner.load).toEqual('function');

        expect(typeof testRegisterApi).toEqual('object');
        expect(testRegisterApi.op_runner).toBeDefined();
        expect(typeof testRegisterApi.op_runner).toEqual('object');
        expect(testRegisterApi.op_runner.getClient).toBeDefined();
        expect(typeof testRegisterApi.op_runner.getClient).toEqual('function');
    });

    it('can load an operation', () => {
        const opRunner = opCode(context);
        const results = opRunner.load('noop');

        expect(results).toBeDefined();
        expect(typeof results).toEqual('object');
        expect(results.newProcessor).toBeDefined();
        expect(results.schema).toBeDefined();
        expect(typeof results.newProcessor).toEqual('function');
        expect(typeof results.schema).toEqual('function');

        const opSchema = results.schema();
        expect(opSchema).toBeDefined();
        expect(typeof opSchema).toEqual('object');

        const processor = results.newProcessor();

        expect(processor).toBeDefined();
        expect(typeof processor).toEqual('function');

        const someData = 'someData';
        const processorResults = processor(someData);
        expect(processorResults).toEqual(someData);
    });

    it('can throw proper errors if op code does not exits', () => {
        const opRunner = opCode(context);
        opRunner.load('noop');

        expect(() => {
            opRunner.load('someOp');
        }).toThrowError();
    });

    it('can load asset ops', () => {
        const opRunner = opCode(context);
        let results;

        expect(() => {
            results = opRunner.load('noop', testDir, [assetId]);
        }).not.toThrowError();

        expect(results).toBeDefined();
        expect(typeof results).toEqual('object');
        expect(results.newProcessor).toBeDefined();
        expect(results.schema).toBeDefined();
        expect(typeof results.newProcessor).toEqual('function');
        expect(typeof results.schema).toEqual('function');

        const opSchema = results.schema();
        expect(opSchema).toBeDefined();
        expect(typeof opSchema).toEqual('object');

        const processor = results.newProcessor();

        expect(processor).toBeDefined();
        expect(typeof processor).toEqual('function');

        const someData = 'someData';
        const processorResults = processor(someData);
        expect(processorResults).toEqual(someData);
    });

    it('getClient will return a client', () => {
        opCode(context);
        const { getClient } = testRegisterApi.op_runner;

        expect(getClient({}, 'elasticsearch')).toEqual({ type: 'elasticsearch', endpoint: 'default', cached: true });
        expect(getClient({ connection: 'someConnection' }, 'kafka')).toEqual({ type: 'kafka', endpoint: 'someConnection', cached: true });
        expect(getClient({ connection_cache: false }, 'mongo')).toEqual({ type: 'mongo', endpoint: 'default', cached: true });
    });

    it('getClient will error properly', (done) => {
        const makeError = () => {
            throw new Error('a client error');
        };
        context.apis.foundation.getConnection = makeError;
        opCode(context);
        const { getClient } = testRegisterApi.op_runner;
        const errStr = 'No configuration for endpoint default was found in the terafoundation connectors';
        eventEmitter.on('client:initialization:error', (errMsg) => {
            expect(errMsg.error.includes(errStr)).toEqual(true);
            done();
        });
        getClient();
    });
});
