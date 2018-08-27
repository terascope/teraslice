import 'jest-extended';

import {
    MessengerServer,
    MessengerClient,
    MessengerCore,
} from '../src';

describe('MessengerCore', () => {
    describe('when MessengerCore is constructed without a valid actionTimeout', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new MessengerCore({});
            }).toThrowError('Messenger requires a valid actionTimeout');
        });
    });

    describe('when MessengerCore is constructed without a valid networkLatencyBuffer', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new MessengerCore({
                    actionTimeout: 10,
                    networkLatencyBuffer: 'abc'
                });
            }).toThrowError('Messenger requires a valid networkLatencyBuffer');
        });
    });

    describe('when MessengerClient is constructed without a valid hostUrl', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new MessengerClient({
                    actionTimeout: 1,
                    networkLatencyBuffer: 0
                });
            }).toThrowError('MessengerClient requires a valid hostUrl');
        });
    });

    describe('when MessengerClient is constructed without a valid socketOptions', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new MessengerClient({
                    hostUrl: '',
                    actionTimeout: 1,
                    networkLatencyBuffer: 0
                });
            }).toThrowError('MessengerClient requires a valid socketOptions');
        });
    });

    describe('when MessengerServer is constructed without a valid port', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new MessengerServer({
                    actionTimeout: 1,
                    networkLatencyBuffer: 0
                });
            }).toThrowError('MessengerServer requires a valid port');
        });
    });
});
