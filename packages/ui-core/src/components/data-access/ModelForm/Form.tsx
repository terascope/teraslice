import React, { FormEvent, useState } from 'react';
import { AnyObject } from '@terascope/utils';
import { Form } from 'semantic-ui-react';
import {
    SuccessMessage,
    ErrorMessage,
    useCoreContext,
    tsWithRouter,
} from '@terascope/ui-components';
import { getModelConfig } from '../config';
import { getFieldPropsFn } from './utils';
import { ErrorsState, ComponentProps, ComponentPropTypes } from './interfaces';
import Mutation from './Mutation';

const ModelForm = tsWithRouter<ComponentProps>(
    ({
        id,
        input,
        children,
        history,
        modelName,
        validate: _validate,
        beforeSubmit,
        ...props
    }) => {
        const config = getModelConfig(modelName);
        const authUser = useCoreContext().authUser!;
        const update = Boolean(id);
        const create = !update;

        const [model, setModel] = useState<AnyObject>(input);

        const [errors, setErrors] = useState<ErrorsState>({
            fields: [],
            messages: [],
        });

        const required: string[] = [...config.requiredFields];
        if (authUser.type === 'SUPERADMIN') {
            required.push('client_id');
        }

        const validate = (isSubmit = false): boolean => {
            const errs = _validate(
                {
                    fields: [],
                    messages: [],
                },
                model,
                isSubmit
            );

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

        const getFieldProps = getFieldPropsFn({
            model,
            setModel,
            validate,
            required,
            errors,
        });

        const hasErrors = errors.messages.length > 0;

        return (
            <Mutation id={id} modelName={modelName}>
                {(submit, { data, loading, error }: any) => {
                    const onSubmit = (e: FormEvent) => {
                        e.preventDefault();
                        if (validate(true)) {
                            submit({
                                variables: beforeSubmit(model, create),
                            });
                        }
                    };

                    return (
                        <div>
                            <Form loading={loading} onSubmit={onSubmit}>
                                {children({
                                    ...props,
                                    model,
                                    getFieldProps,
                                    setModel,
                                    update,
                                })}
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
                                    redirectTo={`/${config.pathname}`}
                                    message={`Successfully created ${
                                        config.singularLabel
                                    }`}
                                />
                            )}
                        </div>
                    );
                }}
            </Mutation>
        );
    }
);

ModelForm.propTypes = ComponentPropTypes;
export default ModelForm;
