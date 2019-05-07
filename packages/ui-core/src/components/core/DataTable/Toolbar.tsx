import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Menu, Input, Form, Icon } from 'semantic-ui-react';

type Props = {
    title: string;
    numSelected: number;
    query?: string;
    onQueryFilter: (query: string) => void
    onRemoveSelection: () => void
};

const Toolbar: React.FC<Props> = (props) => {
    const { numSelected, title, onQueryFilter, onRemoveSelection } = props;
    const [query, updateQuery] = useState(props.query || '');

    return (
        <Menu>
            <Menu.Header>
                {numSelected > 0 && (
                    <Menu.Item header color={numSelected > 0 ? 'teal' : 'grey'}>
                        {`${numSelected} selected`}
                    </Menu.Item>
                )}
            </Menu.Header>
            <Menu.Menu position="right">
                <Menu.Item>
                    <Form onSubmit={() => onQueryFilter(query || '')}>
                        <Input
                            action={{ icon: 'search' }}
                            type="submit"
                            value={query === '*' ? '' : query}
                            onChange={(e: any, { value }) => updateQuery(value)}
                            onClick={() => onQueryFilter(query || '')}
                            placeholder={`Search ${title}...`}
                        />
                    </Form>
                </Menu.Item>
                <Menu.Item
                    onClick={() => onRemoveSelection()}
                    disabled={!numSelected}
                    name={`Delete ${!numSelected ? '(disabled)' : ''}`}
                >
                    <Icon name="delete"></Icon>
                </Menu.Item>
            </Menu.Menu>
        </Menu>
    );
};

Toolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    query: PropTypes.string,
    onRemoveSelection: PropTypes.func.isRequired,
    onQueryFilter: PropTypes.func.isRequired
};

export default Toolbar;
