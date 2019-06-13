import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Table, Segment } from 'semantic-ui-react';
import SuccessMessage from '../SuccessMessage';
import StateMessage from '../StateMessage';
import ErrorMessage from '../ErrorMessage';
import { canSelectFn } from './utils';
import * as i from './interfaces';
import Toolbar from './Toolbar';
import Header from './Header';
import Footer from './Footer';
import Body from './Body';

const DataTable: React.FC<Props> = props => {
    const {
        records,
        total,
        baseEditPath,
        loading,
        updateQueryState,
        exportRecords,
        rowMapping,
    } = props;

    const queryState = {
        from: 0,
        size: 25,
        query: '*',
        sort: 'created:asc',
        ...props.queryState,
    };

    const [{ selected, selectedAll }, setSelected] = useState<i.SelectState>({
        selected: [],
        selectedAll: false,
    });

    const [actionState, setActionState] = useState<i.ActionState>({});

    const canSelectRecord = canSelectFn(rowMapping);

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
                selected.slice(selectedIndex + 1)
            );
        }

        setSelected({ selected: newSelected, selectedAll: false });
    };

    const numCols = Object.keys(rowMapping.columns).length + 1;

    return (
        <Segment loading={loading || actionState.loading} basic>
            <Table sortable celled compact definition>
                <Toolbar
                    numSelected={selected.length}
                    query={queryState.query}
                    numCols={numCols}
                    updateQueryState={updateQueryState}
                    onAction={async action => {
                        setActionState({
                            loading: true,
                        });
                        try {
                            if (action === 'EXPORT') {
                                const docs = selected.map(id =>
                                    records.find(record => {
                                        return rowMapping.getId(record) === id;
                                    })
                                );

                                const message = await exportRecords(
                                    selectedAll || docs
                                );

                                setActionState({
                                    loading: false,
                                    success: true,
                                    message,
                                });

                                setSelected({
                                    selected: [],
                                    selectedAll,
                                });
                            }
                        } catch (err) {
                            setActionState({
                                loading: false,
                                error: true,
                                message: err,
                            });
                        }
                    }}
                />
                <Header
                    numSelected={selected.length}
                    sort={queryState.sort}
                    toggleSelectAll={() => {
                        if (selectedAll) {
                            return setSelected({
                                selected: [],
                                selectedAll: false,
                            });
                        }

                        setSelected({
                            selected: records
                                .filter(canSelectRecord)
                                .map(rowMapping.getId),
                            selectedAll: true,
                        });
                    }}
                    updateQueryState={updateQueryState}
                    selectedAll={selectedAll}
                    columnMapping={rowMapping.columns}
                />
                <Body
                    rowMapping={rowMapping}
                    records={records}
                    baseEditPath={baseEditPath}
                    selectRecord={selectRecord}
                    selected={selected}
                    selectedAll={selectedAll}
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
            {actionState.success && (
                <SuccessMessage
                    attached="bottom"
                    message={actionState.message}
                />
            )}
            {actionState.error && (
                <ErrorMessage attached="bottom" error={actionState.message} />
            )}
            <StateMessage attached="bottom" />
        </Segment>
    );
};

type Props = {
    rowMapping: i.RowMapping;
    records: any[];
    updateQueryState: i.UpdateQueryState;
    exportRecords: (ids: any[] | true) => Promise<string>;
    baseEditPath: string;
    total: number;
    loading?: boolean;
    queryState?: i.QueryState;
};

DataTable.propTypes = {
    updateQueryState: PropTypes.func.isRequired,
    records: PropTypes.array.isRequired,
    baseEditPath: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    loading: PropTypes.bool,
    exportRecords: PropTypes.func.isRequired,
    rowMapping: i.RowMappingProp.isRequired,
    queryState: i.QueryStateProp,
};

export default DataTable;
