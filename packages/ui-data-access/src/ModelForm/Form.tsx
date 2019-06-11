import React, { FormEvent, useState, ReactElement } from 'react';
import { AnyObject, get, isFunction, uniq } from '@terascope/utils';
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
import {
    validateClientId,
    prepareForMutation,
    validateName,
    fixClientId,
} from './utils';

function Form<T extends AnyModel>({
    id,
    input: _model,
    children,
    history,
    modelName,
    validate: _validate,
    beforeSubmit,
    afterChange,
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

    const validate = (latestModel: T, isSubmit = false): boolean => {
        const errs: ErrorsState<T> = {
            fields: [],
            messages: [],
        };

        validateName(errs, latestModel);
        validateClientId(errs, latestModel);

        if (isFunction(_validate)) {
            _validate(errs, latestModel, isSubmit);
        }

        if (isSubmit) {
            let missingRequired = false;

            required.forEach(_field => {
                const field = _field as keyof T;
                const val = get(model, field);
                if (!val && !['0', 0].includes(val as any)) {
                    missingRequired = true;
                    errs.fields.push(field);
                }
            });

            if (missingRequired) {
                errs.messages.push('Please complete missing fields');
            }
        }

        errs.fields = uniq(errs.fields);
        errs.messages = uniq(errs.messages);
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
            setModel(latestModel => {
                Object.assign(latestModel, { [name]: value });
                fixClientId(latestModel);
                isFunction(afterChange) && afterChange(latestModel);
                validate(latestModel);
                return { ...latestModel };
            });
        },
    };

    const hasErrors = errors.messages.length > 0;

    return (
        <Mutation id={id} modelName={modelName}>
            {(submit, { data, loading, error }: any) => {
                const onSubmit = (e: FormEvent) => {
                    e.preventDefault();
                    if (validate(model, true)) {
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
                            error={hasErrors}
                            success={!hasErrors}
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
                                                width={15}
                                                type="button"
                                                floated="right"
                                                onClick={e => {
                                                    e.preventDefault();
                                                    history.goBack();
                                                }}
                                            >
                                                Cancel
                                            </UIForm.Button>
                                            <UIForm.Button
                                                fluid
                                                width={2}
                                                type="submit"
                                                floated="right"
                                                loading={loading}
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
