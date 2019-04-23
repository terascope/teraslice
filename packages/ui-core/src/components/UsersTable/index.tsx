import React from 'react';
import PropTypes from 'prop-types';
import Table from '@material-ui/core/Table';
import Checkbox from '@material-ui/core/Checkbox';
import { get, uniq } from '@terascope/utils';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TablePagination from '@material-ui/core/TablePagination';
import TableCell, { SortDirection } from '@material-ui/core/TableCell';
import { Theme, createStyles, withStyles } from '@material-ui/core/styles';
import { ResolvedUser, QueryState } from '../../helpers';
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
    classes: any;
    defaultRowsPerPage?: number;
    total: number;
    query: string;
};

type TableState = {
    page: number;
    rowsPerPage: number;
    selected: string[];
    order: 'asc'|'desc';
    orderBy: string;
    query: string;
};

class UsersTable extends React.Component<UsersTableProps, TableState> {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        handleQueryChange: PropTypes.func.isRequired,
        users: PropTypes.array.isRequired,
        defaultRowsPerPage: PropTypes.number,
        total: PropTypes.number.isRequired,
        query: PropTypes.string
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
        orderBy: 'created',
        query: '',
    };

    updateQueryState = (updates: any) => {
        this.setState(updates, () => {
            const { query, page, rowsPerPage, order, orderBy } = this.state;
            this.props.handleQueryChange({
                from: page * rowsPerPage,
                size: rowsPerPage,
                sort: `${orderBy}:${order}`,
                query,
            });
        });
    }

    handleRequestSort = (event: any, property: string) => {
        const orderBy = property;
        let order: SortDirection = 'desc';

        if (this.state.orderBy === property && this.state.order === 'desc') {
            order = 'asc';
        }

        const updates = { order, orderBy };
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
        let newSelected: string[] = [];

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
        this.updateQueryState({ page });
    }

    handleChangeRowsPerPage = (event: any) => {
        this.updateQueryState({
            page: 0,
            rowsPerPage: event.target.value
        });
    }

    handleQueryChange = (query: string) => {
        this.updateQueryState({ query });
    }

    render() {
        const { classes, users, total, query } = this.props;
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
                <UsersTableToolbar
                    title="Users"
                    selected={selected}
                    query={query}
                    onQueryFilter={this.handleQueryChange}
                    onRemoveSelection={() => {}}
                />
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

// @ts-ignore
export default withStyles(styles)(UsersTable);
