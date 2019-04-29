import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import TableRow from '@material-ui/core/TableRow';
import TableHead from '@material-ui/core/TableHead';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TableCell, { SortDirection } from '@material-ui/core/TableCell';

type Props = {
    numSelected: number;
    onRequestSort: (property: string) => void;
    onSelectAllClick: (checked: boolean) => void;
    order: string|boolean;
    orderBy: string;
    rowCount: number;
    rowDefs: { id: string, label: string }[],
};

const TableHeader: React.FC<Props> = (props) => {
    const {
        onSelectAllClick,
        order,
        orderBy,
        numSelected,
        rowCount,
        rowDefs,
        onRequestSort,
    } = props;

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={numSelected === rowCount}
                        onChange={(event: any) => {
                            onSelectAllClick(event.target.checked);
                        }}
                    />
                </TableCell>
                {rowDefs.map((row) => (<TableCell
                        key={row.id}
                        align="left"
                        sortDirection={
                            orderBy === row.id ?
                            order as SortDirection : false
                        }
                    >
                    <Tooltip
                        title="Sort"
                        placement="bottom-start"
                        enterDelay={300}
                    >
                        <TableSortLabel
                            active={orderBy === row.id}
                            direction={order as 'asc'|'desc'}
                            onClick={() => onRequestSort(row.id)}
                        >
                            {row.label}
                        </TableSortLabel>
                    </Tooltip>
                </TableCell>))}
            </TableRow>
        </TableHead>
    );
};

TableHeader.propTypes = {
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.bool
    ]).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
    rowDefs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
    }).isRequired).isRequired,
};

export default TableHeader;
