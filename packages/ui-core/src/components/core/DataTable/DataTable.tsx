import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { times } from '@terascope/utils';
import { Table } from 'semantic-ui-react';
import Header from './Header';
import Toolbar from './Toolbar';
import Body from './Body';
import Footer from './Footer';
import * as i from './interfaces';

const DataTable: React.FC<Props> = (props) => {
    const { records, total, title, updateQueryState, removeRecords, rowMapping } = props;
    const queryState = {
        from: 0,
        size: 25,
        query: '*',
        sort: 'created:asc',
        ...props.queryState
    };

    const [selected, setSelected] = useState<string[]>([]);

    const selectRecord = (id: string) => {
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

    const numCols = Object.keys(rowMapping.columns).length + 1;

    return (
        <div>
            <Table sortable celled compact definition>
                <Toolbar
                    title={title}
                    numSelected={selected.length}
                    query={queryState.query}
                    numCols={numCols}
                    updateQueryState={updateQueryState}
                    removeRecords={() => {
                        removeRecords(selected.slice());
                    }}
                />
                <Header
                    numSelected={selected.length}
                    sort={queryState.sort}
                    handleSelectAll={(checked) => {
                        if (!checked) return setSelected([]);
                        setSelected(times(total, () => '<all>'));
                    }}
                    updateQueryState={updateQueryState}
                    rowCount={records.length}
                    columnMapping={rowMapping.columns}
                />
                <Body
                    rowMapping={rowMapping}
                    records={records}
                    selectRecord={selectRecord}
                    selected={selected}
                    size={queryState.size}
                    from={queryState.from}
                    total={total}
                />
                <Footer
                    total={total}
                    numCols={numCols}
                    size={queryState.size}
                    from={queryState.from}
                    updateQueryState={updateQueryState}
                />
            </Table>
        </div>
    );
};

type Props = {
    rowMapping: i.RowMapping;
    records: any[];
    updateQueryState: i.UpdateQueryState;
    removeRecords: (ids: string[]) => void;
    total: number;
    title: string;
    queryState?: i.QueryState;
};

DataTable.propTypes = {
    updateQueryState: PropTypes.func.isRequired,
    records: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    removeRecords: PropTypes.func.isRequired,
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
//                     updateQuery={this.handleQueryChange}
//                     removeRecords={() => {}}
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
