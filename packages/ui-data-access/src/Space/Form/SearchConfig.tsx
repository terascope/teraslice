import React from 'react';
import PropTypes from 'prop-types';
import { SpaceSearchConfig } from '@terascope/data-access';
import { Form, Segment, Header } from 'semantic-ui-react';
import FormCheckbox from '../../ModelForm/FormCheckbox';

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
                    value={config.index || ''}
                    onChange={onChange}
                />
                <Form.Input
                    name="connection"
                    label="Connection to Use"
                    value={config.connection || 'default'}
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
            <Form.Group as={Segment} basic>
                <FormCheckbox<SpaceSearchConfig>
                    name="preserve_index_name"
                    label="Preserve index name on query results"
                    value={config.preserve_index_name}
                    onChange={onChange}
                />
            </Form.Group>
            <Form.Group as={Segment} basic>
                <Form.Input
                    name="sort_default"
                    label="Default Sort Field"
                    value={config.sort_default || ''}
                    onChange={onChange}
                />
                <FormCheckbox<SpaceSearchConfig>
                    name="sort_enabled"
                    label="Allow user to sort"
                    value={config.sort_enabled}
                    onChange={onChange}
                />
            </Form.Group>
            <Form.Group as={Segment} basic>
                <Form.Input
                    name="default_date_field"
                    label="Default Date Field"
                    value={config.default_date_field || ''}
                    onChange={onChange}
                />
                <FormCheckbox<SpaceSearchConfig>
                    name="sort_dates_only"
                    label="Allow sorting on date fields only"
                    value={config.sort_dates_only}
                    onChange={onChange}
                />
            </Form.Group>
            <Form.Group as={Segment} basic>
                <Form.Input
                    name="default_geo_field"
                    label="Default Geo Field"
                    value={config.default_geo_field || ''}
                    onChange={onChange}
                />
            </Form.Group>
            <Form.Group as={Segment} basic>
                <Form.Input
                    name="history_prefix"
                    label="Timeseries index prefix"
                    value={config.history_prefix || ''}
                    onChange={onChange}
                />
                <FormCheckbox<SpaceSearchConfig>
                    name="enable_history"
                    label="Allow users to search timeseries index"
                    value={config.enable_history}
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
