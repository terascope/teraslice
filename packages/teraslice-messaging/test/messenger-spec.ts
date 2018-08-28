import 'jest-extended';

import { Messenger } from '../src';

describe('Messenger', () => {
    describe('->Core', () => {
        describe('when constructed without a valid actionTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Core({});
                }).toThrowError('Messenger requires a valid actionTimeout');
            });
        });

        describe('when constructed without a valid networkLatencyBuffer', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Core({
                        actionTimeout: 10,
                        networkLatencyBuffer: 'abc'
                    });
                }).toThrowError('Messenger requires a valid networkLatencyBuffer');
            });
        });
    })

    describe('->Client', () => {
        describe('when constructed without a valid hostUrl', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0
                    });
                }).toThrowError('Messenger.Client requires a valid hostUrl');
            });
        });

        describe('when constructed without a valid socketOptions', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Client({
                        hostUrl: '',
                        actionTimeout: 1,
                        networkLatencyBuffer: 0
                    });
                }).toThrowError('Messenger.Client requires a valid socketOptions');
            });
        });
    })

    describe('->Server', () => {
        describe('when constructed without a valid port', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0
                    });
                }).toThrowError('Messenger.Server requires a valid port');
            });
        });
    })
});
