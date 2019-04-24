import React from 'react';
import PropTypes from 'prop-types';
import { get } from '@terascope/utils';
import { Pagination, Table, Segment, Checkbox } from 'semantic-ui-react';
import { ResolvedUser, QueryState } from '../../../helpers';
import UsersTableToolbar from './toolbar';
import UsersTableHeader from './header';
import { rows, SortDirection } from './shared';

type UsersTableProps = {
    users: ResolvedUser[];
    handleQueryChange: (options: QueryState) => void;
    defaultRowsPerPage?: number;
    total: number;
    query?: string;
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
        const { users, total, query } = this.props;
        const {
            page,
            rowsPerPage,
            selected,
            order,
            orderBy,
        } = this.state;

        const emptyRows = rowsPerPage - Math.min(rowsPerPage, total - page * rowsPerPage);

        return (
            <Segment>
                <UsersTableToolbar
                    title="Users"
                    selected={selected}
                    query={query}
                    onQueryFilter={this.handleQueryChange}
                    onRemoveSelection={() => {}}
                />
                <Table basic>
                    <UsersTableHeader
                        numSelected={selected.length}
                        order={order}
                        orderBy={orderBy}
                        onSelectAllClick={this.handleSelectAllClick}
                        onRequestSort={this.handleRequestSort}
                        rowCount={users.length}
                    />
                    <Table.Body>
                        {users.map(user => {
                            const isSelected = this.isSelected(user.id);
                            return (
                                <Table.Row
                                    onClick={(event: any) => this.handleClick(event, user.id)}
                                    role="checkbox"
                                    aria-checked={isSelected}
                                    tabIndex={-1}
                                    key={user.id}
                                    selected={isSelected}
                                >
                                    <Table.Cell padding="checkbox">
                                        <Checkbox checked={isSelected} />
                                    </Table.Cell>
                                    <Table.Cell>{user.firstname}</Table.Cell>
                                    <Table.Cell>{user.lastname}</Table.Cell>
                                    <Table.Cell>{user.username}</Table.Cell>
                                    <Table.Cell>{get(user, 'role.name') || user.type}</Table.Cell>
                                    <Table.Cell>{user.created}</Table.Cell>
                                </Table.Row>
                            );
                        })}
                        {emptyRows > 0 && (
                            <Table.Row style={{ height: 49 * emptyRows }}>
                                <Table.Cell cells={rows.length + 1} />
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                <Pagination
                    activePage={page}
                    onChangePage={this.handleChangePage}
                    totalPages={total / rowsPerPage}
                    firstItem={null}
                    lastItem={null}
                    pointing
                    secondary
                />
            </Segment>
        );
    }
}

export default UsersTable;
