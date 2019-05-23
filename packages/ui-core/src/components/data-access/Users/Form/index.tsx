import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { toInteger } from '@terascope/utils';
import { useCoreContext, UserPermissionMap } from '@terascope/ui-components';
import ModelForm, { ValidateFn, BeforeSubmitFn } from '../../ModelForm';
import TokenForm from './TokenForm';
import { Role } from './interfaces';

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
        const password = model.password as string;
        delete model.password;
        delete model.repeat_password;

        const input = { ...model };
        if (!input.role) delete model.role;
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
        <ModelForm
            modelName="User"
            id={id}
            validate={validate}
            beforeSubmit={beforeSubmit}
        >
            {({ getFieldProps, model, roles, update }) => {
                const roleOptions = roles.map((role: Role) => ({
                    key: role.id,
                    text: role.name,
                    value: role.id,
                }));

                const userTypes = UserPermissionMap[authUser.type];
                const userTypeOptions = userTypes.map(type => ({
                    key: type,
                    text: type,
                    value: type,
                }));

                return (
                    <div>
                        <Form.Group>
                            <Form.Input
                                {...getFieldProps({
                                    name: 'username',
                                    label: 'User Name',
                                })}
                            />
                            {authUser.type === 'SUPERADMIN' && (
                                <Form.Input
                                    disabled={model.type === 'SUPERADMIN'}
                                    {...getFieldProps({
                                        name: 'client_id',
                                        label: 'Client ID',
                                    })}
                                />
                            )}
                        </Form.Group>
                        <Form.Group>
                            <Form.Input
                                {...getFieldProps({
                                    name: 'firstname',
                                    label: 'First Name',
                                })}
                            />
                            <Form.Input
                                {...getFieldProps({
                                    name: 'lastname',
                                    label: 'Last Name',
                                })}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Input
                                type="email"
                                {...getFieldProps({
                                    name: 'email',
                                    label: 'Email',
                                })}
                                width={8}
                            />
                        </Form.Group>
                        <Form.Group />
                        <Form.Group>
                            <Form.Select
                                {...getFieldProps({
                                    name: 'role',
                                    label: 'Role',
                                    placeholder: 'Select Role',
                                })}
                                options={roleOptions}
                            />
                            <Form.Select
                                {...getFieldProps({
                                    name: 'type',
                                    label: 'Account Type',
                                    placeholder: 'Select Account Type',
                                })}
                                disabled={authUser.type === 'USER'}
                                options={userTypeOptions}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Input
                                type="password"
                                {...getFieldProps({
                                    name: 'password',
                                    label: 'Password',
                                })}
                            />
                            <Form.Input
                                type="password"
                                {...getFieldProps({
                                    name: 'repeat_password',
                                    label: 'Repeat Password',
                                })}
                            />
                        </Form.Group>
                        {update && (
                            <TokenForm token={model.api_token} id={id!} />
                        )}
                    </div>
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
