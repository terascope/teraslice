import gql from 'graphql-tag';
import { User } from '@terascope/data-access';
import { ChildDataProps, graphql } from 'react-apollo';

const LIST_USERS = gql`
  query ListUsers($query: String) {
    users(query: $query) {
        id,
        username,
        firstname,
        lastname,
        email
    }
  }
`;

type Response = {
    users: [User],
};

type InputProps = {
    query?: string;
};

type Variables = {
    query?: string;
};

type ChildProps = ChildDataProps<InputProps, Response & {
    loading: boolean,
    error: any,
}>;

export const withUsers = graphql<InputProps, Response, Variables, ChildProps>(LIST_USERS, {
    // @ts-ignore
    props({ data }) {
        return { ...data };
    }
});
