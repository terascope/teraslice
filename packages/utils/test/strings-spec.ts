import 'jest-extended';
// @ts-ignore
import {
    toSafeString, unescapeString, escapeString, matchAll, match, formatRegex, FormatRegexResult
} from '../src';

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

    describe('formatRegex', () => {
        test.each([
            ['/d.*ta/', ['d.*ta', undefined]],
            ['/d.*ta/gm', ['d.*ta', 'gm']],
            ['d.*ta', ['d.*ta', undefined]],
            // @ts-ignore
        ])('should format regex %s to %o', (regex: string, expected: FormatRegexResult) => {
            expect(formatRegex(regex)).toEqual(expected);
        });
    });

    describe('match', () => {
        test.each([
            ['/d.*ta/', 'data', 'data'],
            ['/d.*ta/', 'other', null],
            // @ts-ignore
        ])('should format regex %s to %o', (regex: string, value: string, expected: FormatRegexResult) => {
            expect(match(regex, value)).toEqual(expected);
        });
    });

    describe('matchAll', () => {
        test.each([
            ['/<(.*?)>/', '<tag1> something <tag2>', ['tag1', 'tag2']],
            ['/<(.*?)>/gmi', '<tag1> something <tag2>', ['tag1', 'tag2']],
            ['/.*/', 'something', ['something']],
            ['<(\\w+)>.*<(\\d+)>', '<tag1> hello <1234>', ['tag1', '1234']]
            // @ts-ignore
        ])('should match %s to %s', (regex: string, input: string, expected: any) => {
            expect(matchAll(regex, input)).toEqual(expected);
        });
    });
});
