import React from 'react';
import PropTypes from 'prop-types';
import Form from './Form';
import Query from './Query';

const RoleForm: React.FC<Props> = ({ id }) => {
    return <Query component={Form} id={id} />;
};

type Props = {
    id?: string;
};

RoleForm.propTypes = {
    id: PropTypes.string,
};

export default RoleForm;
