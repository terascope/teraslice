import { TranslatorOptions } from '../../../../src/index.js';

/**
 * One set of variables for every SQL case that uses them.
 *
 * `test/sql/duckdb-general-spec.ts` uses the same values against real rows. These cases pin
 * the SQL text; that spec checks the results.
*/
export const variables = {
    str: 'hello',
    arr: ['hello', 'fizz'],
    empty: [] as string[],
    n: 50,
    nums: [50, 60],
    flag: true,
    when: '2020-01-01',
    low: 20,
    high: 70,
    addr: '192.168.1.1',
};

export const withVariables: TranslatorOptions = { variables };

/**
 * The same variables, for cases where an unresolved one is dropped instead of resolved to an
 * empty value.
 *
 * `filterNilVariables` removes the node before translation, so a missing variable produces
 * different SQL than one that resolved. These cases pin that difference.
*/
export const nilVariables: TranslatorOptions = { variables, filterNilVariables: true };
