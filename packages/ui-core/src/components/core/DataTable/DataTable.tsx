import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { times } from '@terascope/utils';
import { Table } from 'semantic-ui-react';
import Header from './Header';
import Toolbar from './Toolbar';
import Body from './Body';
import * as utils from './utils';
import * as i from './interfaces';

type Props = {
    rowMapping: i.RowMapping;
    records: any[];
    updateQueryState: (options: i.QueryState) => void;
    total: number;
    title: string;
    queryState?: i.QueryState;
};

const DataTable: React.FC<Props> = (props) => {
    const { records, total, title, updateQueryState, rowMapping } = props;
    const queryState = {
        from: 0,
        size: 25,
        query: '*',
        sort: 'created:asc',
        ...props.queryState
    };

    const [selected, setSelected] = useState<string[]>([]);

    const handleSort = (field: string) => {
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

    return (
        <div>
            <Toolbar
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
            <Table sortable celled compact definition>
                <Header
                    numSelected={selected.length}
                    sort={queryState.sort}
                    handleSelectAll={(checked) => {
                        if (!checked) return setSelected([]);
                        setSelected(times(total, () => '<all>'));
                    }}
                    handleSort={handleSort}
                    rowCount={records.length}
                    columnMapping={rowMapping.columns}
                />
                <Body
                    rowMapping={rowMapping}
                    records={records}
                    handleSelect={handleSelect}
                    selected={selected}
                    size={queryState.size}
                    from={queryState.from}
                    total={total}
                />
            </Table>
        </div>
    );
};

DataTable.propTypes = {
    updateQueryState: PropTypes.func.isRequired,
    records: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    rowMapping: i.RowMappingProp.isRequired,
    queryState: i.QueryStateProp
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
//                         handleSelectAll={this.handleSelectAllClick}
//                         handleSort={this.handleSort}
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
