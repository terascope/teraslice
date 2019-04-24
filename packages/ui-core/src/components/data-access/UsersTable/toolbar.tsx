import React from 'react';
import PropTypes from 'prop-types';
import {
    Menu,
    Icon,
    Dropdown,
} from 'semantic-ui-react';

type UsersTableToolbarProps = {
    title: string;
    selected: string[];
    query?: string;
    onQueryFilter: (query: string) => void
    onRemoveSelection: (ids: string[]) => void
};

type UsersTableToolbarState = {
    query: string;
};

class UsersTableToolbar extends React.Component<UsersTableToolbarProps, UsersTableToolbarState> {
    static propTypes = {
        selected: PropTypes.array.isRequired,
        title: PropTypes.string.isRequired,
        query: PropTypes.string,
        onRemoveSelection: PropTypes.func.isRequired,
        onQueryFilter: PropTypes.func.isRequired
    };

    state = {
        query: '',
    };

    handleQueryFilterChange = (event: any) => {
        this.setState({
            query: event.target.value,
        });
    }

    submitQueryChange = () => {
        const query = this.state.query || this.props.query || '';
        this.props.onQueryFilter(query);
    }

    handleRemoveSelection = (event: any) => {
        this.props.onRemoveSelection(this.props.selected);
    }

    render() {
        const { title } = this.props;
        const query = this.state.query || this.props.query;

        return (
            <Menu attached="top">
                <Dropdown item icon="wrench" simple>
                    <Dropdown.Menu>
                    <Dropdown.Item>
                        <Icon name="dropdown" />
                        <span className="text">New</span>

                        <Dropdown.Menu>
                        <Dropdown.Item>Document</Dropdown.Item>
                        <Dropdown.Item>Image</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown.Item>
                    <Dropdown.Item>Open</Dropdown.Item>
                    <Dropdown.Item>Save...</Dropdown.Item>
                    <Dropdown.Item>Edit Permissions</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Header>Export</Dropdown.Header>
                    <Dropdown.Item>Share</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>

                <Menu.Menu position="right">
                    <form onSubmit={this.submitQueryChange} className="ui right aligned category search item">
                        <div className="ui transparent icon input">
                            <input
                                className="prompt"
                                type="text"
                                value={query}
                                placeholder={`Search ${title}...`}
                                onChange={this.handleQueryFilterChange}
                            />
                            <i className="search link icon" />
                        </div>
                    </form>
                </Menu.Menu>
            </Menu>
        );
    }
}

export default UsersTableToolbar;
