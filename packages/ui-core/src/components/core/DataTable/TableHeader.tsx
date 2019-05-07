import React from 'react';
import PropTypes from 'prop-types';
import { Table, Checkbox } from 'semantic-ui-react';
import { ColumnMapping, ParsedSort } from './interfaces';
import { columnMappingProp, parseSortBy } from './utils';

type Props = {
    numSelected: number;
    onRequestSort: (property: string) => void;
    onSelectAllClick: (checked: boolean) => void;
    sort: string;
    rowCount: number;
    columnMapping: ColumnMapping,
};

const TableHeader: React.FC<Props> = (props) => {
    const {
        onSelectAllClick,
        sort,
        numSelected,
        rowCount,
        columnMapping,
        onRequestSort,
    } = props;

    const sortBy = parseSortBy(sort);

    return (
        <Table.Header>
            <Table.Row>
                <Table.HeaderCell padding="checkbox">
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={numSelected === rowCount}
                        onChange={(event: any) => {
                            onSelectAllClick(event.target.checked);
                        }}
                    />
                </Table.HeaderCell>
                {Object.entries(columnMapping)
                    .map(([field, col]) => {
                        return (
                            <Table.HeaderCell
                                    key={field}
                                    sorted={getSortDirection(field, sortBy)}
                                    onClick={() => onRequestSort(field)}
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

TableHeader.propTypes = {
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    sort: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
    columnMapping: columnMappingProp.isRequired,
};

export default TableHeader;
