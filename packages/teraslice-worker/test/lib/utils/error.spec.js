'use strict';


const WrapError = require('../../../lib/utils/wrap-error');

describe('WrapError', () => {
    describe('when constructed just an string', () => {
        it('should throw an Error', () => {
            expect(() => {
                throw new WrapError('Hello there');
            }).toThrowError('Hello there');
        });

        it('toString() should return a parsed error message', () => {
            const error = new WrapError('Hello there');
            expect(error.toString()).toStartWith('Error: Hello there');
        });
    });

    describe('when constructed nothing', () => {
        it('should throw an Error', () => {
            expect(() => {
                throw new WrapError();
            }).toThrowError('Unknown Exception');
        });

        it('toString() should return a parsed error message', () => {
            const error = new WrapError();
            expect(error.toString()).toStartWith('Error: Unknown Exception');
        });
    });

    describe('when constructed with an string and an error', () => {
        it('should throw an Error', () => {
            expect(() => {
                throw new WrapError('Some reason', new Error('Bad news bears'));
            }).toThrowError('Some reason, Error: Bad news bears');
        });

        it('toString() should return a parsed error message', () => {
            const error = new WrapError('Some reason', new Error('Bad news bears'));
            expect(error.toString()).toStartWith('Error: Some reason, caused by Error: Bad news bears');
        });
    });

    describe('when constructed with just an error', () => {
        it('should throw an Error', () => {
            expect(() => {
                throw new WrapError(new Error('Bad news bears'));
            }).toThrowError('Error: Bad news bears');
        });

        it('toString() should return a parsed error message', () => {
            const error = new WrapError(new Error('Bad news bears'));
            expect(error.toString()).toStartWith('Error: Bad news bears');
        });
    });
});
