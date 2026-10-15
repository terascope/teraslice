import type { QueryCase } from './interfaces.js';
import { allExcept } from './corpus.js';

/**
 * Ranges, spelled every way a bound can be written.
 *
 * `[` and `]` include the bound, `{` and `}` exclude it, and the two ends are independent, so
 * `[a TO b}`, `{a TO b]` and `[a TO b]` are three different queries. The corpus has two
 * records on each bound used here, so each of the four bracket combinations returns a
 * different set and confusing `gt` with `gte` fails.
 *
 * An unbounded side (`*`) drops one of the two comparisons, and `[* TO *]` drops both,
 * which leaves a query that asks only that the field have a value.
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
    // neither bound is generated, so the query only asks that the field have a value
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
 * The same four spellings over dates, where the bound is a timestamp instead of a number.
 *
 * Elasticsearch parses a date literal itself, while SQL casts it. A `TIMESTAMP` cast drops
 * the zone instead of applying it, so the translator normalizes to UTC first. Every record's
 * date is midnight UTC and the bounds land exactly on them, so an off-by-one shows up.
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
 * A range over a `keyword`, which both engines answer by comparing strings.
 *
 * Nothing in the query says the bounds are not numbers, so the engines must agree on both
 * the comparison and the bound. `alpha`, `beta` and `delta` are adjacent in the corpus, so
 * each bracket spelling changes the answer by exactly one value.
*/
export const keywordRangeCases: readonly QueryCase[] = [
    ['[ TO ], both bounds included', 'name:[alpha TO delta]', ['01', '02', '04', '05', '06', '09', '12']],
    ['{ TO }, neither bound included', 'name:{alpha TO delta}', ['02', '06']],
    ['[ TO }, the upper bound excluded', 'name:[alpha TO delta}', ['01', '02', '04', '06', '09', '12']],
    ['{ TO ], the lower bound excluded', 'name:{alpha TO delta]', ['02', '05', '06']],
];
