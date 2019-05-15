import React, { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnyObject, get, toInteger } from '@terascope/utils';
import { Form, Button } from 'semantic-ui-react';
import { useCoreContext, SuccessMessage, ErrorMessage } from '../../../core';
import Mutation from './Mutation';
import * as i from './interfaces';

const ModelForm: React.FC<i.ComponentProps> = ({ roles, id, input }) => {
    const authUser = useCoreContext().authUser!;
    const update = Boolean(id);
    const create = !update;

    const [model, setModel] = useState<i.Input>(input);
    const [showToken, setShowToken] = useState(false);

    const updateModel = (updates: AnyObject) => setModel(Object.assign(model, updates));

    const [errors, setErrors] = useState<i.ErrorsState>({
        fields: [],
        messages: [],
    });

    const roleOptions = roles.map(role => ({
        key: role.id,
        text: role.name,
        value: role.id,
    }));

    const onChange: i.ChangeFn = (e, { name, value }) => {
        updateModel({ [name]: value });
        validate();
    };

    const required: (keyof i.Input)[] = [
        'username',
        'firstname',
        'lastname',
        'type',
        'client_id',
    ];

    const validate = (isSubmit = false): boolean => {
        const errs: i.ErrorsState = {
            fields: [],
            messages: [],
        };

        if (create) {
            if (model.password && model.password !== model.repeat_password) {
                errs.messages.push('Password must match');
                errs.fields.push('password', 'repeat_password');
            }
        }

        const clientId = toInteger(model.client_id);
        if (clientId === false) {
            errs.messages.push('Client ID must be an valid number');
            errs.fields.push('client_id');
        } else {
            model.client_id = clientId;
            if (model.type !== 'SUPERADMIN' && clientId < 1) {
                errs.messages.push('Client ID must be greater than zero');
                errs.fields.push('client_id');
            }
        }

        if (isSubmit) {
            if (create) {
                required.push('password', 'repeat_password');
            }

            let missingRequired = false;

            required.forEach(field => {
                const d = model[field];
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

    const getFieldProps = ({ name, label, placeholder }: i.FieldOptions): any => {
        const hasError = errors.fields.includes(name);
        return {
            name,
            label,
            placeholder: placeholder || label,
            value: get(model, name, ''),
            onChange,
            error: hasError,
            required: required.includes(name),
            width: 4,
        };
    };

    const hasErrors = errors.messages.length > 0;

    return (
        <Mutation update={update}>
            {(submit, { data, loading, error }: any) => {
                const onSubmit = (e: FormEvent) => {
                    e.preventDefault();
                    if (validate(true)) {
                        const password = model.password as string;
                        delete model.password;
                        delete model.repeat_password;

                        const finalInput = { ...model };
                        if (!finalInput.role) delete input.role;
                        if (create) {
                            delete finalInput.id;
                        }
                        delete finalInput.api_token;

                        submit({
                            variables: {
                                input: finalInput,
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
                                {authUser.type === 'SUPERADMIN' && (
                                    <Form.Input
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
                                        label: 'Type',
                                        placeholder: 'Select User Type',
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
                                <Form.Group>
                                    <Form.Input
                                        type={showToken ? 'text' : 'password'}
                                        label="API Token"
                                        width={8}
                                        value={model.api_token}
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
                                    <Form.Button basic floated="right" width={15}>
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
                            <ErrorMessage error={errors.messages} attached="bottom" />
                        )}
                        {data && update && <SuccessMessage attached="bottom" />}
                        {data && create && (
                            <SuccessMessage
                                attached="bottom"
                                redirectTo={`/users/edit/${data.id}`}
                            />
                        )}
                    </div>
                );
            }}
        </Mutation>
    );
};

ModelForm.propTypes = i.ComponentPropTypes;
export default ModelForm;
