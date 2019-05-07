import React from 'react';
import PropTypes from 'prop-types';
import { Table, Checkbox } from 'semantic-ui-react';
import { ColumnMapping, ColumnMappingProp, ParsedSort } from './interfaces';
import { parseSortBy } from './utils';

type Props = {
    numSelected: number;
    handleSort: (property: string) => void;
    handleSelectAll: (checked: boolean) => void;
    sort: string;
    rowCount: number;
    columnMapping: ColumnMapping,
};

const Header: React.FC<Props> = (props) => {
    const {
        handleSelectAll,
        sort,
        numSelected,
        rowCount,
        columnMapping,
        handleSort,
    } = props;

    const sortBy = parseSortBy(sort);

    return (
        <Table.Header fullWidth>
            <Table.Row>
                <Table.HeaderCell padding="checkbox">
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={numSelected === rowCount}
                        onChange={(event: any) => {
                            handleSelectAll(event.target.checked);
                        }}
                    />
                </Table.HeaderCell>
                {Object.entries(columnMapping)
                    .map(([field, col]) => {
                        return (
                            <Table.HeaderCell
                                    key={field}
                                    sorted={getSortDirection(field, sortBy)}
                                    onClick={() => handleSort(field)}
                                >
                                {col.label}
                            </Table.HeaderCell>
                        );
                    })
                }
            </Table.Row>
        </Table.Header>
    );
};

function getSortDirection(field: string, sortBy: ParsedSort): 'ascending'|'descending' {
    const none: any = null;
    if (sortBy.field !== field) return none;
    if (sortBy.direction === 'asc') return 'ascending';
    if (sortBy.direction === 'desc') return 'descending';
    return none;
}

Header.propTypes = {
    numSelected: PropTypes.number.isRequired,
    handleSort: PropTypes.func.isRequired,
    handleSelectAll: PropTypes.func.isRequired,
    sort: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
    columnMapping: ColumnMappingProp.isRequired,
};

export default Header;
