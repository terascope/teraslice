import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { useCoreContext } from '@terascope/ui-components';
import ModelForm, { FormInput } from '../../ModelForm';
import config from '../config';
import { Input } from '../interfaces';

const RolesForm: React.FC<Props> = ({ id }) => {
    const authUser = useCoreContext().authUser!;

    return (
        <ModelForm<Input>
            modelName={config.name}
            id={id}
            validate={errs => errs}
        >
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
                            {authUser.type === 'SUPERADMIN' && (
                                <FormInput<Input>
                                    {...defaultInputProps}
                                    name="client_id"
                                    label="Client ID"
                                    value={`${model.client_id}`}
                                />
                            )}
                        </Form.Group>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.description}
                                as={Form.TextArea}
                                name="description"
                                label="Description"
                                width={8}
                            />
                        </Form.Group>
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
