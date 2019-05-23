import { parseList, isString, uniq } from '@terascope/utils';
import { ParsedSort, SortDirection, RowMapping } from './interfaces';
import { ResolvedUser } from '../interfaces';

export function parseSortBy(sort: string, defaultSort = 'created:asc'): ParsedSort {
    const parts = (sort || defaultSort).split(':');
    const [field, direction] = parseList(parts) as [string, SortDirection];
    return { field, direction };
}

export function formatSortBy(sort: ParsedSort | string): string {
    if (isString(sort)) return sort;
    if (!sort.field || !sort.direction) return 'created:asc';
    return `${sort.field}:${sort.direction}`;
}

export function uniqIntArray(arr: number[]) {
    return uniq(arr).sort((a, b) => a - b);
}

export function getSortDirection(field: string, sortBy: ParsedSort): 'ascending' | 'descending' {
    const none: any = null;
    if (sortBy.field !== field) return none;
    if (sortBy.direction === 'asc') return 'ascending';
    if (sortBy.direction === 'desc') return 'descending';
    return none;
}

export function formatRegexQuery(query: string, searchFields: string[]) {
    const fields = searchFields.map(field => `${field}.text`);
    const fieldList = fields.map(val => `${val}:/.*${query}.*/`);
    return fieldList.join(' OR ');
}

export function canSelectFn(rowMapping: RowMapping, authUser?: ResolvedUser) {
    return (record: any): boolean => (rowMapping.canRemove ? rowMapping.canRemove(record, authUser) : true);
}
