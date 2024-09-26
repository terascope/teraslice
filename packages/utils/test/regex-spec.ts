import 'jest-extended';
import {
    matchAll, match, formatRegex,
    matchWildcard,
} from '../src/regex.js';

describe('Regex Utils', () => {
    describe('formatRegex', () => {
        test.each([
            ['/d.*ta/', ['d.*ta', '']],
            ['/d.*ta/gm', ['d.*ta', 'gm']],
            ['d.*ta', ['d.*ta', '']],
        ])('should format regex %p to %o', (input: RegExp | string, expected: any) => {
            const regex = formatRegex(input);
            expect(regex.source).toEqual(expected[0]);
            expect(regex.flags).toEqual(expected[1]);
        });
    });

    describe('match', () => {
        test.each([
            ['/d.*ta/', 'data', 'data'],
            [/d.*ta/, 'other', null],
            ['/d.*ta/', 'other', null],

            [new RegExp('d.*ta'), 'other', null],
        ])('should match regex %p to %o', (input: RegExp | string, value: string, expected: any) => {
            expect(match(input, value)).toEqual(expected);
        });
    });

    describe('matchAll', () => {
        test.each([
            ['/<(.*?)>/', '<tag1> something <tag2>', ['tag1', 'tag2']],

            [new RegExp('<(.*?)>'), '<tag1> something <tag2>', ['tag1', 'tag2']],
            ['/<(.*?)>/gmi', '<tag1> something <tag2>', ['tag1', 'tag2']],
            [/<(.*?)>/gmi, '<tag1> something <tag2>', ['tag1', 'tag2']],
            ['/.*/', 'something', ['something']],
            [/.*/, 'something', ['something']],
            ['<(\\w+)>.*<(\\d+)>', '<tag1> hello <1234>', ['tag1', '1234']]
        ])('should match all %p to %s', (input: RegExp | string, value: string, expected: any) => {
            expect(matchAll(input, value)).toEqual(expected);
        });
    });

    describe('matchWildcard', () => {
        test.each([
            ['fo?', 'foo', true],
            ['fo?', 'food', false],
            ['fo?', 'fob', true],
            ['fo*', 'foo', true],
            ['fo*', 'food', true],
            ['*\\.__*_value', 'nested.__foo_value', true],
            ['*\\.__*_value', 'nested.__foo_bar', false],
            ['*\\.__*_value', 'nested._foo_value', false],
            ['__*_value', '__foo_bar', false],
            ['__*_value', '___bar', false],
        ])('should handle %p to %s', (input: string, value: string, expected: any) => {
            expect(matchWildcard(input, value)).toEqual(expected);
        });
    });
});
