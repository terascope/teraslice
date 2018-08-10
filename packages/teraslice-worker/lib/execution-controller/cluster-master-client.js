'use strict';

const _ = require('lodash');
const WrapError = require('../utils/wrap-error');
const MessengerClient = require('../messenger/client');

class ClusterMasterClient extends MessengerClient {
    constructor(opts = {}) {
        const {
            clusterMasterUrl,
            socketOptions: _socketOptions,
            executionContext,
            networkLatencyBuffer,
            actionTimeout,
        } = opts;

        if (!_.isString(clusterMasterUrl)) {
            throw new Error('ClusterMasterClient requires a valid clusterMasterUrl');
        }

        if (_.isEmpty(executionContext)) {
            throw new Error('ClusterMasterClient requires a valid executionContext');
        }

        const {
            node_id: nodeId,
        } = executionContext;

        const socketOptions = Object.assign({
            autoConnect: false,
            query: {
                node_id: nodeId,
            }
        }, _socketOptions);

        super({
            hostUrl: clusterMasterUrl,
            socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            to: 'cluster_master',
            source: nodeId
        });

        this.nodeId = nodeId;
    }

    async start() {
        try {
            await this.connect();
        } catch (err) {
            throw new WrapError('Unable to connect to cluster master', err);
        }

        await this.send({
            message: 'node:online',
            node_id: this.nodeId,
            payload: {},
        });

        this.handleResponses(this.socket);
    }

    updateAnalytics(stats) {
        return this.send({
            message: 'cluster:analytics',
            payload: {
                kind: 'slicer',
                stats,
            }
        });
    }

    executionTerminal(exId) {
        return this.send({
            message: 'execution:error:terminal',
            ex_id: exId
        });
    }

    executionFinished(exId) {
        return this.send({
            message: 'execution:finished',
            ex_id: exId
        });
    }
}

module.exports = ClusterMasterClient;
