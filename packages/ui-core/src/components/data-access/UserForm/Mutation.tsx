import React from 'react';
import gql from 'graphql-tag';
import { AnyObject, get } from '@terascope/utils';
import { Mutation, MutationFn, MutationResult } from 'react-apollo';
import { ResolvedUser } from '../../core';

const CREATE_USER = gql`
    mutation User($user: UserInput!, $password: String!) {
        createUser(user: $user, password: $password) {
            id
            username
            type
        }
    }
`;

const UPDATE_USER = gql`
    mutation User($user: UserInput!, $password: String) {
        updateUser(user: $user) {
            id
            username
            type
        }
    }
`;

type QueryResponse = {
    updateUser?: ResolvedUser;
    createUser?: ResolvedUser;
};

type Response = {
    user: ResolvedUser;
};

type QueryVariables = {
    user: AnyObject;
    password?: string;
};

class UserMutationQuery extends Mutation<QueryResponse, QueryVariables> {}

type Children = (
    submit: MutationFn<Response, QueryVariables>,
    result: MutationResult<Response>
) => React.ReactNode;

type MutationProps = { id?: string; children: Children };

const UserMutation: React.FC<MutationProps> = ({ id, children }) => {
    return (
        <UserMutationQuery mutation={id ? UPDATE_USER : CREATE_USER}>
            {(updateUser, result) => {
                const user = get(
                    result,
                    'data.createUser',
                    get(result, 'data.updateUser')
                );

                const queryResult: any = result;
                queryResult.data = { user };

                return children((input: any) => {
                    return updateUser(input);
                }, queryResult);
            }}
        </UserMutationQuery>
    );
};

export default UserMutation;
