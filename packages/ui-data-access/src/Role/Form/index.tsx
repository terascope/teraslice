import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { useCoreContext } from '@terascope/ui-components';
import ModelForm, { FormInput, ClientID, Description } from '../../ModelForm';
import { Input } from '../interfaces';
import config from '../config';

const RolesForm: React.FC<Props> = ({ id }) => {
    const authUser = useCoreContext().authUser!;
    return (
        <ModelForm<Input> modelName={config.name} id={id}>
            {({ defaultInputProps, model }) => {
                return (
                    <React.Fragment>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                name="name"
                                label="Name"
                                value={model.name}
                            />
                            <ClientID<Input>
                                {...defaultInputProps}
                                id={model.client_id}
                                inherited={authUser.type !== 'SUPERADMIN'}
                            />
                        </Form.Group>
                        <Description<Input>
                            {...defaultInputProps}
                            description={model.description}
                        />
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
