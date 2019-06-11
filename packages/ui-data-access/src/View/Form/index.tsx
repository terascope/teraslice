import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { validateFieldName } from '../../utils';
import { Input } from '../interfaces';
import config from '../config';
import Fields from './Fields';
import ModelForm, {
    ValidateFn,
    FormInput,
    FormSelect,
    ClientID,
    Description,
    FormCheckbox,
} from '../../ModelForm';

const ViewForm: React.FC<Props> = ({ id }) => {
    const afterChange = (model: Input) => {
        if (model.data_type && model.data_type.client_id) {
            model.client_id = model.data_type.client_id;
        }
    };
    const validate: ValidateFn<Input> = (errs, model) => {
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
            {({ defaultInputProps, updateModel, model, dataTypes }) => {
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
                            <FormCheckbox<Input>
                                {...defaultInputProps}
                                value={model.prevent_prefix_wildcard}
                                name="prevent_prefix_wildcard"
                                label="Prevent Prefix Wildcard"
                            />
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.constraint}
                                name="constraint"
                                label="Search Query Constraint"
                            />
                        </Form.Group>
                        <Fields
                            label="Restricted Fields (inclusive)"
                            description="A whitelist of fields that can be views and searched"
                            available={getAvailableFields(model)}
                            update={includes => {
                                updateModel({ includes });
                            }}
                            fields={model.includes!}
                        />
                        <Fields
                            label="Restricted Fields (exclusive)"
                            description="A blacklist of fields that can be views and searched"
                            available={getAvailableFields(model)}
                            update={excludes => {
                                updateModel({ excludes });
                            }}
                            fields={model.excludes!}
                        />
                    </React.Fragment>
                );
            }}
        </ModelForm>
    );
};

function getAvailableFields(model: Input): string[] {
    if (!model.data_type || !model.data_type.type_config) return [];
    return Object.keys(model.data_type.type_config);
}

type Props = {
    id?: string;
};

ViewForm.propTypes = {
    id: PropTypes.string,
};

export default ViewForm;
