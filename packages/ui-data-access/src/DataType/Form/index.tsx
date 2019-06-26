import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { trim, toInteger } from '@terascope/utils';
import { AvailableTypes } from '@terascope/data-types';
import ModelForm, {
    FormInput,
    ClientID,
    Description,
    FormSelect,
} from '../../ModelForm';
import { validateFieldName, parseTypeConfig } from '../../utils';
import { Input } from '../interfaces';
import TypeConfig from './TypeConfig';
import config from '../config';

const DataTypeForm: React.FC<Props> = ({ id }) => {
    return (
        <ModelForm<Input>
            modelName={config.name}
            id={id}
            validate={(errs, model) => {
                const typeVersion = toInteger(model.config.version);
                if (!typeVersion) {
                    errs.messages.push('Invalid Type Config version');
                }

                const types = parseTypeConfig(model.config);
                for (const { field, type } of types) {
                    if (!validateFieldName(field)) {
                        if (field) {
                            errs.messages.push(`Invalid field name "${field}"`);
                        } else {
                            errs.messages.push('Empty fields not allowed');
                        }
                    }

                    if (type && !AvailableTypes.includes(type)) {
                        let msg = `Invalid field type "${type}"`;
                        if (field) msg += ` for field "${field}"`;
                        errs.messages.push(msg);
                    }

                    const fieldCount = types.reduce(
                        (count, { field: _field }) => {
                            if (trim(_field) === trim(field)) return count + 1;
                            return count;
                        },
                        0
                    );
                    if (fieldCount !== 1) {
                        errs.messages.push('Duplicate fields not allowed');
                    }
                }
                return errs;
            }}
        >
            {({ defaultInputProps, updateModel, model, dataTypes }) => {
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
                            />
                        </Form.Group>
                        <Description<Input>
                            {...defaultInputProps}
                            description={model.description}
                        />
                        <FormSelect<Input>
                            {...defaultInputProps}
                            label="Inherit Fields from Data Types"
                            multiple
                            options={dataTypes}
                            name="inherit_from"
                            value={model.inherit_from}
                        />
                        <TypeConfig
                            updateTypeConfig={typeConfig => {
                                updateModel({
                                    config: { ...typeConfig },
                                });
                            }}
                            typeConfig={model.config}
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

DataTypeForm.propTypes = {
    id: PropTypes.string,
};

export default DataTypeForm;
