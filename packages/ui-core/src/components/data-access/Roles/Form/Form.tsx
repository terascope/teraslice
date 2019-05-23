import React, { FormEvent, useState } from 'react';
import { toInteger } from '@terascope/utils';
import { Form } from 'semantic-ui-react';
import {
    SuccessMessage,
    ErrorMessage,
    useCoreContext,
    tsWithRouter,
} from '@terascope/ui-components';
import * as i from './interfaces';
import * as m from '../../ModelForm';

const ModelForm = tsWithRouter<m.ComponentProps<i.Input>>(
    ({ id, input, history }) => {
        const authUser = useCoreContext().authUser!;
        const update = Boolean(id);
        const create = !update;

        const [model, setModel] = useState<i.Input>(input);

        const [errors, setErrors] = useState<m.ErrorsState<i.Input>>({
            fields: [],
            messages: [],
        });

        const required: (keyof i.Input)[] = ['name'];
        if (authUser.type === 'SUPERADMIN') {
            required.push('client_id');
        }

        const validate = (isSubmit = false): boolean => {
            const errs: m.ErrorsState<i.Input> = {
                fields: [],
                messages: [],
            };

            const clientId = toInteger(model.client_id);
            if (clientId === false || clientId < 1) {
                errs.messages.push(
                    'Client ID must be an valid number greater than zero'
                );
                errs.fields.push('client_id');
            } else {
                model.client_id = clientId;
            }

            if (isSubmit) {
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

        const getFieldProps = m.getFieldPropsFn({
            model,
            setModel,
            validate,
            required,
            errors,
        });

        const hasErrors = errors.messages.length > 0;

        return (
            <m.Mutation id={id} model="Role">
                {(submit, { data, loading, error }: any) => {
                    const onSubmit = (e: FormEvent) => {
                        e.preventDefault();
                        if (validate(true)) {
                            const finalInput = { ...model };
                            if (create) {
                                delete finalInput.id;
                            }

                            submit({
                                variables: {
                                    input: finalInput,
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
                                            name: 'name',
                                            label: 'Role Name',
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
                                    <Form.TextArea
                                        {...getFieldProps({
                                            name: 'description',
                                            label: 'Description',
                                        })}
                                        width={8}
                                    />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Button
                                        basic
                                        floated="right"
                                        width={15}
                                        onClick={e => {
                                            e.preventDefault();
                                            history.goBack();
                                        }}
                                    >
                                        Cancel
                                    </Form.Button>
                                    <Form.Button
                                        width={2}
                                        type="submit"
                                        floated="right"
                                        loading={loading}
                                        fluid
                                        disabled={hasErrors}
                                        primary
                                    >
                                        Submit
                                    </Form.Button>
                                </Form.Group>
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
                            {data && update && (
                                <SuccessMessage attached="bottom" />
                            )}
                            {data && create && (
                                <SuccessMessage
                                    attached="bottom"
                                    redirectTo="/roles"
                                    message="Successfully created role"
                                />
                            )}
                        </div>
                    );
                }}
            </m.Mutation>
        );
    }
);

ModelForm.propTypes = m.ComponentPropTypes;
export default ModelForm;
