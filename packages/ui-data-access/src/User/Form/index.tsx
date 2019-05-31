import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { useCoreContext, UserPermissionMap } from '@terascope/ui-components';
import ModelForm, {
    ValidateFn,
    BeforeSubmitFn,
    FormInput,
    FormSelect,
} from '../../ModelForm';
import { Input } from '../interfaces';
import TokenForm from './TokenForm';
import config from '../config';
import { mapForeignRef } from '../../ModelForm/utils';

const RolesForm: React.FC<Props> = ({ id }) => {
    const authUser = useCoreContext().authUser!;
    const validate: ValidateFn<Input> = (errs, model) => {
        if (model.password && model.password !== model.repeat_password) {
            errs.messages.push('Password must match');
            errs.fields.push('password', 'repeat_password');
        }
        return errs;
    };
    const beforeSubmit: BeforeSubmitFn<Input> = (input, create) => {
        const password = input.password;
        delete input.password;
        delete input.repeat_password;

        input.role = mapForeignRef(input.role);
        if (create) {
            delete input.id;
        }
        delete input.api_token;
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
            beforeSubmit={beforeSubmit}
        >
            {({ defaultInputProps, model, roles, update }) => {
                const userTypes = UserPermissionMap[authUser.type];
                const userTypeOptions = userTypes.map(type => ({
                    key: type,
                    text: type,
                    value: type,
                }));

                return (
                    <React.Fragment>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                name="username"
                                label="Username"
                                value={model.username}
                            />
                            {authUser.type === 'SUPERADMIN' && (
                                <FormInput<Input>
                                    {...defaultInputProps}
                                    disabled={model.type === 'SUPERADMIN'}
                                    name="client_id"
                                    label="Client ID"
                                    value={`${model.client_id}`}
                                />
                            )}
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
                                as={Form.Select}
                                name="role"
                                label="Role"
                                placeholder="Select Role"
                                value={model.role}
                                options={roles}
                            />
                            <FormInput<Input>
                                {...defaultInputProps}
                                as={Form.Select}
                                name="type"
                                label="Account Type"
                                placeholder="Select Account Type"
                                disabled={authUser.type === 'USER'}
                                value={model.type}
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
