import type { QueryCase } from './interfaces.js';
import { allExcept } from './corpus.js';

/**
 * Conjunctions, disjunctions and the groups they nest in.
 *
 * Every spelling the parser accepts for the same operator is here - `AND`/`&&`, `OR`/`||`,
 * and a bare space, **which is an OR and not an AND** - because the translation reads the
 * node the parser produced and nothing downstream would notice if two spellings stopped
 * producing the same node.
 *
 * The groupings go three deep. A flat `a AND b` cannot tell a correct emitter from one that
 * drops parentheses, since `AND` and `OR` alone parenthesise the same either way; a group
 * inside a group beside a bare term does.
*/
export const multiStatementCases: readonly QueryCase[] = [
    ['two terms joined by AND', 'name:alpha AND active:true', ['01', '12']],
    ['two terms joined by OR', 'name:alpha OR name:beta', ['01', '02', '04', '06', '09', '12']],
    ['&&, which is AND', 'name:alpha && active:true', ['01', '12']],
    ['||, which is OR', 'name:gamma || name:delta', ['03', '05']],
    // a space between two terms is a DISJUNCTION in xLucene, not the conjunction Lucene's
    // default operator would make it
    ['a bare space, which is OR', 'name:gamma name:delta', ['03', '05']],
    ['three terms AND-ed', 'name:alpha AND active:true AND count:50', ['12']],
    ['three terms OR-ed', 'name:gamma OR name:delta OR name:zeta', ['03', '05', '10']],
    ['a term AND a group', 'name:alpha AND (count:10 OR count:50)', ['01', '12']],
    [
        'a group AND a group',
        '(name:alpha OR name:beta) AND (active:false OR count:10)',
        ['01', '02', '04', '06']
    ],
    ['a group OR a term', '(name:alpha AND active:true) OR name:gamma', ['01', '03', '12']],
    [
        'a group inside a group, beside a term',
        '((name:alpha OR name:beta) AND active:true) OR count:50',
        ['01', '05', '06', '12']
    ],
    [
        'an OR nested inside an AND nested inside an OR',
        '(name:alpha OR (name:beta AND count:10)) AND active:true',
        ['01', '06', '12']
    ],
    ['two terms that cannot both hold', 'name:alpha AND name:beta', []],
    ['an AND over two different fields', 'count:20 AND active:false', ['02', '07']],
    ['a field group, which is an OR over one field', 'name:(alpha OR beta)', ['01', '02', '04', '06', '09', '12']],
    ['a field group AND-ing its own values', 'count:(>=20 AND <40)', ['02', '03', '07', '09']],
    ['a field group beside another term', 'name:(alpha OR beta) AND active:true', ['01', '06', '12']],
];

/**
 * Negation, which is the one place SQL answers differently unless it is made not to.
 *
 * **Every case here returns at least one record that has no value for the negated field**,
 * and that is deliberate: `must_not` matches a document whose field is absent, while
 * `NOT (col = 'x')` is unknown when `col` is `NULL` and a `WHERE` clause drops an unknown
 * row. `11` has no fields at all and belongs in the answer to almost all of these; an
 * emitter that lost the `COALESCE` would return every one of them short.
*/
export const negationCases: readonly QueryCase[] = [
    ['a negated term', 'NOT name:alpha', allExcept('01', '04', '09', '12')],
    ['the ! spelling of the same thing', '!name:alpha', allExcept('01', '04', '09', '12')],
    ['a negated wildcard', 'NOT name:be*', allExcept('02', '06')],
    ['a negated regular expression', 'NOT name:/al.*/', allExcept('01', '04', '09', '12')],
    ['a negated exists', 'NOT _exists_:name', ['07', '11']],
    ['a negated disjunction', 'NOT (name:alpha OR name:beta)', ['03', '05', '07', '08', '10', '11']],
    ['a negated conjunction', 'NOT (name:alpha AND active:true)', allExcept('01', '12')],
    ['a negation inside a conjunction', 'active:true AND NOT name:alpha', ['03', '05', '06', '08']],
    ['a negation inside a disjunction', 'name:gamma OR NOT active:true', ['02', '03', '04', '07', '09', '10', '11']],
    [
        'two negations AND-ed',
        'NOT name:alpha AND NOT name:beta',
        ['03', '05', '07', '08', '10', '11']
    ],
    ['two negations OR-ed', 'NOT name:alpha OR NOT active:true', allExcept('01', '12')],
    [
        'two negations over different fields',
        'NOT count:20 AND NOT count:30',
        ['01', '04', '05', '06', '08', '10', '11', '12']
    ],
    [
        'a negated group inside a conjunction',
        'active:true AND NOT (name:alpha OR count:10)',
        ['03', '05', '08']
    ],
    ['a negation inside a field group', 'name:(alpha AND NOT beta)', ['01', '04', '09', '12']],
    [
        'an exists AND a negation',
        '_exists_:name AND NOT active:true',
        ['02', '04', '09', '10']
    ],
    [
        'a negation beside an exists, inside a group, OR a term',
        '(_exists_:count AND NOT count:10) OR name:zeta',
        ['02', '03', '04', '05', '07', '09', '10', '12']
    ],
    [
        'a negated group AND a negated term',
        'NOT (name:alpha OR name:beta) AND NOT active:false',
        ['03', '05', '08', '11']
    ],
];
