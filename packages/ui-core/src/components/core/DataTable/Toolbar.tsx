import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Menu, Input, Form, Icon, Table } from 'semantic-ui-react';
import { UpdateQueryState } from './interfaces';

const Toolbar: React.FC<Props> = (props) => {
    const { numCols, numSelected, title, updateQueryState, removeRecords } = props;
    const [query, updateQuery] = useState(props.query || '');

    return (
        <Table.Header fullWidth>
            <Table.Row>
                <Table.HeaderCell colSpan={numCols} style={{
                    padding: '0',
                }}>
                    <Menu attached="top" compact borderless>
                        {numSelected > 0 && (
                            <Menu.Item header color={numSelected > 0 ? 'teal' : 'grey'}>
                                {`${numSelected} selected`}
                            </Menu.Item>
                        )}
                        <Menu.Menu position="right">
                            <Menu.Item>
                                <Input
                                    fluid
                                    action={{ icon: 'search' }}
                                    type="submit"
                                    value={query === '*' ? '' : query}
                                    onChange={(e: any, { value }) => updateQuery(value)}
                                    onClick={() => updateQueryState({ query: query || '' })}
                                    placeholder={`Search ${title}...`}
                                />
                            </Menu.Item>
                            <Menu.Item
                                onClick={() => removeRecords()}
                                disabled={!numSelected}
                                name={`Delete ${!numSelected ? '(disabled)' : ''}`}
                            >
                                <Icon name="delete"></Icon>
                            </Menu.Item>
                        </Menu.Menu>
                    </Menu>
                </Table.HeaderCell>
            </Table.Row>
        </Table.Header>
    );
};

type Props = {
    title: string;
    numSelected: number;
    query?: string;
    numCols: number;
    updateQueryState: UpdateQueryState;
    removeRecords: () => void;
};

Toolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    query: PropTypes.string,
    numCols: PropTypes.number.isRequired,
    removeRecords: PropTypes.func.isRequired,
    updateQueryState: PropTypes.func.isRequired,
};

export default Toolbar;
