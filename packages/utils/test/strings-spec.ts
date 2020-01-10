import 'jest-extended';
import {
    toSafeString,
    unescapeString,
    getWordParts,
    escapeString,
    matchAll,
    match,
    formatRegex,
    FormatRegexResult
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

    describe('getWordParts', () => {
        test.each([
            ['hello-there', ['hello', 'there']],
            ['++_--hello', ['hello']],
            ['GraphQL', ['GraphQL']],
            ['Howdy-Hi?+ you', ['Howdy', 'Hi', 'you']],
            ['123', ['123']],
            ['DataTypes', ['Data', 'Types']],
            ['Data_Type', ['Data', 'Type']],
            ['Foo Bar', ['Foo', 'Bar']],
            ['foo_bar', ['foo', 'bar']],
            ['_key', ['_key']],
            ['-key', ['key']],
            ['__example', ['__example']],
            ['SomeASTNode123', ['SomeAST', 'Node123']],
            ['foo _ bar   baz 123', ['foo', 'bar', 'baz', '123']],
        ])('should convert %s to be %s', (input: any, expected: any) => {
            expect(getWordParts(input)).toStrictEqual(expected);
        });
    });

    const escapeTests: (string[])[] = [
        ['hello', 'hello'],
        ['hello.', 'hello.'],
        ['hello\\.', 'hello\\\\.'],
        [' \' " ', ' \\\' \\" '],
        ['something-xy40\\" value \\\' 8008', 'something-xy40\\\\\\" value \\\\\\\' 8008'],
        ['\\\\.', '\\\\\\\\.'],
        ['\\ ', '\\\\ '],
        ['/value\\\\', '/value\\\\\\\\'],
        ['', ''],
    ];

    describe('escapeString', () => {
        test.each(escapeTests)('should convert %j to %j', (input: string, expected: string) => {
            expect(escapeString(input)).toEqual(expected);
        });
    });

    describe('unescapeString', () => {
        test.each(escapeTests)('should convert the original string %j to %j', (expected: string, input: string) => {
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
