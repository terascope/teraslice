import React, { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnyObject, get, toInteger } from '@terascope/utils';
import { Form, Button } from 'semantic-ui-react';
import { useCoreContext, SuccessMessage, ErrorMessage } from '../../../core';
import UserMutation from './Mutation';
import * as i from './interfaces';

const ModelForm: React.FC<i.ComponentProps> = ({ roles, id, userInput }) => {
    const authUser = useCoreContext().authUser!;
    const update = Boolean(id);

    const [user, setUser] = useState<i.UserInput>(userInput);
    const [showToken, setShowToken] = useState(false);

    const updateUser = (updates: AnyObject) =>
        setUser(Object.assign(user, updates));

    const [errors, setErrors] = useState<i.ErrorsState>({
        fields: [],
        messages: []
    });

    const roleOptions = roles.map(role => ({
        key: role.id,
        text: role.name,
        value: role.id
    }));

    const onChange: i.ChangeFn = (e, { name, value }) => {
        updateUser({ [name]: value });
        validate();
    };

    const required: (keyof i.UserInput)[] = [
        'username',
        'firstname',
        'lastname',
        'type',
        'client_id'
    ];

    const validate = (isSubmit = false): boolean => {
        const errs: i.ErrorsState = {
            fields: [],
            messages: []
        };

        if (!update) {
            if (user.password && user.password !== user.repeat_password) {
                errs.messages.push('Password must match');
                errs.fields.push('password', 'repeat_password');
            }
        }

        const clientId = toInteger(user.client_id);
        if (clientId === false) {
            errs.messages.push('Client ID must be an valid number');
            errs.fields.push('client_id');
        } else {
            user.client_id = clientId;
        }

        if (isSubmit) {
            if (!update) {
                required.push('password', 'repeat_password');
            }

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

    const getFieldProps = ({
        name,
        label,
        placeholder
    }: i.FieldOptions): any => {
        const hasError = errors.fields.includes(name);
        return {
            name,
            label,
            placeholder: placeholder || label,
            value: get(user, name, ''),
            onChange,
            error: hasError,
            required: required.includes(name),
            width: 4
        };
    };

    const hasErrors = errors.messages.length > 0;

    return (
        <UserMutation update={update}>
            {(submit, { data, loading, error }: any) => {
                const onSubmit = (e: FormEvent) => {
                    e.preventDefault();
                    if (validate(true)) {
                        const password = user.password as string;
                        delete user.password;
                        delete user.repeat_password;

                        const userInput = { ...user };
                        if (!userInput.role) delete userInput.role;
                        if (!update) {
                            delete userInput.id;
                        }
                        delete userInput.api_token;

                        submit({
                            variables: {
                                user: { ...userInput },
                                password
                            }
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
                                        label: 'User Name'
                                    })}
                                />
                                <Form.Input
                                    {...getFieldProps({
                                        name: 'client_id',
                                        label: 'Client ID'
                                    })}
                                    disabled={authUser.type !== 'SUPERADMIN'}
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Input
                                    {...getFieldProps({
                                        name: 'firstname',
                                        label: 'First Name'
                                    })}
                                />
                                <Form.Input
                                    {...getFieldProps({
                                        name: 'lastname',
                                        label: 'Last Name'
                                    })}
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Input
                                    type="email"
                                    {...getFieldProps({
                                        name: 'email',
                                        label: 'Email'
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
                                        placeholder: 'Select Role'
                                    })}
                                    options={roleOptions}
                                />
                                <Form.Select
                                    {...getFieldProps({
                                        name: 'type',
                                        label: 'Type',
                                        placeholder: 'Select User Type'
                                    })}
                                    disabled={authUser.type === 'USER'}
                                    options={i.userTypeOptions}
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Input
                                    type="password"
                                    {...getFieldProps({
                                        name: 'password',
                                        label: 'Password'
                                    })}
                                />
                                <Form.Input
                                    type="password"
                                    {...getFieldProps({
                                        name: 'repeat_password',
                                        label: 'Repeat Password'
                                    })}
                                />
                            </Form.Group>
                            {update && (
                                <Form.Group>
                                    <Form.Input
                                        type={showToken ? 'text' : 'password'}
                                        label="API Token"
                                        width={8}
                                        value={user.api_token}
                                    >
                                        <input readOnly />
                                        <Button
                                            icon="eye"
                                            basic
                                            onClick={(e: any) => {
                                                e.preventDefault();
                                                setShowToken(!showToken);
                                            }}
                                        />
                                    </Form.Input>
                                </Form.Group>
                            )}
                            {!data && (
                                <Form.Group>
                                    <Form.Button
                                        basic
                                        floated="right"
                                        width={15}
                                        onClick={e => e.preventDefault()}
                                    >
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
                            {data && update && (
                                <Form.Group>
                                    <Form.Button
                                        basic
                                        floated="right"
                                        width={15}
                                    >
                                        <Link to="/users">Done</Link>
                                    </Form.Button>
                                </Form.Group>
                            )}
                        </Form>
                        {error && (
                            <ErrorMessage
                                title="Request Error"
                                error={error}
                                attached="bottom"
                            />
                        )}
                        {hasErrors && (
                            <ErrorMessage
                                error={errors.messages}
                                attached="bottom"
                            />
                        )}
                        {data && update && <SuccessMessage attached="bottom" />}
                        {data && !update && (
                            <SuccessMessage
                                attached="bottom"
                                redirectTo={`/users/edit/${data.user.id}`}
                            />
                        )}
                    </div>
                );
            }}
        </UserMutation>
    );
};

ModelForm.propTypes = i.ComponentPropTypes;
export default ModelForm;
