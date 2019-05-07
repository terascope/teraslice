import React from 'react';
import PropTypes from 'prop-types';
import { get } from '@terascope/utils';
import { Table, Checkbox } from 'semantic-ui-react';
import { RowMappingProp, RowMapping } from './interfaces';

type Props = {
    rowMapping: RowMapping;
    records: any[];
    selected: string[];
    handleSelect: (id: string) => void;
    total: number;
    size: number;
    from: number;
};

const Body: React.FC<Props> = (props) => {
    const {
        records,
        selected,
        size,
        from,
        total,
        rowMapping,
        handleSelect
    } = props;

    const emptyRows = size - Math.min(size, total - from);
    const columns = Object.entries(rowMapping.columns);
    const numCols: any = columns.length + 1;
    const allSelected = selected.length === total;

    return (
        <Table.Body>
            {records.map(record => {
                const id = rowMapping.getId(record);
                const isSelected = selected.includes(id) || allSelected;
                return (
                    <Table.Row
                        onClick={(e: any) => handleSelect(id)}
                        tabIndex={-1}
                        key={`record-${id}`}
                        selected={isSelected}
                    >
                        <Table.Cell collapsing>
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
            {emptyRows > 0 && (
                <Table.Row>
                    <Table.Cell width={numCols} />
                </Table.Row>
            )}
        </Table.Body>
    );
};

Body.propTypes = {
    handleSelect: PropTypes.func.isRequired,
    records: PropTypes.array.isRequired,
    selected: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    total: PropTypes.number.isRequired,
    size: PropTypes.number.isRequired,
    from: PropTypes.number.isRequired,
    rowMapping: RowMappingProp.isRequired,
};

export default Body;
