import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { toSafeString } from '@terascope/utils';
import { useCoreContext } from '@terascope/ui-components';
import { Input, spaceConfigTypes } from '../interfaces';
import SearchConfig from './SearchConfig';
import config from '../config';
import ModelForm, {
    FormInput,
    FormSelect,
    ClientID,
    Description,
} from '../../ModelForm';

const SpaceForm: React.FC<Props> = ({ id }) => {
    const authUser = useCoreContext().authUser!;

    const afterChange = (model: Input) => {
        if (model.endpoint) {
            model.endpoint = toSafeString(model.endpoint);
        }
        if (model.data_type && model.data_type.client_id) {
            model.client_id = model.data_type.client_id;
        }
    };

    return (
        <ModelForm<Input>
            id={id}
            modelName={config.name}
            afterChange={afterChange}
            validate={(errs, model) => {
                if (model.type === 'SEARCH') {
                    if (!model.config.index) {
                        errs.messages.push(
                            'Search Configuration is missing index'
                        );
                    }
                }
            }}
        >
            {({ defaultInputProps, model, roles, dataTypes, updateModel }) => {
                return (
                    <React.Fragment>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.name}
                                name="name"
                                label="Name"
                            />
                            <ClientID<Input>
                                {...defaultInputProps}
                                id={model.client_id}
                                inherited={Boolean(model.data_type.client_id)}
                            />
                        </Form.Group>
                        <Form.Group>
                            <FormInput<Input>
                                {...defaultInputProps}
                                value={model.endpoint}
                                name="endpoint"
                                label="API Endpoint"
                            />
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="type"
                                sorted={false}
                                label="Configuration Type"
                                placeholder="Select Configuration Type"
                                value={model.type}
                                options={spaceConfigTypes as string[]}
                            />
                        </Form.Group>
                        <Description<Input>
                            {...defaultInputProps}
                            description={model.description}
                        />
                        <Form.Group>
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="roles"
                                label="Roles"
                                placeholder="Select Roles"
                                multiple
                                value={model.roles}
                                options={roles}
                            />
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="views"
                                label="Views"
                                placeholder="Select Views"
                                multiple
                                value={model.views}
                                options={model.data_type.views}
                            />
                        </Form.Group>
                        <Form.Group>
                            <FormSelect<Input>
                                {...defaultInputProps}
                                name="data_type"
                                label="Data Type"
                                disabled={Boolean(id)}
                                placeholder="Select Data Type"
                                value={model.data_type}
                                options={dataTypes}
                            />
                        </Form.Group>
                        {authUser.type === 'SUPERADMIN' && (
                            <SearchConfig
                                config={model.config}
                                updateConfig={searchConfig => {
                                    updateModel({ config: searchConfig });
                                }}
                            />
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

SpaceForm.propTypes = {
    id: PropTypes.string,
};

export default SpaceForm;
