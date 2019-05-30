import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { toInteger } from '@terascope/utils';
import { useCoreContext } from '@terascope/ui-components';
import ModelForm, {
    ValidateFn,
    BeforeSubmitFn,
    FormInput,
} from '../../ModelForm';
import Fields from './Fields';
import config from '../config';
import { validateFields } from './utils';

const ViewForm: React.FC<Props> = ({ id }) => {
    const authUser = useCoreContext().authUser!;

    const validate: ValidateFn = (errs, model) => {
        const clientId = toInteger(model.client_id);
        if (clientId === false || clientId < 1) {
            errs.messages.push(
                'Client ID must be an valid number greater than zero'
            );
            errs.fields.push('client_id');
        } else {
            model.client_id = clientId;
        }
        if (validateFields(model.excludes)) {
            errs.messages.push('Invalid Excludes');
        }
        if (validateFields(model.includes)) {
            errs.messages.push('Invalid Includes');
        }
        return errs;
    };

    const beforeSubmit: BeforeSubmitFn = (model, create) => {
        const input = { ...model };
        if (create) {
            delete input.id;
        }
        return { input };
    };

    return (
        <ModelForm
            modelName={config.name}
            id={id}
            validate={validate}
            beforeSubmit={beforeSubmit}
        >
            {({ defaultInputProps, updateModel, model }) => {
                return (
                    <React.Fragment>
                        <Form.Group>
                            <FormInput
                                {...defaultInputProps}
                                value={model.name}
                                name="name"
                                label={`${config.singularLabel} Name`}
                            />
                            {authUser.type === 'SUPERADMIN' && (
                                <FormInput
                                    {...defaultInputProps}
                                    value={`${model.client_id}`}
                                    name="client_id"
                                    label="Client ID"
                                />
                            )}
                        </Form.Group>
                        <Form.Group>
                            <FormInput
                                {...defaultInputProps}
                                as={Form.TextArea}
                                name="description"
                                label="Description"
                                value={model.description}
                                width={8}
                            />
                        </Form.Group>
                        <Fields
                            label="Restricted Fields (inclusive)"
                            description="A whitelist of fields that can be views and searched"
                            update={includes => {
                                updateModel({ includes });
                            }}
                            fields={model.includes}
                        />
                        <Fields
                            label="Restricted Fields (exclusive)"
                            description="A blacklist of fields that can be views and searched"
                            update={excludes => {
                                updateModel({ excludes });
                            }}
                            fields={model.excludes}
                        />
                        <Form.Group>
                            <FormInput
                                {...defaultInputProps}
                                value={model.name}
                                name="constraint"
                                label={`${config.singularLabel} Constraint`}
                            />
                        </Form.Group>
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
