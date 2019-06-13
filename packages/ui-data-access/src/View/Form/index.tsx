import React from 'react';
import PropTypes from 'prop-types';
import { Form, Segment } from 'semantic-ui-react';
import { validateFieldName, parseTypeConfig } from '../../utils';
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
import { Section } from '@terascope/ui-components';
import RestrictedInfo from './RestrictedInfo';

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
                const availableFields = parseTypeConfig(
                    model.data_type.config
                ).map(({ field }) => field);
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
                        <Section
                            title="Restricted Fields (inclusive)"
                            description="A whitelist of fields that can be views and searched"
                            info={<RestrictedInfo />}
                        >
                            <Form.Group as={Segment} basic>
                                <FormSelect<Input>
                                    {...defaultInputProps}
                                    label="Select Fields"
                                    multiple
                                    options={availableFields}
                                    name="includes"
                                    value={model.includes}
                                />
                            </Form.Group>
                        </Section>
                        <Section
                            title="Restricted Fields (exclusive)"
                            description="A blacklist of fields that can be views and searched"
                            info={<RestrictedInfo />}
                        >
                            <Form.Group as={Segment} basic>
                                <FormSelect<Input>
                                    {...defaultInputProps}
                                    label="Select Fields"
                                    multiple
                                    options={availableFields}
                                    name="excludes"
                                    value={model.excludes}
                                />
                            </Form.Group>
                        </Section>
                    </React.Fragment>
                );
            }}
        </ModelForm>
    );
};

type Props = {
    id?: string;
};

ViewForm.propTypes = {
    id: PropTypes.string,
};

export default ViewForm;
