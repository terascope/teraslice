import React from 'react';
import PropTypes from 'prop-types';
import Table from '@material-ui/core/Table';
import Checkbox from '@material-ui/core/Checkbox';
import { AnyObject, get, uniq } from '@terascope/utils';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TablePagination from '@material-ui/core/TablePagination';
import TableCell, { SortDirection } from '@material-ui/core/TableCell';
import { Theme, createStyles, withStyles } from '@material-ui/core/styles';
import { ResolvedUser, QueryState } from '../../interfaces';
import UsersTableToolbar from './toolbar';
import UsersTableHeader from './header';
import { rows } from './shared';

const styles = (theme: Theme) => createStyles({
    root: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
    },
    table: {
        minWidth: 500,
    },
    tableWrapper: {
        overflowX: 'auto',
    },
});

type UsersTableProps = {
    users: ResolvedUser[];
    handleQueryChange: (options: QueryState) => void;
    classes?: AnyObject;
    defaultRowsPerPage?: number;
    total: number;
};

type TableState = {
    page: number;
    rowsPerPage: number;
    selected: string[];
    order: 'asc'|'desc';
    orderBy: string;
};

class Users extends React.Component<UsersTableProps, TableState> {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        handleQueryChange: PropTypes.func.isRequired,
        users: PropTypes.array.isRequired,
        defaultRowsPerPage: PropTypes.number,
        total: PropTypes.number.isRequired,
    };

    static getDerivedStateFromProps(props: UsersTableProps, state: TableState) {
        if (props.defaultRowsPerPage) {
            state.rowsPerPage = props.defaultRowsPerPage;
        }
        return state;
    }

    state: TableState = {
        page: 0,
        rowsPerPage: 25,
        selected: [],
        order: 'asc',
        orderBy: 'created'
    };

    updateQueryState = (updates: Partial<TableState>) => {
        const { page, rowsPerPage, order, orderBy } = {
            ...this.state,
            ...updates
        };

        const options = {
            from: page * rowsPerPage,
            size: rowsPerPage,
            sort: `${orderBy}:${order}`
        };
        this.props.handleQueryChange(options);
    }

    handleRequestSort = (event: any, property: string) => {
        const orderBy = property;
        let order: SortDirection = 'desc';

        if (this.state.orderBy === property && this.state.order === 'desc') {
            order = 'asc';
        }
        const updates = { order, orderBy };
        this.setState(updates);
        this.updateQueryState(updates);
    }

    handleSelectAllClick = (event: any) => {
        if (event.target.checked) {
            this.setState({
                selected: this.props.users.map(n => n.id)
            });
            return;
        }
        this.setState({ selected: [] });
    }

    handleClick = (event: any, id: string) => {
        const { selected } = this.state;
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        this.setState({ selected: newSelected });
    }

    isSelected = (id: string) => this.state.selected.indexOf(id) !== -1;

    handleChangePage = (event: any, page: number) => {
        const updates = { page };
        this.setState(updates);
        this.updateQueryState(updates);
    }

    handleChangeRowsPerPage = (event: any) => {
        const updates = {
            page: 0,
            rowsPerPage: event.target.value
        };

        this.setState(updates);
        this.updateQueryState(updates);
    }

    render() {
        const { classes, users, total } = this.props;
        const {
            page,
            rowsPerPage,
            selected,
            order,
            orderBy,
        } = this.state;

        const emptyRows = rowsPerPage - Math.min(rowsPerPage, total - page * rowsPerPage);
        const rowsPerPageOptions = uniq([1, 5, 10, 25, rowsPerPage]).sort((a, b) => a - b);

        return (
            <div className={classes.tableWrapper}>
                <UsersTableToolbar numSelected={selected.length} />
                <Table className={classes.table}>
                    <UsersTableHeader
                        numSelected={selected.length}
                        order={order}
                        orderBy={orderBy}
                        onSelectAllClick={this.handleSelectAllClick}
                        onRequestSort={this.handleRequestSort}
                        rowCount={users.length}
                    />
                    <TableBody>
                        {users.map(user => {
                            const isSelected = this.isSelected(user.id);
                            return (
                                <TableRow
                                    hover
                                    onClick={(event: any) => this.handleClick(event, user.id)}
                                    role="checkbox"
                                    aria-checked={isSelected}
                                    tabIndex={-1}
                                    key={user.id}
                                    selected={isSelected}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox checked={isSelected} />
                                    </TableCell>
                                    <TableCell>{user.firstname}</TableCell>
                                    <TableCell>{user.lastname}</TableCell>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{get(user, 'role.name') || user.type}</TableCell>
                                    <TableCell>{user.created}</TableCell>
                                </TableRow>
                            );
                        })}
                        {emptyRows > 0 && (
                            <TableRow style={{ height: 49 * emptyRows }}>
                                <TableCell colSpan={rows.length + 1} />
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    page={page}
                    count={total}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={rowsPerPageOptions}
                    backIconButtonProps={{
                        'aria-label': 'Previous Page',
                    }}
                    nextIconButtonProps={{
                        'aria-label': 'Next Page',
                    }}
                    onChangePage={this.handleChangePage}
                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                />
            </div>
        );
    }
}

export default withStyles(styles)(Users);
