import 'jest-extended';
import { FieldType } from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
    Column, dataFrameAdapter
} from '../../../src/index.js';

const reverseConfig = functionConfigRepository.reverse;

/**
 * The simple cases live in the config's own `examples`, which
 * `function-configs-spec` runs for every function. These are the unicode cases,
 * which need escapes and a lone-surrogate check rather than plain literals.
 *
 * Reversing UTF-16 code units splits surrogate pairs into lone surrogates.
 * Reversing code POINTS fixes that but is still wrong: it detaches combining
 * marks and reorders ZWJ sequences and regional-indicator flags. Only grapheme
 * segmentation is correct, so the cases below deliberately cover all three.
 *
 * Every value here is written as an escape. Typed literally, an editor can
 * normalise a decomposed sequence into its precomposed form, which silently
 * turns the combining-mark case into a test of nothing.
 */
describe('reverse', () => {
    const LONE_SURROGATE
        = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

    function reverseValues(values: string[]): unknown[] {
        const column = Column.fromJSON<string>(
            's',
            { type: FieldType.Keyword },
            values,
        );
        return dataFrameAdapter(reverseConfig, { field: 's' })
            .column(column)
            .toJSON();
    }

    it('has proper configuration', () => {
        expect(reverseConfig).toBeDefined();
        expect(reverseConfig).toHaveProperty('name', 'reverse');
        expect(reverseConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(reverseConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(reverseConfig).toHaveProperty('accepts', [FieldType.String]);
    });

    it('should keep surrogate pairs intact', () => {
        expect(reverseValues(['abc', '\u{1F600}x', 'a\u{1F600}b'])).toEqual([
            'cba',
            'x\u{1F600}',
            'b\u{1F600}a',
        ]);
    });

    it('should keep a combining mark attached to its base character', () => {
        // 'e' + U+0301 COMBINING ACUTE. The length assertion pins the decomposed
        // form, so the test fails loudly if the escape is ever replaced by a
        // precomposed literal.
        const decomposed = 'e\u0301abc';
        expect(decomposed).toHaveLength(5);

        expect(reverseValues([decomposed])).toEqual(['cbae\u0301']);
    });

    it('should not reorder ZWJ sequences or regional-indicator flags', () => {
        // A ZWJ family and a two-codepoint flag are each ONE grapheme.
        const family = '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}';
        const flag = '\u{1F1FA}\u{1F1F8}ab';

        expect(reverseValues([family, flag])).toEqual([family, 'ba\u{1F1FA}\u{1F1F8}']);
    });

    it('should never produce a lone surrogate', () => {
        const results = reverseValues([
            '\u{1F600}x',
            'a\u{1F600}b',
            '\u{1F468}x',
            '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}',
            '\u{1F1FA}\u{1F1F8}ab',
        ]);
        const corrupted = results.filter(
            (value) => typeof value === 'string' && LONE_SURROGATE.test(value),
        );

        expect(corrupted).toEqual([]);
    });
});
