import React from 'react';
import PropTypes from 'prop-types';
import { SpaceSearchConfig } from '@terascope/data-access';
import { Form, Segment, Header } from 'semantic-ui-react';
import FormCheckbox from '../../ModelForm/FormCheckbox';

/**
    index
    connection
    max_query_size
    sort_default
    sort_dates_only
    sort_enabled
    default_geo_field
    preserve_index_name
    require_query
    default_date_field
    enable_history
    history_prefix
 */

type ConfigKey = keyof SpaceSearchConfig;

const SearchConfig: React.FC<Props> = ({ config, updateConfig }) => {
    const onChange = (e: any, props: any) => {
        e.preventDefault();
        const name = props.name as ConfigKey;
        const value = props.value;
        updateConfig({ ...config, [name]: value });
    };

    return (
        <Segment.Group className="daFormGroup">
            <Header as="h5" block attached="top">
                Search Configuration
            </Header>
            <Form.Group as={Segment} basic>
                <Form.Input
                    name="index"
                    required
                    label="Search Config Index"
                    value={config.index}
                    onChange={onChange}
                />
                <Form.Input
                    name="connection"
                    label="Connection to Use"
                    value={config.connection}
                    onChange={onChange}
                />
            </Form.Group>
            <Form.Group as={Segment} basic>
                <Form.Input
                    type="number"
                    name="max_query_size"
                    label="Maximum Query Size"
                    value={config.max_query_size}
                    onChange={onChange}
                />
                <FormCheckbox<SpaceSearchConfig>
                    name="require_query"
                    label="Require Query"
                    value={config.require_query}
                    onChange={onChange}
                />
            </Form.Group>
        </Segment.Group>
    );
};

type Props = {
    config: SpaceSearchConfig;
    updateConfig: (config: SpaceSearchConfig) => void;
};

SearchConfig.propTypes = {
    config: PropTypes.any.isRequired,
    updateConfig: PropTypes.func.isRequired,
};

export default SearchConfig;
