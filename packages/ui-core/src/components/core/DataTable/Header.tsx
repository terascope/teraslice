import React from 'react';
import PropTypes from 'prop-types';
import { Table, Checkbox } from 'semantic-ui-react';
import { ColumnMapping, ColumnMappingProp, SortDirection, UpdateQueryState } from './interfaces';
import { parseSortBy, getSortDirection, formatSortBy } from './utils';

const Header: React.FC<Props> = (props) => {
    const {
        handleSelectAll,
        sort,
        numSelected,
        rowCount,
        columnMapping,
        updateQueryState,
    } = props;

    const sortBy = parseSortBy(sort);

    return (
        <Table.Header fullWidth>
            <Table.Row>
                <Table.HeaderCell width={1} textAlign="center">
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={numSelected === rowCount}
                        onChange={(event: any) => {
                            handleSelectAll(event.target.checked);
                        }}
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
    handleSelectAll: (checked: boolean) => void;
    sort: string;
    rowCount: number;
    columnMapping: ColumnMapping,
};

Header.propTypes = {
    numSelected: PropTypes.number.isRequired,
    updateQueryState: PropTypes.func.isRequired,
    handleSelectAll: PropTypes.func.isRequired,
    sort: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
    columnMapping: ColumnMappingProp.isRequired,
};

export default Header;
