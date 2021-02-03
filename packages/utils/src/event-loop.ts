import { debugLogger } from './logger';
import { Logger } from './logger-interface';
import { pDelay } from './promises';

let _eventLoop: EventLoop|undefined;

/**
 * A simple class for detecting when the event loop is blocked.
 * The recommend use is to call `EventLoop.init(logger)` and then
 * `await EventLoop.wait()` where you want to slow down potentially
 * long running synchronous code
*/
export class EventLoop {
    /**
     * Adds a setTimeout if the event loop is blocked
     * and will the delay will get slower the longer the event loop
     * is block (with an upper limit)
    */
    static wait(): Promise<void>|void {
        if (!_eventLoop) {
            EventLoop.init(debugLogger('event-loop'));
        }
        if (!_eventLoop?.blocked) return;

        const delay = Math.max(_eventLoop.checkedInDiff - _eventLoop.heartbeat, 500);
        if (delay <= 0) {
            if (typeof process?.nextTick === 'function') {
                return new Promise((resolve) => {
                    process.nextTick(resolve);
                });
            }

            return pDelay();
        }

        return pDelay(delay);
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

    private readonly heartbeat = 500;

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
                this.logger.debug(`* EVENT LOOP IS PROBABLY BLOCKED (${this.checkedInDiff}ms diff) *`);
            }
        }, this.heartbeat);

        // don't keep the process open
        this.interval.unref();
    }

    get blocked(): boolean {
        return this.checkedInDiff > (this.heartbeat * 2);
    }

    /**
     * Cancel the event loop checker
    */
    cancel(): void {
        clearInterval(this.interval);
    }
}
