import 'jest-extended';
import { luceneRegexpToPattern, wildcardToLikePattern } from '../src/index.js';

describe('patterns', () => {
    describe('luceneRegexpToPattern', () => {
        // Lucene has no anchors: the whole value always has to match, so `^` and `$` are text
        it.each([
            ['h.*o', 'h.*o'],
            ['^al.*', '\\^al.*'],
            ['.*pha$', '.*pha\\$'],
            ['a^b$c', 'a\\^b\\$c'],
            // a class keeps its negation, and `^` or `$` inside it are already text
            ['[^b].*', '[^b].*'],
            ['[a-z^$]+', '[a-z^$]+'],
            // `[]` and `[^]` start a class whose first character is `]`
            ['[]a]', '[]a]'],
            ['[^]a]x', '[^]a]x'],
            // a backslash still makes the next character itself
            ['\\^a', '\\^a'],
            ['a\\[^b', 'a\\[\\^b'],
        ])('converts %p to %p', (lucene, pattern) => {
            expect(luceneRegexpToPattern(lucene)).toEqual(pattern);
        });
    });

    describe('wildcardToLikePattern', () => {
        it.each([
            ['Yak*', 'Yak%'],
            ['Y?k', 'Y_k'],
            ['Yak\\*', 'Yak*'],
            ['a_b%c', 'a\\_b\\%c'],
        ])('converts %p to %p', (wildcard, pattern) => {
            expect(wildcardToLikePattern(wildcard)).toEqual(pattern);
        });
    });
});
