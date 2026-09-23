import type { QueryCase } from './interfaces.js';
import { allExcept } from './corpus.js';

/**
 * Ranges, spelled every way a bound can be written.
 *
 * **The four bracket combinations are the whole point.** `[` and `]` include the bound, `{`
 * and `}` exclude it, and the two ends are independent - `[a TO b}` and `{a TO b]` are
 * different queries and neither is `[a TO b]`. The corpus puts two records on each of the
 * bounds used here, so every one of the four answers a different set and a translation that
 * confused `gt` with `gte` cannot pass by accident.
 *
 * An unbounded side (`*`) is included for the same reason: it is the case where one of the
 * two comparisons should not be emitted at all, and `[* TO *]` is the case where neither
 * should - which leaves a range that asks only that the field have a value.
*/
export const numericRangeCases: readonly QueryCase[] = [
    ['[ TO ], both bounds included', 'count:[20 TO 40]', ['02', '03', '04', '07', '09', '10']],
    ['{ TO }, neither bound included', 'count:{20 TO 40}', ['03', '09']],
    ['[ TO }, the upper bound excluded', 'count:[20 TO 40}', ['02', '03', '07', '09']],
    ['{ TO ], the lower bound excluded', 'count:{20 TO 40]', ['03', '04', '09', '10']],
    ['>', 'count:>30', ['04', '05', '10', '12']],
    ['>=', 'count:>=30', ['03', '04', '05', '09', '10', '12']],
    ['<', 'count:<30', ['01', '02', '06', '07']],
    ['<=', 'count:<=30', ['01', '02', '03', '06', '07', '09']],
    ['an included lower bound and no upper', 'count:[30 TO *]', ['03', '04', '05', '09', '10', '12']],
    ['an excluded lower bound and no upper', 'count:{30 TO *}', ['04', '05', '10', '12']],
    ['no lower bound and an included upper', 'count:[* TO 30]', ['01', '02', '03', '06', '07', '09']],
    ['no lower bound and an excluded upper', 'count:[* TO 30}', ['01', '02', '06', '07']],
    // neither bound is emitted, so what is left is the field having a value at all
    ['neither bound, which asks only that the field exist', 'count:[* TO *]', allExcept('08', '11')],
    ['a range inside a field group', 'count:(>=20 AND <40)', ['02', '03', '07', '09']],
    [
        'a negated range, which keeps the records with no value',
        'NOT count:[20 TO 40]',
        ['01', '05', '06', '08', '11', '12']
    ],
    ['a range AND a term', 'count:[20 TO 40] AND active:false', ['02', '04', '07', '10']],
    [
        'two open-ended ranges OR-ed',
        'count:{* TO 20} OR count:{40 TO *}',
        ['01', '05', '06', '12']
    ],
];

/**
 * The same four spellings over dates, where the bound is a timestamp rather than a number.
 *
 * A date bound takes a second path to the engine: Elasticsearch parses the literal itself,
 * while SQL casts it - and a `TIMESTAMP` cast DROPS a zone rather than applying it, so the
 * translation normalises to UTC first. A bound landing exactly on a record's value is what
 * makes an off-by-one visible, and every record's date here is midnight UTC.
*/
export const dateRangeCases: readonly QueryCase[] = [
    [
        '[ TO ], both bounds included',
        'created:["2021-01-01" TO "2022-06-15"]',
        ['03', '04', '05', '06']
    ],
    [
        '{ TO }, neither bound included',
        'created:{"2021-01-01" TO "2022-06-15"}',
        ['04', '05']
    ],
    [
        '[ TO }, the upper bound excluded',
        'created:["2021-01-01" TO "2022-06-15"}',
        ['03', '04', '05']
    ],
    [
        '{ TO ], the lower bound excluded',
        'created:{"2021-01-01" TO "2022-06-15"]',
        ['04', '05', '06']
    ],
    ['>= a date', 'created:>="2023-01-01"', ['07', '08', '09']],
    ['< a date', 'created:<"2020-06-15"', ['01', '12']],
    ['a date with a time and a zone', 'created:>="2023-01-01T00:00:00.000Z"', ['07', '08', '09']],
    ['neither bound', 'created:[* TO *]', allExcept('10', '11')],
    [
        'a negated date range',
        'NOT created:["2021-01-01" TO "2022-06-15"]',
        allExcept('03', '04', '05', '06')
    ],
    [
        'a date range AND a term',
        'created:["2020-01-01" TO "2021-01-01"] AND active:true',
        ['01', '03', '12']
    ],
];

/**
 * A range over a `keyword`, which both engines answer by comparing the strings.
 *
 * Worth pinning because nothing about the query says it is not a number: the bounds are
 * bare words, and the two engines have to agree on both the comparison and where the bound
 * sits. `alpha`, `beta`, `delta` are adjacent in the corpus, so each bracket spelling moves
 * the answer by exactly one value.
*/
export const keywordRangeCases: readonly QueryCase[] = [
    ['[ TO ], both bounds included', 'name:[alpha TO delta]', ['01', '02', '04', '05', '06', '09', '12']],
    ['{ TO }, neither bound included', 'name:{alpha TO delta}', ['02', '06']],
    ['[ TO }, the upper bound excluded', 'name:[alpha TO delta}', ['01', '02', '04', '06', '09', '12']],
    ['{ TO ], the lower bound excluded', 'name:{alpha TO delta]', ['02', '05', '06']],
];
