import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import ModelForm, { FormInput, ClientID, Description } from '../../ModelForm';
import config from '../config';
import { Input } from '../interfaces';

const RolesForm: React.FC<Props> = ({ id }) => {
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
                                client_id={model.client_id}
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
