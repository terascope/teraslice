import PropTypes from 'prop-types';

export type QueryState = {
    from?: number,
    size?: number,
    query?: string,
    sort?: string
};

export const QueryStateProp = PropTypes.shape({
    query: PropTypes.string,
    size: PropTypes.number,
    sort: PropTypes.string,
    from: PropTypes.number,
});

export type SortDirection = 'asc'|'desc';
export type ParsedSort = { field: string, direction: SortDirection };

export type ColumnMapping = {
    [field: string]: {
        label: string;
        format?: (data: any) => any;
    }
};

export type RowMapping = {
    getId: (data: any) => string;
    columns: ColumnMapping;
};

export const ColumnMappingProp = PropTypes.objectOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    format: PropTypes.func,
}).isRequired);

export const RowMappingProp = PropTypes.shape({
    getId: PropTypes.func.isRequired,
    columns: ColumnMappingProp.isRequired,
});
