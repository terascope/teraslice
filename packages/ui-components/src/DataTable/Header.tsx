import React from 'react';
import PropTypes from 'prop-types';
import { Table, Checkbox } from 'semantic-ui-react';
import {
    ColumnMappings,
    ColumnMappingsProp,
    SortDirection,
    UpdateQueryState,
} from './interfaces';
import {
    parseSortBy,
    getSortDirection,
    formatSortBy,
    isSortable,
} from './utils';

const Header: React.FC<Props> = props => {
    const {
        toggleSelectAll,
        sort,
        selectedAll,
        columnMapping,
        updateQueryState,
    } = props;

    const sortBy = parseSortBy(sort);

    return (
        <Table.Header fullWidth>
            <Table.Row>
                <Table.HeaderCell width={1} textAlign="center">
                    <Checkbox
                        checked={selectedAll}
                        onChange={toggleSelectAll}
                    />
                </Table.HeaderCell>
                {Object.entries(columnMapping).map(([field, col]) => (
                    <Table.HeaderCell
                        key={field}
                        sorted={
                            isSortable(col)
                                ? getSortDirection(field, sortBy)
                                : undefined
                        }
                        onClick={(e: any) => {
                            e.preventDefault();
                            if (!isSortable(col)) return;

                            const current = parseSortBy(sort);
                            let direction: SortDirection = 'asc';
                            if (
                                current.field === field &&
                                current.direction === 'asc'
                            ) {
                                direction = 'desc';
                            }
                            updateQueryState({
                                sort: formatSortBy({ field, direction }),
                            });
                        }}
                    >
                        {col.label}
                    </Table.HeaderCell>
                ))}
            </Table.Row>
        </Table.Header>
    );
};

type Props = {
    numSelected: number;
    updateQueryState: UpdateQueryState;
    toggleSelectAll: () => void;
    sort: string;
    selectedAll: boolean;
    columnMapping: ColumnMappings;
};

Header.propTypes = {
    numSelected: PropTypes.number.isRequired,
    updateQueryState: PropTypes.func.isRequired,
    toggleSelectAll: PropTypes.func.isRequired,
    sort: PropTypes.string.isRequired,
    selectedAll: PropTypes.bool.isRequired,
    columnMapping: ColumnMappingsProp.isRequired,
};

export default Header;
