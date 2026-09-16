import { xLuceneTypeConfig } from '@terascope/types';

/**
 * Elasticsearch `_source` filtering semantics, applied to a type config.
 *
 * `restrictSearchQuery` hands `_source_includes` and `_source_excludes` to Elasticsearch and
 * the SERVER decides which fields come back. SQL has no such thing - the projection is the
 * only place a field can be withheld - so the same two lists have to be resolved into the
 * set of fields that may be selected.
*/

/**
 * Whether a restriction entry covers a field path.
 *
 * The match is by dotted SEGMENT, not by string prefix: `nested` covers `nested.name`, and
 * `nest` covers neither. This is the rule `matchTypeField` applies when the same lists
 * restrict the type config, so a field is readable exactly when it is also queryable.
*/
export function restrictionCovers(restriction: string, path: string): boolean {
    return restriction === path || path.startsWith(`${restriction}.`);
}

/**
 * The field paths a projection can name.
 *
 * A path is projectable when nothing else is declared beneath it - so a leaf, or an object
 * whose shape the type config does not describe. The intermediate `nested` of a declared
 * `nested.name` is not one: it is rebuilt from whichever of its children survive.
*/
export function getProjectablePaths(typeConfig: xLuceneTypeConfig): string[] {
    const paths = Object.keys(typeConfig);

    return paths.filter(
        (path) => !paths.some((other) => other !== path && other.startsWith(`${path}.`))
    );
}

/**
 * The paths that may be returned, given the two lists Elasticsearch would have been sent.
 *
 * Elasticsearch applies includes first and excludes second, and an empty includes list means
 * everything - so a field is readable when some include covers it (or there are none) and no
 * exclude does.
 *
 * **`['*']` is an exclude entry, not a field name.** `restrictSourceFields` returns it when a
 * caller asks only for fields they may not have, and it means nothing may be returned; a
 * consumer treating these lists as plain names would match it against nothing and expose
 * every column, which is why resolving them here rather than at the call site is the point
 * of this module.
*/
export function getReadableFields(
    typeConfig: xLuceneTypeConfig,
    includes: readonly string[] = [],
    excludes: readonly string[] = []
): string[] {
    if (excludes.includes('*')) return [];

    return getProjectablePaths(typeConfig).filter((path) => {
        const included = !includes.length
            || includes.some((include) => restrictionCovers(include, path));
        if (!included) return false;

        return !excludes.some((exclude) => restrictionCovers(exclude, path));
    });
}
