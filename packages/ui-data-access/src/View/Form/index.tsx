import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { get } from '@terascope/utils';
import { Form, Segment } from 'semantic-ui-react';
import { Section, ErrorMessage } from '@terascope/ui-components';
import { DataTypeConfig, LATEST_VERSION } from '@terascope/data-types';
import { validateFieldName, parseTypeConfig } from '../../utils';
import RestrictedInfo from './RestrictedInfo';
import { Input } from '../interfaces';
import config from '../config';
import ModelForm, {
    ValidateFn,
    FormInput,
    FormSelect,
    ClientID,
    Description,
    FormCheckbox,
} from '../../ModelForm';

const DataTypeQuery = gql`
    query DataTypeQuery($id: ID!) {
        dataType(id: $id) {
            resolved_config {
                version
                fields
            }
        }
    }
`;

const ViewForm: React.FC<Props> = ({ id }) => {
    const afterChange = (model: Input) => {
        if (model.data_type && model.data_type.client_id) {
            model.client_id = model.data_type.client_id;
        }
    };
    const validate: ValidateFn<Input> = (errs, model) => {
        console.table(model);
        if (model.excludes) {
            model.excludes.forEach(field => {
                if (!validateFieldName(field)) {
                    errs.messages.push(
                        `Invalid field "${field}" to be excluded`
                    );
                }
            });
        }
        if (model.includes) {
            model.includes.forEach(field => {
                if (!validateFieldName(field)) {
                    errs.messages.push(
                        `Invalid field "${field}" to be included`
                    );
                }
            });
        }
    };

    return (
        <ModelForm<Input>
            modelName={config.name}
            id={id}
            validate={validate}
            afterChange={afterChange}
            beforeSubmit={input => {
                input.prevent_prefix_wildcard = Boolean(
                    input.prevent_prefix_wildcard
                );
                delete input.space;
                return { input };
            }}
        >
            {({ defaultInputProps, model, dataTypes }) => {
                return (
                    <React.Fragment>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.name}
                                name="name"
                                label="Name"
                            />
                            <ClientID<Input>
                                {...defaultInputProps}
                                id={model.client_id}
                                inherited={Boolean(model.data_type.client_id)}
                            />
                        </Form.Group>
                        <Description<Input>
                            {...defaultInputProps}
                            description={model.description}
                        />
                        <Form.Group>
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="roles"
                                label="Roles"
                                placeholder="Select Roles"
                                multiple
                                value={model.roles}
                                options={model.space.roles}
                            />
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="data_type"
                                label="Data Type"
                                disabled={Boolean(id)}
                                placeholder="Select Data Type"
                                value={model.data_type}
                                options={dataTypes}
                            />
                        </Form.Group>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.constraint}
                                name="constraint"
                                label="Search Query Constraint"
                            />
                            <FormCheckbox<Input>
                                {...defaultInputProps}
                                value={model.prevent_prefix_wildcard}
                                name="prevent_prefix_wildcard"
                                label="Prevent Prefix Wildcard"
                            />
                        </Form.Group>
                        <Query<QueryResult, QueryVars>
                            query={DataTypeQuery}
                            variables={{ id: model.data_type.id }}
                            skip={!Boolean(model.data_type.id)}
                        >
                            {({ loading, error, data }) => {
                                if (error) {
                                    return <ErrorMessage error={error} />;
                                }
                                const resolvedConfig: DataTypeConfig = get(
                                    data,
                                    'dataType.resolved_config',
                                    {
                                        resolved_config: {
                                            version: LATEST_VERSION,
                                            fields: {},
                                        },
                                    }
                                );
                                return (
                                    <Segment
                                        basic
                                        loading={loading}
                                        className="nopadding"
                                    >
                                        <Section
                                            title="Allowed Fields"
                                            description={[
                                                'Fields that should be allowed in searches and returned results.',
                                                'If any fields are listed here then all other fields will be excluded automatically.',
                                            ].join(' ')}
                                            info={<RestrictedInfo />}
                                        >
                                            <Form.Group as={Segment} basic>
                                                <FormSelect<Input>
                                                    {...defaultInputProps}
                                                    label="Select Fields"
                                                    multiple
                                                    options={getAvailableFields(
                                                        resolvedConfig,
                                                        model.includes
                                                    )}
                                                    name="includes"
                                                    value={model.includes}
                                                />
                                            </Form.Group>
                                        </Section>
                                        <Section
                                            title="Excluded Fields"
                                            description={[
                                                'Fields that should be excluded from searches and returned results.',
                                                'If fields are listed here then all other fields will be allowed automatically.',
                                            ].join(' ')}
                                            info={<RestrictedInfo />}
                                        >
                                            <Form.Group as={Segment} basic>
                                                <FormSelect<Input>
                                                    {...defaultInputProps}
                                                    label="Select Fields"
                                                    multiple
                                                    options={getAvailableFields(
                                                        resolvedConfig,
                                                        model.excludes
                                                    )}
                                                    name="excludes"
                                                    value={model.excludes}
                                                />
                                            </Form.Group>
                                        </Section>
                                    </Segment>
                                );
                            }}
                        </Query>
                    </React.Fragment>
                );
            }}
        </ModelForm>
    );
};

function getAvailableFields(
    resolvedConfig: DataTypeConfig,
    existing: string[] = []
): string[] {
    return parseTypeConfig(resolvedConfig)
        .map(({ field }) => field)
        .filter(field => !existing.includes(field))
        .concat(existing);
}

type QueryResult = {
    dataType: {
        resolved_config: DataTypeConfig;
    };
};

type QueryVars = {
    id: string;
};

type Props = {
    id?: string;
};

ViewForm.propTypes = {
    id: PropTypes.string,
};

export default ViewForm;
