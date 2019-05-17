import PropTypes from 'prop-types';

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

export type ColumnMapping = {
    [field: string]: {
        label: string;
        format?: (record: any) => any;
    };
};

export type RowMapping = {
    getId: (record: any) => string;
    canRemove?: (record: any) => boolean;
    columns: ColumnMapping;
};

export const ColumnMappingProp = PropTypes.objectOf(
    PropTypes.shape({
        label: PropTypes.string.isRequired,
        format: PropTypes.func,
    }).isRequired
);

export const RowMappingProp = PropTypes.shape({
    getId: PropTypes.func.isRequired,
    canRemove: PropTypes.func,
    columns: ColumnMappingProp.isRequired,
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
