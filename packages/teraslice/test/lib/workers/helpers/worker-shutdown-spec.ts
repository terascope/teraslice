import 'jest-extended';
import { jest } from '@jest/globals';
import { msUntilUnixTime } from '@terascope/core-utils';
import {
    getShutdownDeadlines, getPhaseDeadline, POST_SHUTDOWN_BUFFER
} from '../../../../src/lib/workers/helpers/worker-shutdown.js';

describe('worker-shutdown deadlines', () => {
    const startTime = 1_700_000_000_000;

    // assignment and the most it should reserve for its final phase
    const instances = [
        ['worker', 10_000],
        ['execution_controller', 15_000],
    ] as const;

    function getLadder(
        shutdownTimeout: number,
        assignment: typeof instances[number][0]
    ) {
        const { raceDeadline, instanceDeadline } = getShutdownDeadlines(
            startTime, shutdownTimeout
        );
        const phaseDeadline = getPhaseDeadline(
            instanceDeadline, shutdownTimeout, assignment
        );
        return { phaseDeadline, instanceDeadline, raceDeadline };
    }

    describe.each(instances)('for the %s', (assignment, finalPhaseMax) => {
        describe.each([100, 400, 1000, 10_000, 60_000, 300_000, 3_600_000])(
            'with a shutdown_timeout of %d',
            (shutdownTimeout) => {
                it('should order the deadlines', () => {
                    const {
                        phaseDeadline, instanceDeadline, raceDeadline
                    } = getLadder(shutdownTimeout, assignment);

                    expect(phaseDeadline).toBeLessThan(instanceDeadline);
                    expect(instanceDeadline).toBeLessThan(raceDeadline);
                    expect(raceDeadline).toBeLessThan(startTime + shutdownTimeout);
                    expect(startTime + shutdownTimeout).toBeLessThan(
                        startTime + shutdownTimeout + POST_SHUTDOWN_BUFFER
                    );
                });

                it('should reserve at most the final phase max', () => {
                    const { phaseDeadline, instanceDeadline } = getLadder(
                        shutdownTimeout, assignment
                    );

                    expect(instanceDeadline - phaseDeadline).toBeLessThanOrEqual(finalPhaseMax);
                });
            }
        );

        describe('timers armed when shutdown starts', () => {
            beforeEach(() => {
                jest.spyOn(Date, 'now').mockReturnValue(startTime);
            });

            afterEach(() => {
                jest.restoreAllMocks();
            });

            // the floors match the callers: phase timers use 100,
            // store, analytics and race timers use the default 1000
            function getTimers(shutdownTimeout: number) {
                const {
                    phaseDeadline, instanceDeadline, raceDeadline
                } = getLadder(shutdownTimeout, assignment);

                return {
                    phase: msUntilUnixTime(phaseDeadline, 100),
                    instance: msUntilUnixTime(instanceDeadline),
                    race: msUntilUnixTime(raceDeadline),
                };
            }

            it.each([1, 100, 400, 1000, 10_000, 60_000, 300_000, 3_600_000])(
                'should be positive and in order with a shutdown_timeout of %d',
                (shutdownTimeout) => {
                    const { phase, instance, race } = getTimers(shutdownTimeout);

                    expect(phase).toBePositive();
                    expect(instance).toBePositive();
                    expect(race).toBePositive();
                    expect(phase).toBeLessThanOrEqual(instance);
                    expect(instance).toBeLessThanOrEqual(race);
                }
            );

            it.each([5000, 10_000, 30_000, 60_000, 300_000, 3_600_000])(
                'should not hit a floor and be strictly ordered with a shutdown_timeout of %d',
                (shutdownTimeout) => {
                    const {
                        phaseDeadline, instanceDeadline, raceDeadline
                    } = getLadder(shutdownTimeout, assignment);
                    const { phase, instance, race } = getTimers(shutdownTimeout);

                    expect(phase).toBe(phaseDeadline - startTime);
                    expect(instance).toBe(instanceDeadline - startTime);
                    expect(race).toBe(raceDeadline - startTime);
                    expect(phase).toBeLessThan(instance);
                    expect(instance).toBeLessThan(race);
                }
            );
        });
    });
});
