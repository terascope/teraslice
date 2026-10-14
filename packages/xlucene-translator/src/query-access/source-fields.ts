import { xLuceneTypeConfig } from '@terascope/types';

/**
 * Elasticsearch `_source` filtering rules, applied to a type config.
 *
 * Elasticsearch applies `_source_includes` and `_source_excludes` on the server. In SQL the
 * projection is the only way to leave a field out, so these helpers resolve the two lists
 * into the set of fields that may be selected.
*/

/**
 * Whether a restriction entry covers a field path.
 *
 * The match is by dotted segment, not string prefix: `nested` covers `nested.name`, but
 * `nest` does not. `matchTypeField` uses the same rule, so a field is readable exactly when
 * it is queryable.
*/
export function restrictionCovers(restriction: string, path: string): boolean {
    return restriction === path || path.startsWith(`${restriction}.`);
}

/**
 * The field paths a projection can name.
 *
 * A path is projectable when nothing is declared beneath it: a leaf, or an object whose
 * shape the type config does not describe. The parent `nested` of a declared `nested.name`
 * is not projectable; it is rebuilt from its readable children.
*/
export function getProjectablePaths(typeConfig: xLuceneTypeConfig): string[] {
    const paths = Object.keys(typeConfig);

    return paths.filter(
        (path) => !paths.some((other) => other !== path && other.startsWith(`${path}.`))
    );
}

/**
 * The paths that may be returned, given the `_source` include and exclude lists.
 *
 * As in Elasticsearch, a field is readable when an include covers it (or there are no
 * includes) and no exclude covers it.
 *
 * An exclude list containing `'*'` means nothing may be returned. `restrictSourceFields`
 * returns it when a caller asks only for fields they may not read.
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
