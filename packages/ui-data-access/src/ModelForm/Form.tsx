import React, { FormEvent, useState, ReactElement } from 'react';
import { AnyObject, get, isFunction, uniq } from '@terascope/utils';
import {
    RecordForm,
    useCoreContext,
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
    modelName,
    validate: _validate,
    beforeSubmit,
    afterChange,
    ...props
}: ComponentProps<T>): ReactElement {
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
                    <RecordForm
                        onSubmit={onSubmit}
                        loading={loading}
                        requestError={error}
                        validationErrors={errors.messages}
                        recordType={config.singularLabel}
                        created={data && create}
                        updated={data && update}
                        createRedirectPath={`/${config.pathname}`}
                    >
                        {children({
                            ...props,
                            model,
                            defaultInputProps,
                            updateModel,
                            update,
                        })}
                    </RecordForm>
                );
            }}
        </Mutation>
    );
}

Form.propTypes = ComponentPropTypes;
export default tsWithRouter(Form) as ReturnType<Form>;
