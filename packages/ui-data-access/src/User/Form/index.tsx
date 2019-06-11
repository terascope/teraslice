import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { useCoreContext, UserPermissionMap } from '@terascope/ui-components';
import { getModelType } from '../../utils';
import ModelForm, {
    ValidateFn,
    BeforeSubmitFn,
    FormInput,
    FormSelect,
    ClientID,
} from '../../ModelForm';
import { Input } from '../interfaces';
import TokenForm from './TokenForm';
import config from '../config';

const RolesForm: React.FC<Props> = ({ id }) => {
    const authUser = useCoreContext().authUser!;
    const afterChange = (model: Input) => {
        if (model.role && model.role.client_id) {
            model.client_id = model.role.client_id;
        }
    };

    const validate: ValidateFn<Input> = (errs, model) => {
        if (model.password && model.password !== model.repeat_password) {
            errs.messages.push('Password must match');
            errs.fields.push('password', 'repeat_password');
        }
    };

    const beforeSubmit: BeforeSubmitFn<Input> = (input, create) => {
        const password = input.password;
        delete input.password;
        delete input.repeat_password;

        if (create) {
            delete input.id;
        }
        delete input.api_token;
        // it will throw an error if email is ''
        if (!input.email) {
            delete input.email;
        }
        return {
            input,
            password,
        };
    };

    return (
        <ModelForm<Input>
            modelName={config.name}
            id={id}
            validate={validate}
            afterChange={afterChange}
            beforeSubmit={beforeSubmit}
        >
            {({ defaultInputProps, model, roles, update }) => {
                const modelType = getModelType(model);
                const userTypes = UserPermissionMap[authUser.type];
                const userTypeOptions = userTypes.map(type => ({
                    id: type,
                    name: type,
                }));
                const selectedUserType = {
                    id: modelType as string,
                    name: modelType as string,
                };

                return (
                    <React.Fragment>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                name="username"
                                label="Username"
                                value={model.username}
                            />
                            <ClientID<Input>
                                {...defaultInputProps}
                                id={model.client_id}
                                disabled={modelType === 'SUPERADMIN'}
                                inherited={Boolean(model.role.client_id)}
                            />
                        </Form.Group>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                name="firstname"
                                label="First Name"
                                value={model.firstname}
                            />
                            <FormInput<Input>
                                {...defaultInputProps}
                                name="lastname"
                                label="Last Name"
                                value={model.lastname}
                            />
                        </Form.Group>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                type="email"
                                name="email"
                                label="Email"
                                value={model.email}
                                width={8}
                            />
                        </Form.Group>
                        <Form.Group />
                        <Form.Group>
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="role"
                                label="Role"
                                disabled={modelType === 'SUPERADMIN'}
                                placeholder="Select Role"
                                value={model.role}
                                options={roles}
                            />
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="type"
                                sorted={false}
                                label="Account Type"
                                placeholder="Select Account Type"
                                disabled={authUser.type === 'USER'}
                                value={selectedUserType}
                                options={userTypeOptions}
                            />
                        </Form.Group>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                type="password"
                                name="password"
                                label="Password"
                                value={model.password}
                            />
                            <FormInput<Input>
                                {...defaultInputProps}
                                type="password"
                                name="repeat_password"
                                label="Repeat Password"
                                value={model.repeat_password}
                            />
                        </Form.Group>
                        {update && (
                            <TokenForm token={model.api_token} id={id!} />
                        )}
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
