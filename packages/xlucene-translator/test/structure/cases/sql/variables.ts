import { TranslatorOptions } from '../../../../src/translator/interfaces.js';

/**
 * One set of variables for every emission case that uses them.
 *
 * The same values are in `test/sql/duckdb-general-spec.ts`, where they run against real rows -
 * these lock the SQL, that one proves it answers correctly.
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
 * The same variables, with an unresolved one dropped rather than resolved to nothing.
 *
 * `filterNilVariables` removes the node before the translation ever sees it, so the SQL for a
 * missing variable differs from the SQL for one that resolved - which is the distinction these
 * cases exist to pin.
*/
export const nilVariables: TranslatorOptions = { variables, filterNilVariables: true };
