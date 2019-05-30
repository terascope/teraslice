import React from 'react';
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

const FormQuery: React.FC<Props> = ({
    id,
    children,
    modelName,
    validate,
    beforeSubmit,
}) => {
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
        <FetchQuery query={query} variables={variables} skip={skip}>
            {({ loading, error, data }) => {
                if (loading) return <LoadingPage />;
                if (error) return <ErrorPage error={error} />;

                const props = config.handleFormProps(authUser, data || {});

                return (
                    <Segment basic>
                        <Form
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
        </FetchQuery>
    );
};

type Props = {
    id?: string;
    modelName: ModelName;
    validate: i.ValidateFn;
    beforeSubmit: i.BeforeSubmitFn;
    children: i.FormChild;
};

FormQuery.propTypes = {
    id: PropTypes.string,
    modelName: ModelNameProp.isRequired,
    validate: PropTypes.func.isRequired,
    beforeSubmit: PropTypes.func.isRequired,
};

export default FormQuery;

interface Vars {
    id?: string;
}

class FetchQuery extends Query<any, Vars> {}
