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
    const {
        records,
        total,
        title,
        updateQueryState,
        removeRecords,
        rowMapping
    } = props;

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
    const selectedAll = total === selected.length;

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
                    toggleSelectAll={() => {
                        if (selectedAll) return setSelected([]);

                        const fillCount = total - records.length;
                        setSelected([
                            ...records.map((record) => rowMapping.getId(record)),
                            ...times(fillCount, () => '<any>')
                        ]);
                    }}
                    updateQueryState={updateQueryState}
                    selectedAll={selectedAll}
                    columnMapping={rowMapping.columns}
                />
                <Body
                    rowMapping={rowMapping}
                    records={records}
                    selectRecord={selectRecord}
                    selected={selected}
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

export default DataTable;
