import 'jest-extended';
import { toSafeString, unescapeString, escapeString } from '../src';

describe('String Utils', () => {
    describe('toSafeString', () => {
        test.each([
            ['hello-there', 'hello-there'],
            ['++_--hello', 'hello'],
            ['Hello_Hi THERE', 'hello_hi_there'],
            ['Howdy-Hi?+ you', 'howdy-hi-you'],
            ['Hi there#*', 'hi-there'],
            ['<HI> 3', 'hi-3'],
            ['123', '123'],
            [123, '123'],
            [null, ''],
            // @ts-ignore
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(toSafeString(input)).toEqual(expected);
        });
    });

    describe('escapeString', () => {
        test.each([
            ['hello', 'hello'],
            ['hello\\.', 'hello\\.'],
            ['hello.', 'hello\\.'],
            [' . ? ', '\\ \\.\\ \\?\\ '],
            ['\\\\.', '\\\\.'],
            ['\\ ', '\\ '],
            ['', ''],
        ])('should convert %j to %j', (input: string, expected: string) => {
            expect(escapeString(input, ['.', '?', ' '])).toEqual(expected);
        });
    });

    describe('unescapeString', () => {
        test.each([
            ['hello', 'hello'],
            ['hello\\.', 'hello.'],
            ['hello.', 'hello.'],
            [' . ? ', ' . ? '],
            ['\\\\.', '\\.'],
            ['\\ ', ' '],
            ['', ''],
        ])('should convert %j to %j', (input: string, expected: string) => {
            expect(unescapeString(input)).toEqual(expected);
        });
    });
});
