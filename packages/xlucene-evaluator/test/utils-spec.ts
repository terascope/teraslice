import 'jest-extended';
import { AST, parseNodeRange } from '../src';

describe('Utils', () => {
    describe('parseNodeRange', () => {
        it('should handle >=30', () => {
            const input: AST = {
                field: 'hello',
                term_max: Infinity,
                term_min: 30,
                inclusive_min: true,
            };

            expect(parseNodeRange(input)).toEqual({
                gte: 30
            });
        });

        it('should handle >50', () => {
            const input: AST = {
                field: 'hello',
                term_max: Infinity,
                term_min: 50,
                inclusive_min: false,
            };

            expect(parseNodeRange(input)).toEqual({
                gt: 50
            });
        });

        it('should handle <=20', () => {
            const input: AST = {
                field: 'hello',
                term_min: -Infinity,
                term_max: 20,
                inclusive_max: true,
            };

            expect(parseNodeRange(input)).toEqual({
                lte: 20
            });
        });

        it('should handle <0', () => {
            const input: AST = {
                field: 'hello',
                term_min: -Infinity,
                term_max: 0,
                inclusive_max: false,
            };

            expect(parseNodeRange(input)).toEqual({
                lt: 0
            });
        });

        it('should handle 10>0', () => {
            const input: AST = {
                field: 'hello',
                term_max: 10,
                term_min: 0,
                inclusive_min: false,
                inclusive_max: false,
            };

            expect(parseNodeRange(input)).toEqual({
                gt: 0,
                lt: 10
            });
        });

        it('should handle 10>=0', () => {
            const input: AST = {
                field: 'hello',
                term_max: 10,
                term_min: 0,
                inclusive_min: false,
                inclusive_max: true,
            };

            expect(parseNodeRange(input)).toEqual({
                gt: 0,
                lte: 10
            });
        });

        it('should handle 9<50', () => {
            const input: AST = {
                field: 'hello',
                term_max: 50,
                term_min: 9,
                inclusive_min: false,
                inclusive_max: false,
            };

            expect(parseNodeRange(input)).toEqual({
                gt: 9,
                lt: 50
            });
        });

        it('should handle 9<=50', () => {
            const input: AST = {
                field: 'hello',
                term_max: 50,
                term_min: 9,
                inclusive_min: false,
                inclusive_max: true,
            };

            expect(parseNodeRange(input)).toEqual({
                gt: 9,
                lte: 50
            });
        });

        it('should handle 9<= hello <=50', () => {
            const input: AST = {
                field: 'hello',
                term_max: 50,
                term_min: 9,
                inclusive_min: true,
                inclusive_max: true,
            };

            expect(parseNodeRange(input)).toEqual({
                gte: 9,
                lte: 50
            });
        });
    });
});
