import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Table from '@material-ui/core/Table';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import { AnyObject, get, uniq } from '@terascope/utils';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TablePagination from '@material-ui/core/TablePagination';
import { lighten } from '@material-ui/core/styles/colorManipulator';
import TableCell, { SortDirection } from '@material-ui/core/TableCell';
import { Theme, createStyles, withStyles } from '@material-ui/core/styles';
import { ResolvedUser, QueryState } from '../interfaces';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';

const rows = [
  { id: 'firstname', label: 'First Name' },
  { id: 'lastname', label: 'Last Name' },
  { id: 'username', label: 'Username' },
  { id: 'role', label: 'Role' },
  { id: 'created', label: 'Created' },
];

type EnhancedTableHeadProps = {
    numSelected: number;
    onRequestSort: (event: any, property: string) => void;
    onSelectAllClick: (event: any) => void;
    order: SortDirection;
    orderBy: string;
    rowCount: number;
};

class EnhancedTableHead extends React.Component<EnhancedTableHeadProps> {
    static propTypes = {
        numSelected: PropTypes.number.isRequired,
        onRequestSort: PropTypes.func.isRequired,
        onSelectAllClick: PropTypes.func.isRequired,
        order: PropTypes.string.isRequired,
        orderBy: PropTypes.string.isRequired,
        rowCount: PropTypes.number.isRequired,
    };

    createSortHandler = property => event => {
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

const toolbarStyles = theme => ({
    root: {
        paddingRight: theme.spacing.unit,
    },
    highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
      }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
      },
    spacer: {
        flex: '1 1 100%',
    },
    actions: {
        color: theme.palette.text.secondary,
    },
    title: {
        flex: '0 0 auto',
    },
});

class EnhancedTableToolbar extends React.Component<{ numSelected: number, classes: any }> {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        numSelected: PropTypes.number.isRequired,
    };

    render() {
        const { numSelected, classes } = this.props;

        return (
            <Toolbar
                className={classNames(classes.root, {
                    [classes.highlight]: numSelected > 0,
                })}
            >
                <div className={classes.title}>
                    {numSelected > 0 ? (
                    <Typography color="inherit" variant="subtitle1">
                        {numSelected} selected
                    </Typography>
                    ) : (
                    <Typography variant="h6" id="tableTitle">
                        Nutrition
                    </Typography>
                    )}
                </div>
                <div className={classes.spacer} />
                <div className={classes.actions}>
                    {numSelected > 0 ? (
                    <Tooltip title="Delete">
                        <IconButton aria-label="Delete">
                        <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                    ) : (
                    <Tooltip title="Filter list">
                        <IconButton aria-label="Filter list">
                        <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                    )}
                </div>
            </Toolbar>
        );
    }
}

const EnhancedTableToolbarWithStyles = withStyles(toolbarStyles)(EnhancedTableToolbar);

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
                <EnhancedTableToolbarWithStyles numSelected={selected.length} />
                <Table className={classes.table}>
                    <EnhancedTableHead
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
