import React from 'react';
import PropTypes from 'prop-types';
import { get } from '@terascope/utils';
import { Link } from 'react-router-dom';
import { Table, Checkbox } from 'semantic-ui-react';
import { RowMappingProp, RowMapping } from './interfaces';
import { formatPath } from '../utils';
import { canSelectFn } from './utils';

const Body: React.FC<Props> = props => {
    const {
        records,
        selected,
        selectedAll,
        baseEditPath,
        rowMapping,
        selectRecord,
    } = props;

    const columns = Object.entries(rowMapping.columns);
    const canSelectRecord = canSelectFn(rowMapping);

    return (
        <Table.Body>
            {records.map(record => {
                const canSelect = canSelectRecord(record);
                const id = rowMapping.getId(record);
                const isSelected = canSelect
                    ? selected.includes(id) || selectedAll
                    : false;

                return (
                    <Table.Row
                        onClick={(e: any) => {
                            if (!canSelect) return;
                            selectRecord(id);
                        }}
                        tabIndex={-1}
                        key={`record-${id}`}
                        selected={isSelected}
                    >
                        <Table.Cell collapsing width={1} textAlign="center">
                            <Checkbox
                                checked={isSelected}
                                disabled={!canSelect}
                            />
                        </Table.Cell>
                        {columns.map(([key, col], i) => {
                            const value = col.format
                                ? col.format(record)
                                : get(record, key) || '--';

                            const editPath = formatPath(baseEditPath, id);
                            return (
                                <Table.Cell key={`record-${id}-${key}`}>
                                    {i > 0 ? (
                                        value
                                    ) : (
                                        <Link to={editPath}>{value}</Link>
                                    )}
                                </Table.Cell>
                            );
                        })}
                    </Table.Row>
                );
            })}
        </Table.Body>
    );
};

type Props = {
    rowMapping: RowMapping;
    records: any[];
    selected: string[];
    selectedAll?: boolean;
    selectRecord: (id: string) => void;
    baseEditPath: string;
    total: number;
};

Body.propTypes = {
    selectRecord: PropTypes.func.isRequired,
    records: PropTypes.array.isRequired,
    selected: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    selectedAll: PropTypes.bool,
    total: PropTypes.number.isRequired,
    baseEditPath: PropTypes.string.isRequired,
    rowMapping: RowMappingProp.isRequired,
};

export default Body;
