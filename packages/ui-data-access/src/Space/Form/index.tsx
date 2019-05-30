import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { useCoreContext } from '@terascope/ui-components';
import ModelForm, { FormInput } from '../../ModelForm';
import config from '../config';
import { Input } from '../interfaces';

const SpaceForm: React.FC<Props> = ({ id }) => {
    const authUser = useCoreContext().authUser!;

    return (
        <ModelForm<Input>
            modelName={config.name}
            id={id}
            validate={errs => errs}
            beforeSubmit={(model, create) => {
                const input = { ...model };
                if (create) {
                    delete input.id;
                }
                return { input };
            }}
        >
            {({ defaultInputProps, model }) => {
                return (
                    <React.Fragment>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.name}
                                name="name"
                                label="Name"
                            />
                            {authUser.type === 'SUPERADMIN' && (
                                <FormInput<Input>
                                    {...defaultInputProps}
                                    value={`${model.client_id}`}
                                    name="client_id"
                                    label="Client ID"
                                />
                            )}
                        </Form.Group>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.endpoint}
                                name="endpoint"
                                label="API Endpoint"
                            />
                        </Form.Group>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                as={Form.TextArea}
                                name="description"
                                label="Description"
                                value={model.description}
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

SpaceForm.propTypes = {
    id: PropTypes.string,
};

export default SpaceForm;
