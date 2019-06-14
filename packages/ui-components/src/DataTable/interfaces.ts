import PropTypes from 'prop-types';
import { AnyObject } from '@terascope/utils';
import { ResolvedUser } from '../interfaces';

export type QueryState = {
    from?: number;
    size?: number;
    query?: string;
    sort?: string;
};

export type UpdateQueryState = (query: QueryState) => void;

export const QueryStateProp = PropTypes.shape({
    query: PropTypes.string,
    size: PropTypes.number,
    sort: PropTypes.string,
    from: PropTypes.number,
});

export type SortDirection = 'asc' | 'desc';
export type ParsedSort = { field: string; direction: SortDirection };

export type ColumnMapping<T = AnyObject> = {
    /** the field label */
    label: string;
    /** return a formatted value or react node*/
    format?: (record: T) => any;
    /** @default true */
    sortable?: boolean;
};

export type ColumnMappings<T = AnyObject> = { [field in keyof Partial<T>]: ColumnMapping<T> };

export type RowMapping<T = AnyObject> = {
    getId: (record: T) => string;
    canExport?: (record: T, authUser?: ResolvedUser) => boolean;
    columns: ColumnMappings<T>;
};

export const ColumnMappingProp = PropTypes.shape({
    label: PropTypes.string.isRequired,
    format: PropTypes.func,
    sortable: PropTypes.bool,
});

export const ColumnMappingsProp = PropTypes.objectOf(ColumnMappingProp.isRequired);

export const RowMappingProp = PropTypes.shape({
    getId: PropTypes.func.isRequired,
    canExport: PropTypes.func,
    columns: ColumnMappingsProp.isRequired,
});

export type ActionState = {
    loading?: boolean;
    message?: string;
    success?: boolean;
    error?: boolean;
};

export type SelectState = {
    selected: string[];
    selectedAll: boolean;
};
