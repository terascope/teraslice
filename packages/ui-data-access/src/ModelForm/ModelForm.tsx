import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { Segment } from 'semantic-ui-react';
import {
    ErrorPage,
    LoadingPage,
    useCoreContext,
} from '@terascope/ui-components';
import { getModelConfig } from '../config';
import { ModelNameProp } from '../interfaces';
import * as i from './interfaces';
import Form from './Form';

function ModelForm<T extends i.AnyModel>({
    id,
    children,
    modelName,
    ...passThroughProps
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
            {({ loading, error, data, client }) => {
                if (loading) return <LoadingPage />;
                if (error) return <ErrorPage error={error} />;

                const props = config.handleFormProps(authUser, data || {});

                return (
                    <Segment basic>
                        <Form<T>
                            client={client}
                            {...passThroughProps}
                            {...props}
                            modelName={modelName}
                            id={id}
                        >
                            {children}
                        </Form>
                    </Segment>
                );
            }}
        </Query>
    );
}

type Props<T> = i.ComponentProps<T> & {
    children: i.FormChild<T>;
};

ModelForm.propTypes = {
    id: PropTypes.string,
    modelName: ModelNameProp.isRequired,
};

export default ModelForm;

interface Vars {
    id?: string;
}
