import React from 'react';
import { UserType } from '@terascope/data-access';
import { parseErrorInfo, get } from '@terascope/utils';
import { Form, Message, Button } from 'semantic-ui-react';
import { ComponentProps } from './Query';
import { useCoreContext } from '../../core';

const userTypes: UserType[] = ['USER', 'ADMIN', 'SUPERADMIN'];

const CreateUserForm: React.FC<ComponentProps> = (props) => {
    const { loading, roles, error } = props;
    const authUser = useCoreContext().authUser!;

    const errMsg = error && parseErrorInfo(error).message;

    const roleOptions = roles.map((role) => ({
        key: role.id,
        text: role.name,
        value: role.id
    }));

    const userTypeOptions = userTypes.map((type) => ({
        key: type,
        text: type,
        value: type,
    }));

    return (
        <Form loading={loading}>
            {error && (<Message
                error
                header="Error"
                content={errMsg}
            />)}

            <Form.Group>
                <Form.Input
                    label="User Name"
                    placeholder="User Name"
                    width={4}
                />
                <Form.Input
                    label="Client ID"
                    placeholder="Client ID"
                    disabled={authUser.type !== 'SUPERADMIN'}
                    defaultValue={authUser.client_id}
                    width={4}
                />
            </Form.Group>
            <Form.Group>
                <Form.Input
                    label="First Name"
                    placeholder="First Name"
                    width={4}
                />
                <Form.Input
                    label="Last Name"
                    placeholder="Last Name"
                    width={4}
                />
            </Form.Group>
            <Form.Group>
                <Form.Input
                    type="email"
                    label="Email"
                    placeholder="Email"
                    width={4}
                />
            </Form.Group>
            <Form.Group>
                <Form.Select
                    label="Role"
                    placeholder="Select Role"
                    defaultValue={get(authUser, 'role.id')}
                    width={4}
                    options={roleOptions}
                />
                <Form.Select
                    label="Type"
                    placeholder="Select User Type"
                    defaultValue="USER"
                    disabled={authUser.type === 'USER'}
                    width={4}
                    options={userTypeOptions}
                />
            </Form.Group>
            <Form.Group>
                <Form.Input
                    type="password"
                    label="Password"
                    placeholder="Password"
                    width={4}
                />
                <Form.Input
                    type="password"
                    label="Repeat Password"
                    placeholder="Repeat Password"
                    width={4}
                />
            </Form.Group>
            <Form.Group>
                <Button type="submit">Submit</Button>
            </Form.Group>
        </Form>
    );
};

export default CreateUserForm;
