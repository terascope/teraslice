import React, { FormEvent, useState } from 'react';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';
import { Link, Redirect } from 'react-router-dom';
import { AnyObject, get, toInteger } from '@terascope/utils';
import { UserType } from '@terascope/data-access';
import { DropdownProps, Form, Icon, InputOnChangeData, Message } from 'semantic-ui-react';
import { ResolvedUser, useCoreContext } from '../../core';
import { ComponentProps } from './Query';

const userTypes: UserType[] = ['USER', 'ADMIN', 'SUPERADMIN'];
const userTypeOptions = userTypes.map(type => ({
    key: type,
    text: type,
    value: type,
}));

const CreateUserForm: React.FC<ComponentProps> = ({ roles }) => {
    const authUser = useCoreContext().authUser!;

    const [user, setUser] = useState<AnyObject>({
        client_id: authUser.client_id || 0,
        firstname: '',
        lastname: '',
        username: '',
        password: '',
        repeat_password: '',
        email: '',
        role: get(authUser, 'role.id'),
        type: 'USER',
    });

    const updateUser = (updates: AnyObject) => setUser(Object.assign(user, updates));

    const [errors, setErrors] = useState<ErrorsState>({
        fields: [],
        messages: [],
    });

    const roleOptions = roles.map(role => ({
        key: role.id,
        text: role.name,
        value: role.id,
    }));

    const onChange: ChangeFn = (e, { name, value }) => {
        updateUser({ [name]: value });
        validate();
    };

    const validate = (isSubmit = false): boolean => {
        const errs: ErrorsState = {
            fields: [],
            messages: [],
        };

        if (user.password && user.password !== user.repeat_password) {
            errs.messages.push('Password must match');
            errs.fields.push('password', 'repeat_password');
        }

        const clientId = toInteger(user.client_id);
        if (clientId === false) {
            errs.messages.push('Client ID must be an valid number');
            errs.fields.push('client_id');
        } else {
            user.client_id = clientId;
        }

        if (isSubmit) {
            const required = [
                'username',
                'firstname',
                'lastname',
                'type',
                'password',
                'repeat_password',
                'client_id',
            ];

            let missingRequired = false;

            required.forEach(field => {
                const d = user[field];
                if (!d && !(d === '0' || d === 0)) {
                    missingRequired = true;
                    errs.fields.push(field);
                }
            });

            if (missingRequired) {
                errs.messages.push('Please complete missing fields');
            }
        }

        setErrors(errs);

        return !errs.messages.length || !errs.fields.length;
    };

    const getFieldProps = ({ name, label, placeholder }: FieldOptions): any => {
        const hasError = errors.fields.includes(name);
        return {
            name,
            label,
            placeholder: placeholder || label,
            value: get(user, name, ''),
            onChange,
            error: hasError,
            width: 4,
        };
    };

    const hasErrors = errors.messages.length > 0;

    return (
        <CreateUserMutation mutation={CREATE_USER}>
            {(createUser, { data, loading, error }: any) => {
                const onSubmit = (e: FormEvent) => {
                    e.preventDefault();
                    if (validate(true)) {
                        const password = user.password as string;
                        delete user.password;
                        delete user.repeat_password;
                        if (!user.role) delete user.role;
                        createUser({
                            variables: {
                                user,
                                password,
                            },
                        });
                    }
                };

                return (
                    <div>
                        <Form loading={loading} onSubmit={onSubmit}>
                            <Form.Group>
                                <Form.Input
                                    {...getFieldProps({
                                        name: 'username',
                                        label: 'User Name',
                                    })}
                                />
                                <Form.Input
                                    {...getFieldProps({
                                        name: 'client_id',
                                        label: 'Client ID',
                                    })}
                                    disabled={authUser.type !== 'SUPERADMIN'}
                                />
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
                                        label: 'Type',
                                        placeholder: 'Select User Type',
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
                            {!data && (
                                <Form.Group>
                                    <Form.Button basic floated="right" width={15}>
                                        <Link to="/users">Cancel</Link>
                                    </Form.Button>
                                    <Form.Button
                                        width={2}
                                        type="submit"
                                        floated="right"
                                        loading={loading}
                                        fluid
                                        primary
                                    >
                                        Submit
                                    </Form.Button>
                                </Form.Group>
                            )}
                        </Form>
                        {error && (
                            <Message error attached="bottom">
                                <Icon name="times circle outline" size="large" />
                                <Message.Header>Request Error</Message.Header>
                                {JSON.stringify(error)}
                            </Message>
                        )}
                        {hasErrors && (
                            <Message error attached="bottom">
                                <Message.Header>Validation Error</Message.Header>
                                <Message.List>
                                    {errors.messages.map((msg, i) => (
                                        <Message.Item key={`valid-err-${i}`}>
                                            {msg}
                                        </Message.Item>
                                    ))}
                                </Message.List>
                            </Message>
                        )}
                        {data && (
                            <Message success attached="bottom">
                                <Icon name="thumbs up outline" size="large" />
                                <Message.Header>Success!</Message.Header>
                                <Redirect to="/users/" />
                            </Message>
                        )}
                    </div>
                );
            }}
        </CreateUserMutation>
    );
};

const CREATE_USER = gql`
    mutation CreateUser($user: CreateUserInput!, $password: String!) {
        createUser(user: $user, password: $password) {
            id
            username
            type
        }
    }
`;

type ChangeFn = (e: any, data: InputOnChangeData | DropdownProps) => void;

type FieldOptions = {
    name: string;
    label: string;
    placeholder?: string;
};

type ErrorsState = { fields: string[]; messages: string[] };

type Response = {
    createUser: ResolvedUser;
};

type Variables = {
    user: AnyObject;
    password: string;
};

class CreateUserMutation extends Mutation<Response, Variables> {}

export default CreateUserForm;
