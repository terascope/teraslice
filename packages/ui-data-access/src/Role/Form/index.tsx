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
            {({ defaultInputProps, model }) => {
                return (
                    <React.Fragment>
                        <Form.Group>
                            <FormInput
                                {...defaultInputProps}
                                name="name"
                                label="Name"
                                value={model.name}
                            />
                            {authUser.type === 'SUPERADMIN' && (
                                <FormInput
                                    {...defaultInputProps}
                                    name="client_id"
                                    label="Client ID"
                                    value={`${model.client_id}`}
                                />
                            )}
                        </Form.Group>
                        <Form.Group>
                            <FormInput
                                {...defaultInputProps}
                                value={model.description}
                                as={Form.TextArea}
                                name="description"
                                label="Description"
                                width={8}
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

RolesForm.propTypes = {
    id: PropTypes.string,
};

export default RolesForm;
