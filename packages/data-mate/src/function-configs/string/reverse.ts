import { getTypeOf, isString } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces.js';
import { sqlLiteral, NEEDS_GRAPHEME_REVERSE } from '../sql-helpers.js';

/**
 * Strings containing a surrogate pair, a combining mark, or a zero-width joiner cannot
 * be reversed one UTF-16 code unit at a time:
 *
 *   - reversing code units splits surrogate pairs into lone surrogates, so an emoji
 *     becomes invalid text that will not round-trip through JSON or a database
 *   - reversing code points keeps the pairs intact but detaches combining marks
 *     ('éabc' -> 'cbáe', the accent moves onto the 'a') and reorders ZWJ sequences
 *     and regional-indicator flags
 *
 * Only grapheme segmentation is correct, but it is roughly 11x slower than the simple
 * loop, so it is used only for the strings that actually need it. The locale is pinned
 * so segmentation cannot vary by host.
 *
 * @note the astral range must be written as code points, not as the surrogate range.
 * Under the `u` flag this pattern matches code points, so a well-formed surrogate pair
 * is one code point and `[\uD800-\uDFFF]` would only ever match a LONE surrogate -
 * meaning no emoji would take the segmentation path at all.
 */
const NEEDS_SEGMENTATION = /[\u{10000}-\u{10FFFF}\u{200D}]|\p{M}/u;

let segmenter: Intl.Segmenter | undefined;

function _reverse(input: unknown): string | null {
    if (!isString(input)) {
        throw new Error(`Invalid input ${JSON.stringify(input)}, expected string got ${getTypeOf(input)}`);
    }

    if (input.length === 0) return null;

    if (NEEDS_SEGMENTATION.test(input)) {
        segmenter ??= new Intl.Segmenter('en', { granularity: 'grapheme' });

        const graphemes: string[] = [];
        for (const { segment } of segmenter.segment(input)) {
            graphemes.push(segment);
        }

        return graphemes.reverse().join('');
    }

    let results = '';

    for (let i = input.length - 1; i >= 0; i--) {
        results += input[i];
    }

    return results;
}

const examples: FunctionDefinitionExample<Record<string, unknown>>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'hello',
        output: 'olleh'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'more words',
        output: 'sdrow erom',
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String, array: true } } },
        field: 'testField',
        input: ['hello', 'more'],
        output: ['olleh', 'erom']
    },
];

export const reverseConfig: FieldTransformConfig = {
    name: 'reverse',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input string with its characters in reverse order.',
    examples,
    create() {
        return _reverse;
    },
    /**
     * `reverse()` for the strings that do not need grapheme segmentation, the UDF for the ones that
     * do - and NULL for the empty string, which is what `_reverse` returns.
     *
     * The guard is the same set as `NEEDS_SEGMENTATION` above, as an RE2 class: an astral code point,
     * a zero-width joiner or a combining mark. Verified that RE2 supports `\p{M}` and `\x{...}` and
     * matches the same strings the JavaScript regex does. So the 11x-slower segmentation path runs
     * only where it is needed, exactly as it does in JavaScript - and everything else, which is
     * essentially all real data, never leaves SQL.
    */
    sql: {
        needs_udf_fallback: true,
        expression: ({ value, udf }) => `CASE WHEN ${value} = '' THEN NULL`
            + ` WHEN regexp_matches(${value}, ${sqlLiteral(NEEDS_GRAPHEME_REVERSE)})`
            + ` THEN ${udf(value)} ELSE reverse(${value}) END`,
    },
    accepts: [FieldType.String],
};
