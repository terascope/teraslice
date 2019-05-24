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
import TypeConfig from './TypeConfig';
import config from '../config';

const RolesForm: React.FC<Props> = ({ id }) => {
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
                                    value={model.client_id}
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
                        <TypeConfig
                            updateTypeConfig={(field, value) => {
                                updateModel({
                                    type_config: {
                                        ...model.type_config,
                                        ...{
                                            [field]: value,
                                        },
                                    },
                                });
                            }}
                            typeConfig={model.type_config}
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

RolesForm.propTypes = {
    id: PropTypes.string,
};

export default RolesForm;
