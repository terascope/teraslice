import React, { FormEvent, useState, ReactElement } from 'react';
import { AnyObject, get, isFunction } from '@terascope/utils';
import { Form as UIForm, Grid } from 'semantic-ui-react';
import {
    SuccessMessage,
    ErrorMessage,
    useCoreContext,
    PropsWithRouter,
    tsWithRouter,
} from '@terascope/ui-components';
import { getModelConfig } from '../config';
import {
    ErrorsState,
    ComponentPropTypes,
    DefaultInputProps,
    ComponentProps,
    AnyModel,
} from './interfaces';
import Mutation from './FormMutation';
import { validateClientId, prepareForMutation } from './utils';

function Form<T extends AnyModel>({
    id,
    input: _model,
    children,
    history,
    modelName,
    validate: _validate,
    beforeSubmit,
    ...props
}: PropsWithRouter<ComponentProps<T>>): ReactElement {
    const config = getModelConfig(modelName);
    const authUser = useCoreContext().authUser!;
    const update = Boolean(id);
    const create = !update;

    const [model, setModel] = useState<T>(_model);

    const [errors, setErrors] = useState<ErrorsState<T>>({
        fields: [],
        messages: [],
    });

    const required = [...config.requiredFields];
    if (authUser.type === 'SUPERADMIN') {
        required.push('client_id');
    }

    const validate = (isSubmit = false): boolean => {
        let errs: ErrorsState<T> = {
            fields: [],
            messages: [],
        };

        errs = validateClientId(errs, model);

        if (isFunction(_validate)) {
            errs = _validate(errs, model, isSubmit);
        }

        if (isSubmit) {
            let missingRequired = false;

            required.forEach(field => {
                const d = get(model, field);
                if (!d && !(d === '0' || d === 0)) {
                    missingRequired = true;
                    errs.fields.push(field as keyof T);
                }
            });

            if (missingRequired) {
                errs.messages.push('Please complete missing fields');
            }
        }

        setErrors(errs);

        return !errs.messages.length && !errs.fields.length;
    };

    const updateModel = (updates: AnyObject) => {
        setModel({ ...model, ...updates });
    };

    const defaultInputProps: DefaultInputProps<T> = {
        hasError(field) {
            return errors.fields.includes(field);
        },
        isRequired(field) {
            return required.includes(field as any);
        },
        onChange(e, { name, value }) {
            updateModel({
                [name]: value,
            });
            validate();
        },
    };

    const hasErrors = errors.messages.length > 0;

    return (
        <Mutation id={id} modelName={modelName}>
            {(submit, { data, loading, error }: any) => {
                const onSubmit = (e: FormEvent) => {
                    e.preventDefault();
                    if (validate(true)) {
                        const input = prepareForMutation(model);
                        if (create) {
                            delete input.id;
                        }
                        const variables = isFunction(beforeSubmit)
                            ? beforeSubmit(input, create)
                            : { input };
                        submit({
                            variables,
                        });
                    }
                };

                return (
                    <React.Fragment>
                        <UIForm
                            loading={loading}
                            onSubmit={onSubmit}
                            widths="equal"
                        >
                            <Grid columns={2}>
                                <Grid.Row>
                                    <Grid.Column width="10">
                                        {children({
                                            ...props,
                                            model,
                                            defaultInputProps,
                                            updateModel,
                                            update,
                                        })}
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row columns={1}>
                                    <Grid.Column stretched>
                                        <UIForm.Group>
                                            <UIForm.Button
                                                basic
                                                floated="right"
                                                width={15}
                                                onClick={e => {
                                                    e.preventDefault();
                                                    history.goBack();
                                                }}
                                            >
                                                Cancel
                                            </UIForm.Button>
                                            <UIForm.Button
                                                width={2}
                                                type="submit"
                                                floated="right"
                                                loading={loading}
                                                fluid
                                                disabled={hasErrors}
                                                primary
                                            >
                                                Submit
                                            </UIForm.Button>
                                        </UIForm.Group>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </UIForm>
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
                        {data && update && <SuccessMessage attached="bottom" />}
                        {data && create && (
                            <SuccessMessage
                                attached="bottom"
                                redirectTo={`/${config.pathname}`}
                                message={`Successfully created ${
                                    config.singularLabel
                                }`}
                            />
                        )}
                    </React.Fragment>
                );
            }}
        </Mutation>
    );
}

Form.propTypes = ComponentPropTypes;
export default tsWithRouter(Form) as ReturnType<Form>;
