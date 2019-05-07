import React from 'react';
import PropTypes from 'prop-types';
import { Table, Checkbox } from 'semantic-ui-react';
import { ColumnMapping, ColumnMappingProp, SortDirection, UpdateQueryState } from './interfaces';
import { parseSortBy, getSortDirection, formatSortBy } from './utils';

const Header: React.FC<Props> = (props) => {
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
                            sorted={getSortDirection(field, sortBy)}
                            onClick={() => {
                                const current = parseSortBy(sort);
                                let direction: SortDirection = 'asc';
                                if (current.field === field && current.direction === 'asc') {
                                    direction = 'desc';
                                }
                                updateQueryState({ sort: formatSortBy({ field, direction }) });
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
    columnMapping: ColumnMapping,
};

Header.propTypes = {
    numSelected: PropTypes.number.isRequired,
    updateQueryState: PropTypes.func.isRequired,
    toggleSelectAll: PropTypes.func.isRequired,
    sort: PropTypes.string.isRequired,
    selectedAll: PropTypes.bool.isRequired,
    columnMapping: ColumnMappingProp.isRequired,
};

export default Header;
