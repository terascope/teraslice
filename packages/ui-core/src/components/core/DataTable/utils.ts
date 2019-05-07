import PropTypes from 'prop-types';
import { parseList, isString, uniq } from '@terascope/utils';
import { ParsedSort, SortDirection } from './interfaces';

export function parseSortBy(sort: string, defaultSort = 'created:asc'): ParsedSort {
    const parts = (sort || defaultSort).split(':');
    const [field, direction] = parseList(parts) as [string, SortDirection];
    return { field, direction };
}

export function formatSortBy(sort: ParsedSort|string): string {
    if (isString(sort)) return sort;
    if (!sort.field || !sort.direction) return 'created:asc';
    return `${sort.field}:${sort.direction}`;
}

export const queryStateProp = PropTypes.shape({
    query: PropTypes.string,
    size: PropTypes.number,
    sort: PropTypes.string,
    from: PropTypes.number,
});

export const columnMappingProp = PropTypes.objectOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    format: PropTypes.func.isRequired,
}).isRequired);

export const rowMappingProp = PropTypes.shape({
    getId: PropTypes.func.isRequired,
    columns: columnMappingProp.isRequired,
});

export function uniqIntArray(arr: number[]) {
    return uniq(arr).sort((a, b) => a - b);
}
