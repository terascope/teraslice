import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { get } from '@terascope/utils';
import { Role } from '@terascope/data-access';
import { Segment } from 'semantic-ui-react';
import * as i from './interfaces';
import * as m from '../../ModelForm';
import {
    ErrorPage,
    LoadingPage,
    useCoreContext,
    ResolvedUser,
} from '../../../core';

const FormQuery: React.FC<Props> = ({ component: Component, id }) => {
    const authUser = useCoreContext().authUser!;

    return (
        <FetchQuery query={WITH_ID_QUERY} variables={{ id }} skip={!id}>
            {({ loading, error, data }) => {
                if (loading) return <LoadingPage />;
                if (error) return <ErrorPage error={error} />;

                const input = getInput(authUser, data);

                return (
                    <Segment basic>
                        <Component input={input} id={id} />
                    </Segment>
                );
            }}
        </FetchQuery>
    );
};

function getInput(authUser: ResolvedUser, data: any): i.Input {
    const role = get(data, 'role');
    const input = {} as i.Input;
    for (const field of i.inputFields) {
        input[field] = get(role, field) || '';
    }
    if (!input.client_id && authUser.client_id) {
        input.client_id = authUser.client_id;
    }
    return input;
}

type Props = {
    id?: string;
    component: React.FunctionComponent<m.ComponentProps<i.Input>>;
};

FormQuery.propTypes = {
    component: PropTypes.func.isRequired,
    id: PropTypes.string,
};

export default FormQuery;

export const WITH_ID_QUERY = gql`
    query Role($id: ID!) {
        role(id: $id) {
            id
            name
            description
            client_id
        }
    }
`;

interface Response {
    role: Role;
}

interface Variables {
    id?: string;
}

class FetchQuery extends Query<Response, Variables> {}
