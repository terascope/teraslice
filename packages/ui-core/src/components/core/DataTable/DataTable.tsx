import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { times } from '@terascope/utils';
import { Table, Segment, Message, Icon } from 'semantic-ui-react';
import Header from './Header';
import Toolbar from './Toolbar';
import Body from './Body';
import Footer from './Footer';
import * as i from './interfaces';

const DataTable: React.FC<Props> = (props) => {
    const {
        records,
        total,
        baseEditPath,
        title,
        loading,
        updateQueryState,
        removeRecords,
        rowMapping,
    } = props;

    const queryState = {
        from: 0,
        size: 25,
        query: '*',
        sort: 'created:asc',
        ...props.queryState,
    };

    const [selected, setSelected] = useState<string[]>([]);
    const [actionState, setActionState] = useState<i.ActionState>({});

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

        setSelected(newSelected);
    };

    const numCols = Object.keys(rowMapping.columns).length + 1;
    const selectedAll = total === selected.length;

    return (
        <Segment loading={loading || actionState.loading}>
            <Table sortable celled compact definition>
                <Toolbar
                    title={title}
                    numSelected={selected.length}
                    query={queryState.query}
                    numCols={numCols}
                    updateQueryState={updateQueryState}
                    onAction={async (action) => {
                        setActionState({
                            loading: true,
                        });
                        try {
                            if (action === 'REMOVE') {
                                const ids = selected.slice();
                                const message = await removeRecords(ids);

                                setActionState({
                                    loading: false,
                                    success: true,
                                    message,
                                });
                                ids.map((id) => {
                                    return records.findIndex((record) => {
                                        return rowMapping.getId(record) === id;
                                    });
                                }).forEach((i) => {
                                    records.splice(i);
                                });
                            }
                        } catch (err) {
                            setActionState({
                                loading: false,
                                error: true,
                                message: err.toString(),
                            });
                        }
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
                            ...times(fillCount, () => '<any>'),
                        ]);
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
                <Message icon success attached="bottom" size="large">
                    <Icon name="thumbs up outline" />
                    <Message.Content>
                        <Message.Header>Success!</Message.Header>
                        {actionState.message}
                    </Message.Content>
                </Message>
            )}
            {actionState.error && (
                <Message icon error attached="bottom" size="large">
                    <Icon name="times circle outline" />
                    <Message.Content>
                        <Message.Header>Error</Message.Header>
                        {actionState.message}
                    </Message.Content>
                </Message>
            )}
        </Segment>
    );
};

type Props = {
    rowMapping: i.RowMapping;
    records: any[];
    updateQueryState: i.UpdateQueryState;
    removeRecords: (ids: string[]) => Promise<string>;
    baseEditPath: string;
    title: string;
    total: number;
    loading?: boolean;
    queryState?: i.QueryState;
};

DataTable.propTypes = {
    updateQueryState: PropTypes.func.isRequired,
    records: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
    baseEditPath: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    loading: PropTypes.bool,
    removeRecords: PropTypes.func.isRequired,
    rowMapping: i.RowMappingProp.isRequired,
    queryState: i.QueryStateProp,
};

export default DataTable;
