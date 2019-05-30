import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { useCoreContext } from '@terascope/ui-components';
import ModelForm, {
    ValidateFn,
    BeforeSubmitFn,
    FormInput,
} from '../../ModelForm';
import Fields from './Fields';
import config from '../config';
import { Input } from '../interfaces';
import { validateFields } from './utils';

const ViewForm: React.FC<Props> = ({ id }) => {
    const authUser = useCoreContext().authUser!;

    const validate: ValidateFn<Input> = (errs, model) => {
        if (validateFields(model.excludes)) {
            errs.messages.push('Invalid Excludes');
        }
        if (validateFields(model.includes)) {
            errs.messages.push('Invalid Includes');
        }
        return errs;
    };

    const beforeSubmit: BeforeSubmitFn<Input> = (model, create) => {
        const input = { ...model };
        if (create) {
            delete input.id;
        }
        return { input };
    };

    return (
        <ModelForm<Input>
            modelName={config.name}
            id={id}
            validate={validate}
            beforeSubmit={beforeSubmit}
        >
            {({ defaultInputProps, updateModel, model }) => {
                return (
                    <React.Fragment>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.name}
                                name="name"
                                label="Name"
                            />
                            {authUser.type === 'SUPERADMIN' && (
                                <FormInput<Input>
                                    {...defaultInputProps}
                                    value={`${model.client_id}`}
                                    name="client_id"
                                    label="Client ID"
                                />
                            )}
                        </Form.Group>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                as={Form.TextArea}
                                name="description"
                                label="Description"
                                value={model.description}
                                width={8}
                            />
                        </Form.Group>
                        <Form.Group>
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
                            update={includes => {
                                updateModel({ includes });
                            }}
                            fields={model.includes!}
                        />
                        <Fields
                            label="Restricted Fields (exclusive)"
                            description="A blacklist of fields that can be views and searched"
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

type Props = {
    id?: string;
};

ViewForm.propTypes = {
    id: PropTypes.string,
};

export default ViewForm;
