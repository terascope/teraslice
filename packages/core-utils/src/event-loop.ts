import type { Logger } from '@terascope/types';
import { toHumanTime } from './dates.js';
import { debugLogger } from './logger.js';
import { pImmediate } from './promises.js';

let _eventLoop: EventLoop | undefined;

/**
 * A simple class for detecting when the event loop is blocked.
 * The recommend use is to call `EventLoop.init(logger)` and then
 * `await EventLoop.wait()` where you want to slow down potentially
 * long running synchronous code
*/
export class EventLoop {
    static DEFAULT_HEARTBEAT = 1000;

    /**
     * Adds a setTimeout if the event loop is blocked
     * and will the delay will get slower the longer the event loop
     * is block (with an upper limit)
    */
    static wait(): Promise<void> | void {
        if (!_eventLoop) {
            EventLoop.init(debugLogger('event-loop'));
        }
        if (!_eventLoop?.blocked) return;
        return pImmediate();
    }

    /**
     * Creates or replaces an instead of a global
     * EvenLoop
    */
    static init(logger: Logger): EventLoop {
        if (_eventLoop) {
            // there is no need to create multiple
            // instances if the logger doesn't change
            if (_eventLoop.logger === logger) return _eventLoop;
            _eventLoop.cancel();
        }
        _eventLoop = new EventLoop(logger);
        return _eventLoop;
    }

    checkedInDiff: number;

    private readonly heartbeat = EventLoop.DEFAULT_HEARTBEAT;

    private checkedIn: number;
    private interval: NodeJS.Timeout;

    constructor(readonly logger: Logger) {
        this.checkedIn = Date.now();
        this.checkedInDiff = 0;

        this.interval = setInterval(() => {
            const now = Date.now();
            this.checkedInDiff = now - this.checkedIn;
            this.checkedIn = now;
            if (this.blocked) {
                this.logger?.warn(`* EVENT LOOP IS PROBABLY BLOCKED (${toHumanTime(this.checkedInDiff)} diff) *`);
            }
        }, this.heartbeat);

        // this is only available in the node environment
        if (typeof this.interval.unref === 'function') {
            // don't keep the process open
            this.interval.unref();
        }
    }

    get blocked(): boolean {
        return this.checkedInDiff > (this.heartbeat * 4);
    }

    /**
     * Cancel the event loop checker
    */
    cancel(): void {
        clearInterval(this.interval);
    }
}
