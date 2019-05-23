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

const FormQuery: React.FC<Props> = ({ component: Component, id, model }) => {
    const config = getModelConfig(model);
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

                const props = config.handleFormProps(authUser, data);

                return (
                    <Segment basic>
                        <Component {...props} id={id} />
                    </Segment>
                );
            }}
        </FetchQuery>
    );
};

type Props = {
    id?: string;
    model: ModelName;
    component: React.FunctionComponent<i.ComponentProps>;
};

FormQuery.propTypes = {
    component: PropTypes.func.isRequired,
    id: PropTypes.string,
};

export default FormQuery;

interface Vars {
    id?: string;
}

class FetchQuery extends Query<any, Vars> {}
