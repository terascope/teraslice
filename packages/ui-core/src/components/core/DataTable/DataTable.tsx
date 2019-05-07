import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { times } from '@terascope/utils';
import { Segment, Table, Checkbox } from 'semantic-ui-react';
import TableHeader from './TableHeader';
import TableToolbar from './TableToolbar';
import * as utils from './utils';
import * as i from './interfaces';

type Props = {
    rowMapping: i.RowMapping;
    data: any[];
    updateQueryState: (options: i.QueryState) => void;
    total: number;
    title: string;
    queryState?: i.QueryState;
};

const DataTable: React.FC<Props> = (props) => {
    const { data, total, title, updateQueryState, rowMapping } = props;
    const queryState = {
        from: 0,
        size: 25,
        query: '*',
        sort: 'created:asc',
        ...props.queryState
    };

    const [selected, setSelected] = useState<string[]>([]);

    const handleRequestSort = (field: string) => {
        const current = utils.parseSortBy(queryState.sort);
        let direction: i.SortDirection = 'asc';
        if (current.field === field && current.direction === 'asc') {
            direction = 'desc';
        }
        updateQueryState({ sort: utils.formatSortBy({ field, direction }) });
    };

    const handleSelect = (id: string) => {
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

        setSelected(newSelected);
    };

    // FIXME
    // const rowsPerPageOptions = utils.uniqIntArray([1, 5, 10, 25, queryState.size]);
    // const page = queryState.from / queryState.size;

    const emptyRows = queryState.size - Math.min(queryState.size, total - queryState.from);
    const columns = Object.entries(rowMapping.columns);
    const numCols: any = columns.length + 1;
    const allSelected = selected.length === total;

    return (
        <Segment>
            <TableToolbar
                title={title}
                numSelected={selected.length}
                query={queryState.query}
                onQueryFilter={(query) => {
                    updateQueryState({ query });
                }}
                onRemoveSelection={() => {
                    // TODO
                }}
            />
            <Table sortable celled fixed>
                <TableHeader
                    numSelected={selected.length}
                    sort={queryState.sort}
                    onSelectAllClick={(checked) => {
                        if (!checked) return setSelected([]);
                        setSelected(times(total, () => '<all>'));
                    }}
                    onRequestSort={handleRequestSort}
                    rowCount={data.length}
                    columnMapping={rowMapping.columns}
                />
                <Table.Body>
                    {data.map(item => {
                        const id = rowMapping.getId(item);
                        const isSelected = selected.includes(id) || allSelected;
                        return (
                            <Table.Row
                                hover
                                onClick={(e: any) => handleSelect(id)}
                                role="checkbox"
                                tabIndex={-1}
                                key={id}
                                selected={isSelected}
                            >
                                <Table.Cell padding="checkbox">
                                    <Checkbox checked={isSelected} />
                                </Table.Cell>
                                {columns.map(([key, col]) => {
                                    return (
                                        <Table.Cell key={key}>
                                            {col.format(data)}
                                        </Table.Cell>
                                    );
                                })};
                            </Table.Row>
                        );
                    })}
                    {emptyRows > 0 && (
                        <Table.Row>
                            <Table.Cell width={numCols} />
                        </Table.Row>
                    )}
                </Table.Body>
            </Table>
        </Segment>
    );
};

DataTable.propTypes = {
    updateQueryState: PropTypes.func.isRequired,
    data: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    rowMapping: utils.rowMappingProp.isRequired,
    queryState: utils.queryStateProp
};

//     isSelected = (id: string) => this.state.selected.indexOf(id) !== -1;

//     handleChangePage = (event: any, page: number) => {
//         this.updateQueryState({ page });
//     }

//     handleChangeRowsPerPage = (event: any) => {
//         this.updateQueryState({
//             page: 0,
//             rowsPerPage: event.target.value
//         });
//     }

//     handleQueryChange = (query: string) => {
//         this.updateQueryState({ query });
//     }

//     render() {
//         const { classes, users, total, query, title } = this.props;

//         return (
//             <div className={classes.tableWrapper}>
//                 <TableToolbar
//                     title={title}
//                     selected={selected}
//                     query={query}
//                     onQueryFilter={this.handleQueryChange}
//                     onRemoveSelection={() => {}}
//                 />
//                 <Table className={classes.table}>
//                     <TableHeader
//                         numSelected={selected.length}
//                         order={order}
//                         orderBy={orderBy}
//                         onSelectAllClick={this.handleSelectAllClick}
//                         onRequestSort={this.handleRequestSort}
//                         rowCount={users.length}
//                         rowDefs={rowDefs}
//                     />
//                     <TableBody>
//                         {users.map(user => {
//                             const isSelected = this.isSelected(user.id);
//                             return (
//                                 <TableRow
//                                     hover
//                                     onClick={(event: any) => this.handleClick(event, user.id)}
//                                     role="checkbox"
//                                     aria-checked={isSelected}
//                                     tabIndex={-1}
//                                     key={user.id}
//                                     selected={isSelected}
//                                 >
//                                     <TableCell padding="checkbox">
//                                         <Checkbox checked={isSelected} />
//                                     </TableCell>
//                                     <TableCell>{user.firstname}</TableCell>
//                                     <TableCell>{user.lastname}</TableCell>
//                                     <TableCell>{user.username}</TableCell>
//                                     <TableCell>{get(user, 'role.name') || user.type}</TableCell>
//                                     <TableCell>{user.created}</TableCell>
//                                 </TableRow>
//                             );
//                         })}
//                         {emptyRows > 0 && (
//                             <TableRow style={{ height: 49 * emptyRows }}>
//                                 <TableCell colSpan={rowDefs.length + 1} />
//                             </TableRow>
//                         )}
//                     </TableBody>
//                 </Table>
//                 <TablePagination
//                     component="div"
//                     page={page}
//                     count={total}
//                     rowsPerPage={rowsPerPage}
//                     rowsPerPageOptions={rowsPerPageOptions}
//                     backIconButtonProps={{
//                         'aria-label': 'Previous Page',
//                     }}
//                     nextIconButtonProps={{
//                         'aria-label': 'Next Page',
//                     }}
//                     onChangePage={this.handleChangePage}
//                     onChangeRowsPerPage={this.handleChangeRowsPerPage}
//                 />
//             </div>
//         );
//     }
// }

export default DataTable;
