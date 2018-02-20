'use strict';

const messagingModule = require('../../lib/cluster/services/messaging');
const events = require('events');

const eventEmitter = new events.EventEmitter();

fdescribe('messaging module', () => {
    const logger = {
        error() {},
        info() {},
        warn() {},
        trace() {},
        debug() {},
        flush() {}
    };

    const testExId = '7890';

    class MyEmitter extends events {
        constructor() {
            super();
        }
    }
    let firstWorkerMsg = null;
    let secondWorkerMsg = null;
    let thirdWorkerMsg = null;

    beforeEach(() => {
        firstWorkerMsg = null;
        secondWorkerMsg = null;
        thirdWorkerMsg = null;
    });

    class MyCluster extends events {
        constructor() {
            super();
            this.workers = {
                first: {
                    ex_id: testExId,
                    assignment: 'execution_controller',
                    send: msg => firstWorkerMsg = msg
                },
                second: {
                    ex_id: testExId,
                    assignment: 'worker',
                    send: msg => secondWorkerMsg = msg
                },
                third: {
                    ex_id: 'somethingElse',
                    assignment: 'worker',
                    send: msg => thirdWorkerMsg = msg
                }
            };
        }
    }

    let emitMsg = null;
    let socketMsg = null;

    const io = {
        emit: (msg, msgObj) => emitMsg = { message: msg, data: msgObj },
        sockets: {
            in: address => ({
                emit: (msg, msgObj) => socketMsg = { message: msg, data: msgObj, address }
            })
        },
        eio: {
            clientsCount: 2
        }
    };

    const context = {
        sysconfig: {
            teraslice: {
                master_hostname: '127.0.0.1',
                port: 47898
            }
        },
        apis: {
            foundation: {
                getSystemEvents: () => eventEmitter
            }
        },
        cluster: new MyCluster()
    };
    const childHookFn = () => {};


    function getContext(obj) {
        const config = Object.assign(new MyEmitter(), obj);
        return Object.assign({}, context, { __testingModule: config });
    }

    it('can make a hostname', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        const messaging = messagingModule(testContext, logger);
        const makeHostName = messaging.__test_context()._makeHostName;
        const getHostUrl = messaging.getHostUrl;

        expect(makeHostName('127.0.0.1', 5647)).toEqual('http://127.0.0.1:5647');
        expect(makeHostName('127.0.0.1:', 5647)).toEqual('http://127.0.0.1:5647');

        expect(makeHostName('http://127.0.0.1', 5647)).toEqual('http://127.0.0.1:5647');
        expect(makeHostName('https://127.0.0.1', 5647)).toEqual('https://127.0.0.1:5647');

        expect(makeHostName('127.0.0.1', 5647, 'v1')).toEqual('http://127.0.0.1:5647/v1');
        expect(getHostUrl()).toEqual('http://127.0.0.1:47898');
    });

    it('can detect itself and make configurations', () => {
        function getConfig(type) {
            const config = context.sysconfig.teraslice;
            const job = JSON.stringify({
                slicer_hostname: config.master_hostname,
                slicer_port: config.port
            });
            const testContext = getContext({ env: { assignment: type, job } });
            const testModule = messagingModule(testContext, logger, childHookFn).__test_context();
            return testModule._makeConfigurations();
        }

        expect(getConfig('node_master')).toEqual({
            clients: { networkClient: true, ipcClient: false },
            hostURL: 'http://127.0.0.1:47898',
            assignment: 'node_master'
        });
        expect(getConfig('cluster_master')).toEqual({
            clients: { networkClient: false, ipcClient: true },
            assignment: 'cluster_master'
        });

        expect(getConfig('execution_controller')).toEqual({
            clients: { networkClient: false, ipcClient: true },
            assignment: 'execution_controller'
        });

        expect(getConfig('worker')).toEqual({
            clients: { networkClient: true, ipcClient: true },
            hostURL: 'http://127.0.0.1:47898',
            assignment: 'worker'
        });

        expect(getConfig('assets_loader')).toEqual({
            clients: { networkClient: false, ipcClient: true },
            assignment: 'assets_loader'
        });

        expect(getConfig('assets_service')).toEqual({
            clients: { networkClient: true, ipcClient: true },
            hostURL: 'http://127.0.0.1:47898',
            assignment: 'assets_service'
        });
    });

    it('can be called without errors', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });

        expect(() => messagingModule(testContext, logger, childHookFn)).not.toThrow();
    });

    it('has a router', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        const messaging = messagingModule(testContext, logger, childHookFn);
        const routing = messaging.__test_context().routing;

        const routingData = {
            cluster_master: { execution_controller: 'network', node_master: 'network', assets_loader: 'ipc' },
            node_master: { cluster_process: 'ipc', cluster_master: 'network', execution_controller: 'ipc', worker: 'ipc', assets_loader: 'ipc', execution: 'ipc' },
            execution_controller: { worker: 'network', cluster_master: 'ipc', node_master: 'ipc' },
            worker: { execution_controller: 'network', cluster_master: 'ipc', node_master: 'ipc' },
            assets_loader: { execution: 'ipc', cluster_master: 'ipc' },
            assets_service: { cluster_master: 'ipc' }
        };

        expect(routing).toEqual(routingData);
    });

    it('can determie path for message', () => {
        const testContext1 = getContext({ env: { assignment: 'node_master' } });
        const messaging1 = messagingModule(testContext1, logger, childHookFn);
        const routerNodeMaster = messaging1.__test_context()._determinePathForMessage;

        const testContext2 = getContext({ env: { assignment: 'cluster_master' } });
        const messaging2 = messagingModule(testContext2, logger, childHookFn);
        const routerClusterMaster = messaging2.__test_context()._determinePathForMessage;

        const testContext3 = getContext({ env: { assignment: 'execution_controller' } });
        const messaging3 = messagingModule(testContext3, logger, childHookFn);
        const routerExecutionController = messaging3.__test_context()._determinePathForMessage;

        const testContext4 = getContext({ env: { assignment: 'assets_service' } });
        const messaging4 = messagingModule(testContext4, logger, childHookFn);
        const routerAssetsService = messaging4.__test_context()._determinePathForMessage;

        const failureMessage1 = { to: 'theUnknown' };
        const failureMessage2 = { to: 'worker' };

        expect(routerNodeMaster({ to: 'cluster_process' })).toEqual('ipc');
        expect(routerNodeMaster({ to: 'cluster_master' })).toEqual('network');
        expect(routerNodeMaster({ to: 'execution' })).toEqual('ipc');
        expect(routerNodeMaster({ to: 'execution_controller' })).toEqual('ipc');
        expect(routerNodeMaster({ to: 'worker' })).toEqual('ipc');

        expect(() => routerNodeMaster(failureMessage1)).toThrow();

        expect(routerExecutionController({ to: 'cluster_master' })).toEqual('ipc');
        expect(routerExecutionController({ to: 'worker' })).toEqual('network');

        expect(routerClusterMaster({ to: 'execution_controller' })).toEqual('network');
        expect(routerClusterMaster({ to: 'node_master' })).toEqual('network');
        expect(routerClusterMaster({ to: 'assets_loader' })).toEqual('ipc');
        // this tests a shutdown message back to the cluster master process itself
        expect(routerClusterMaster({ to: 'node_master', message: 'shutdown' })).toEqual('ipc');
        // this is directed to specific node_master with no cluster_master
        expect(routerClusterMaster({ to: 'node_master', message: 'shutdown', address: 'someAddress' })).toEqual('network');

        expect(routerAssetsService({ to: 'cluster_master' })).toEqual('ipc');
        expect(() => routerAssetsService(failureMessage2)).toThrow();
    });

    it('can send process messages', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        const messaging = messagingModule(testContext, logger);
        const sendToProcesses = messaging.__test_context()._sendToProcesses;
        const firstMsg = { to: 'execution_controller', ex_id: testExId, message: 'execution:stop' };
        const secondMsg = { to: 'worker', ex_id: testExId, message: 'execution:stop' };
        const thirdMsg = { to: 'worker', message: 'worker:shutdown' };
        const executionMsg = { to: 'execution', meta: 'someData', ex_id: testExId, message: 'worker:shutdown' };

        expect(firstWorkerMsg).toEqual(null);
        expect(secondWorkerMsg).toEqual(null);
        expect(thirdWorkerMsg).toEqual(null);

        sendToProcesses(firstMsg);

        expect(firstWorkerMsg).toEqual(firstMsg);
        expect(secondWorkerMsg).toEqual(null);
        expect(thirdWorkerMsg).toEqual(null);

        sendToProcesses(secondMsg);

        expect(firstWorkerMsg).toEqual(firstMsg);
        expect(secondWorkerMsg).toEqual(secondMsg);
        expect(thirdWorkerMsg).toEqual(null);

        sendToProcesses(thirdMsg);

        expect(firstWorkerMsg).toEqual(firstMsg);
        expect(secondWorkerMsg).toEqual(thirdMsg);
        expect(thirdWorkerMsg).toEqual(thirdMsg);

        sendToProcesses(executionMsg);

        expect(firstWorkerMsg).toEqual(executionMsg);
        expect(secondWorkerMsg).toEqual(executionMsg);
        expect(thirdWorkerMsg).toEqual(thirdMsg);
    });

    fit('can forward messages', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        const messaging = messagingModule(testContext, logger);
        const forwardMessage = messaging.__test_context(io)._forwardMessage;
        const workerMsg = { to: 'worker', ex_id: testExId, message: 'execution:stop' };

        forwardMessage({ to: 'cluster_master', message: 'someEvent' });
        // should be a network emit msg
        expect(emitMsg).toEqual({
            message: 'someEvent',
            data: {
                to: 'cluster_master',
                message: 'someEvent'
            }
        });
        forwardMessage(workerMsg);
        // should be a process msg
        expect(secondWorkerMsg).toEqual(workerMsg);

        const testContext2 = getContext({ env: { assignment: 'cluster_master' } });
        const messaging2 = messagingModule(testContext2, logger);
        const clusterMasterForwarding = messaging2.__test_context(io)._forwardMessage;

        clusterMasterForwarding()

        const testContext3 = getContext({ env: { assignment: 'execution_controller' } });
        const messaging3 = messagingModule(testContext3, logger);
        const executionControllerForwarding = messaging3.__test_context(io)._forwardMessage;

        // le;t emitMsg = null;
        // let socketMsg = null;
        console.log(emitMsg);
    });

    xit('can work with messaging:response messages', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        const messaging = messagingModule(testContext, logger, childHookFn);
    });
});
