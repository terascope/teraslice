import React from 'react';
import PropTypes from 'prop-types';
import { get } from '@terascope/utils';
import { Table, Checkbox } from 'semantic-ui-react';
import { RowMappingProp, RowMapping } from './interfaces';

const Body: React.FC<Props> = (props) => {
    const {
        records,
        selected,
        total,
        rowMapping,
        selectRecord
    } = props;

    const columns = Object.entries(rowMapping.columns);
    const allSelected = selected.length === total;

    return (
        <Table.Body>
            {records.map(record => {
                const id = rowMapping.getId(record);
                const isSelected = selected.includes(id) || allSelected;
                return (
                    <Table.Row
                        onClick={(e: any) => selectRecord(id)}
                        tabIndex={-1}
                        key={`record-${id}`}
                        selected={isSelected}
                    >
                        <Table.Cell collapsing width={1} textAlign="center">
                            <Checkbox checked={isSelected} />
                        </Table.Cell>
                        {columns.map(([key, col]) => {
                            const value = col.format ? col.format(record) : get(record, key);
                            return (
                                <Table.Cell key={`record-${id}-${key}`}>
                                    {value}
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
    selectRecord: (id: string) => void;
    total: number;
};

Body.propTypes = {
    selectRecord: PropTypes.func.isRequired,
    records: PropTypes.array.isRequired,
    selected: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    total: PropTypes.number.isRequired,
    rowMapping: RowMappingProp.isRequired,
};

export default Body;
