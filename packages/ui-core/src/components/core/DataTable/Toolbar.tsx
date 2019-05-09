import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Menu, Input, Icon, Table, Button, Label } from 'semantic-ui-react';
import { UpdateQueryState } from './interfaces';

const Toolbar: React.FC<Props> = props => {
    const { numCols, numSelected, title, updateQueryState, removeRecords } = props;
    const [query, updateQuery] = useState(props.query || '');

    const submitQuery = () => updateQueryState({ query: query || '*' });

    return (
        <Table.Header fullWidth>
            <Table.Row>
                <Table.HeaderCell colSpan={numCols} style={{ padding: 0 }}>
                    <Menu secondary size="small">
                        <Menu.Item icon onClick={() => removeRecords()} disabled={!numSelected}>
                            <Button as="div" labelPosition="right" disabled={!numSelected}>
                                <Button icon color={numSelected > 0 ? 'red' : undefined}>
                                    <Icon name="trash alternate" />
                                </Button>
                                {numSelected > 0 && (
                                    <Label basic pointing="left">
                                        {`Delete (${numSelected} selected)`}
                                    </Label>
                                )}
                            </Button>
                        </Menu.Item>
                        <Menu.Item position="right">
                            <form onSubmit={submitQuery}>
                                <Input
                                    icon="search"
                                    value={query === '*' ? '' : query}
                                    onChange={(e: any, { value }) => updateQuery(value)}
                                    onClick={submitQuery}
                                    placeholder={`Search ${title}...`}
                                />
                            </form>
                        </Menu.Item>
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
