import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { Segment } from 'semantic-ui-react';
import * as i from './interfaces';
import {
    ErrorPage,
    LoadingPage,
    useCoreContext,
} from '@terascope/ui-components';
import { ModelName } from '@terascope/data-access';
import { getModelConfig } from '../config';
import { ModelNameProp } from '../interfaces';
import Form from './Form';

function FormQuery<T extends i.AnyModel>({
    id,
    children,
    modelName,
    validate,
    beforeSubmit,
}: Props<T>): ReactElement {
    const config = getModelConfig(modelName);
    let query: any;
    let skip: boolean = false;
    let variables: Vars | undefined;

    if (id) {
        variables = { id };
        query = config.updateQuery;
    } else if (config.createQuery) {
        query = config.createQuery;
    } else {
        query = config.updateQuery;
        skip = true;
    }

    const authUser = useCoreContext().authUser!;

    return (
        <Query<any, Vars> query={query} variables={variables} skip={skip}>
            {({ loading, error, data }) => {
                if (loading) return <LoadingPage />;
                if (error) return <ErrorPage error={error} />;

                const props = config.handleFormProps(authUser, data || {});

                return (
                    <Segment basic>
                        <Form<T>
                            {...props}
                            modelName={modelName}
                            id={id}
                            validate={validate}
                            beforeSubmit={beforeSubmit}
                        >
                            {children}
                        </Form>
                    </Segment>
                );
            }}
        </Query>
    );
}

type Props<T> = {
    id?: string;
    modelName: ModelName;
    validate: i.ValidateFn<T>;
    beforeSubmit?: i.BeforeSubmitFn<T>;
    children: i.FormChild<T>;
};

FormQuery.propTypes = {
    id: PropTypes.string,
    modelName: ModelNameProp.isRequired,
    validate: PropTypes.func.isRequired,
    beforeSubmit: PropTypes.func,
};

export default FormQuery;

interface Vars {
    id?: string;
}
