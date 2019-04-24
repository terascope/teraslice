import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'semantic-ui-react';
import { rows, SortDirection } from './shared';

type RealSortDirection = 'ascending'|'descending'|undefined;
type EnhancedTableHeadProps = {
    numSelected: number;
    onRequestSort: (event: any, property: string) => void;
    onSelectAllClick: (event: any) => void;
    order: SortDirection;
    orderBy: string;
    rowCount: number;
};

export default class EnhancedTableHead extends React.Component<EnhancedTableHeadProps> {
    static propTypes = {
        numSelected: PropTypes.number.isRequired,
        onRequestSort: PropTypes.func.isRequired,
        onSelectAllClick: PropTypes.func.isRequired,
        order: PropTypes.string.isRequired,
        orderBy: PropTypes.string.isRequired,
        rowCount: PropTypes.number.isRequired,
    };

    handleSort = (property: string) => (event: any) => {
        this.props.onRequestSort(event, property);
    }

    render() {
        const { order, orderBy } = this.props;
        let realOrder: RealSortDirection = undefined;
        if (order === 'asc') realOrder = 'ascending';
        else if (order === 'desc') realOrder = 'descending';

        return (
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell
                        key="select-all"
                        align="left"
                    >
                    </Table.HeaderCell>
                    {rows.map((row) => (
                        <Table.HeaderCell
                            key={row.id}
                            align="left"
                            sorted={orderBy === row.id ? realOrder : undefined}
                            onClick={this.handleSort('name')}
                        >
                        </Table.HeaderCell>
                    ), this)}
                </Table.Row>
            </Table.Header>
        );
    }
}
