import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { toInteger } from '@terascope/utils';
import { useCoreContext, UserPermissionMap } from '@terascope/ui-components';
import ModelForm, {
    ValidateFn,
    BeforeSubmitFn,
    FormInput,
} from '../../ModelForm';
import TokenForm from './TokenForm';
import { Role } from './interfaces';
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
            modelName={config.name}
            id={id}
            validate={validate}
            beforeSubmit={beforeSubmit}
        >
            {({ defaultInputProps, model, roles, update }) => {
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
                    <React.Fragment>
                        <Form.Group>
                            <FormInput
                                {...defaultInputProps}
                                name="username"
                                label={`${config.singularLabel} Name`}
                                value={model.username}
                            />
                            {authUser.type === 'SUPERADMIN' && (
                                <FormInput
                                    {...defaultInputProps}
                                    disabled={model.type === 'SUPERADMIN'}
                                    name="client_id"
                                    label="Client ID"
                                    value={model.client_id}
                                />
                            )}
                        </Form.Group>
                        <Form.Group>
                            <FormInput
                                {...defaultInputProps}
                                name="firstname"
                                label="First Name"
                                value={model.firstname}
                            />
                            <FormInput
                                {...defaultInputProps}
                                name="lastname"
                                label="Last Name"
                                value={model.lastname}
                            />
                        </Form.Group>
                        <Form.Group>
                            <FormInput
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
                            <FormInput
                                {...defaultInputProps}
                                as={Form.Select}
                                name="role"
                                label="Role"
                                placeholder="Select Role"
                                value={model.role}
                                options={roleOptions}
                            />
                            <FormInput
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
                            <FormInput
                                {...defaultInputProps}
                                type="password"
                                name="password"
                                label="Password"
                                value={model.password}
                            />
                            <FormInput
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
