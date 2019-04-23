import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import TableRow from '@material-ui/core/TableRow';
import TableHead from '@material-ui/core/TableHead';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TableCell, { SortDirection } from '@material-ui/core/TableCell';
import { rows } from './shared';

type EnhancedTableHeadProps = {
    numSelected: number;
    onRequestSort: (event: any, property: string) => void;
    onSelectAllClick: (event: any) => void;
    order: SortDirection;
    orderBy: string;
    rowCount: number;
};

export default class EnhancedTableHead extends React.Component<EnhancedTableHeadProps> {
    static propTypes = {
        numSelected: PropTypes.number.isRequired,
        onRequestSort: PropTypes.func.isRequired,
        onSelectAllClick: PropTypes.func.isRequired,
        order: PropTypes.string.isRequired,
        orderBy: PropTypes.string.isRequired,
        rowCount: PropTypes.number.isRequired,
    };

    createSortHandler = (property: string) => (event: any) => {
        this.props.onRequestSort(event, property);
    }

    render() {
        const { onSelectAllClick, order, orderBy, numSelected, rowCount } = this.props;

        return (
            <TableHead>
                <TableRow>
                    <TableCell padding="checkbox">
                        <Checkbox
                            indeterminate={numSelected > 0 && numSelected < rowCount}
                            checked={numSelected === rowCount}
                            onChange={onSelectAllClick}
                        />
                    </TableCell>
                    {rows.map((row) => (<TableCell
                            key={row.id}
                            align="left"
                            sortDirection={orderBy === row.id ? order : false}
                        >
                        <Tooltip
                            title="Sort"
                            placement="bottom-start"
                            enterDelay={300}
                        >
                            <TableSortLabel
                                active={orderBy === row.id}
                                direction={order as 'asc'|'desc'}
                                onClick={this.createSortHandler(row.id)}
                            >
                                {row.label}
                            </TableSortLabel>
                        </Tooltip>
                    </TableCell>), this)}
                </TableRow>
            </TableHead>
        );
    }
}
