import events from 'node:events';
import { jest } from '@jest/globals';
import { pDelay } from '@terascope/core-utils';
import { ExecutionAnalytics } from '../../../src/lib/workers/execution-controller/execution-analytics.js';

describe('ExecutionAnalytics', () => {
    const logger = {
        error() {},
        info() {},
        warn: jest.fn(),
        trace() {},
        debug() {}
    };

    const context = {
        apis: {
            foundation: {
                makeLogger: () => logger,
                getSystemEvents: () => new events.EventEmitter()
            }
        },
        sysconfig: {
            teraslice: {
                analytics_rate: 60000
            }
        }
    } as any;

    const executionContext = {
        config: { name: 'test' },
        exId: '1234',
        jobId: '5678'
    } as any;

    const recorded = { payload: { recorded: true } };

    let client: {
        ready: boolean;
        onExecutionAnalytics: jest.Mock;
        sendClusterAnalytics: jest.Mock<(...args: any[]) => Promise<any>>;
    };
    let analytics: ExecutionAnalytics;

    beforeEach(() => {
        logger.warn.mockClear();
        client = {
            ready: true,
            onExecutionAnalytics: jest.fn(),
            sendClusterAnalytics: jest.fn(),
        };
        analytics = new ExecutionAnalytics(context, executionContext, client as any);
    });

    it('should wait for the reply to the final push before resolving', async () => {
        let reply!: (msg: any) => void;
        client.sendClusterAnalytics.mockReturnValue(new Promise((resolve) => {
            reply = resolve;
        }));

        analytics.increment('processed');

        let done = false;
        const shutdown = analytics.shutdown(1000).then(() => {
            done = true;
        });

        await pDelay(10);
        expect(done).toBeFalse();

        reply(recorded);
        await shutdown;

        expect(client.sendClusterAnalytics).toHaveBeenCalledWith(
            expect.objectContaining({ processed: 1 }), 1000, true
        );
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should warn when the final push gets no reply', async () => {
        // a volatile message resolves null when it times out
        client.sendClusterAnalytics.mockResolvedValue(null);

        await analytics.shutdown(1000);

        expect(logger.warn).toHaveBeenCalledWith(
            'cluster master did not record the final cluster analytics before shutdown'
        );
    });

    it('should not wait for a reply when the cluster master is not connected', async () => {
        client.ready = false;
        client.sendClusterAnalytics.mockResolvedValue(null);

        await analytics.shutdown(1000);

        expect(client.sendClusterAnalytics).toHaveBeenCalledWith(
            expect.any(Object), 1000, false
        );
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should only send what a previous push waiting on its reply has not sent', async () => {
        let reply!: (msg: any) => void;
        client.sendClusterAnalytics.mockReturnValueOnce(new Promise((resolve) => {
            reply = resolve;
        }));
        client.sendClusterAnalytics.mockResolvedValueOnce(recorded);

        analytics.increment('processed');
        analytics.increment('processed');

        // @ts-expect-error
        const push = analytics._pushAnalytics();

        analytics.increment('processed');

        await analytics.shutdown(1000);
        reply(recorded);
        await push;

        expect(client.sendClusterAnalytics).toHaveBeenNthCalledWith(
            1, expect.objectContaining({ processed: 2 }), 30000
        );
        expect(client.sendClusterAnalytics).toHaveBeenNthCalledWith(
            2, expect.objectContaining({ processed: 1 }), 1000, true
        );
    });
});
