import React from 'react';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import { AnyObject, get } from '@terascope/utils';
import { Mutation, MutationFn, MutationResult } from 'react-apollo';
import { ResolvedUser } from '../../../core';

const CREATE_USER = gql`
    mutation User($user: CreateUserInput!, $password: String!) {
        createUser(user: $user, password: $password) {
            id
            username
            type
        }
    }
`;

const UPDATE_USER = gql`
    mutation User($user: UpdateUserInput!, $password: String) {
        updateUser(user: $user, password: $password) {
            id
            username
            type
        }
    }
`;

type RealResponse = {
    updateUser?: ResolvedUser;
    createUser?: ResolvedUser;
};

type Response = {
    user: ResolvedUser;
};

type Vars = {
    user: AnyObject;
    password?: string;
};

class UserMutationQuery extends Mutation<RealResponse, Vars> {}

type Children = (
    submit: MutationFn<Response, Vars>,
    result: MutationResult<Response>
) => React.ReactNode;

const UserMutation: React.FC<Props> = ({ update, children }) => {
    return (
        <UserMutationQuery mutation={update ? UPDATE_USER : CREATE_USER}>
            {(action, result) => {
                const user = get(
                    result,
                    'data.createUser',
                    get(result, 'data.updateUser')
                );

                const queryResult: any = result;
                if (user) {
                    queryResult.data = { user };
                }

                return children((input: any) => action(input), queryResult);
            }}
        </UserMutationQuery>
    );
};

type Props = { update: boolean; children: Children };

UserMutation.propTypes = {
    update: PropTypes.bool.isRequired,
    children: PropTypes.func.isRequired,
};

export default UserMutation;
