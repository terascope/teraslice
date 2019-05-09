import React, { useState } from 'react';
import { UserType } from '@terascope/data-access';
import { parseErrorInfo, get, AnyObject } from '@terascope/utils';
import { Form, Message, InputOnChangeData, DropdownProps, Icon, Segment } from 'semantic-ui-react';
import { ComponentProps } from './Query';
import { useCoreContext } from '../../core';

const userTypes: UserType[] = ['USER', 'ADMIN', 'SUPERADMIN'];
const userTypeOptions = userTypes.map(type => ({
    key: type,
    text: type,
    value: type,
}));

const CreateUserForm: React.FC<ComponentProps> = props => {
    const { loading, roles, error } = props;
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

    const requestErr = error && parseErrorInfo(error).message;
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

    const validate = () => {
        const updated: ErrorsState = {
            fields: [],
            messages: [],
        };

        if (user.password && user.password !== user.repeat_password) {
            updated.messages.push('Password must match');
            updated.fields.push('password', 'repeat_password');
        }

        setErrors(updated);
    };

    const onSubmit = () => {
        validate();
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
        <Segment basic>
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

                <Form.Group>
                    <Form.Button width={16} type="submit" floated="right">
                        Submit
                    </Form.Button>
                </Form.Group>
            </Form>
            {requestErr && (
                <Message error attached="bottom">
                    <Icon name="times circle outline" />
                    {requestErr}
                </Message>
            )}
            {hasErrors && (
                <Message error attached="bottom">
                    <Message.Header>Validation Error</Message.Header>
                    <Message.List>
                        {errors.messages.map((msg, i) => (
                            <Message.Item key={`valid-err-${i}`}>{msg}</Message.Item>
                        ))}
                    </Message.List>
                </Message>
            )}
        </Segment>
    );
};

type ChangeFn = (e: any, data: InputOnChangeData | DropdownProps) => void;

type FieldOptions = {
    name: string;
    label: string;
    placeholder?: string;
};

type ErrorsState = { fields: string[]; messages: string[] };

export default CreateUserForm;
