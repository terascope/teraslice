import 'jest-extended';
import {
    matchAll,
    match,
    formatRegex,
} from '../src/regex';

describe('Regex Utils', () => {
    describe('formatRegex', () => {
        test.each([
            ['/d.*ta/', ['d.*ta', '']],
            ['/d.*ta/gm', ['d.*ta', 'gm']],
            ['d.*ta', ['d.*ta', '']],
        ])('should format regex %p to %o', (input: RegExp|string, expected: any) => {
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
        ])('should match regex %p to %o', (input: RegExp|string, value: string, expected: any) => {
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
        ])('should match all %p to %s', (input: RegExp|string, value: string, expected: any) => {
            expect(matchAll(input, value)).toEqual(expected);
        });
    });
});
