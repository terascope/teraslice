import React from 'react';
import PropTypes from 'prop-types';
import ModelForm from './Form';
import Query from './Query';

const Form: React.FC<Props> = ({ id }) => {
    return <Query component={ModelForm} id={id} />;
};

type Props = {
    id?: string;
};

Form.propTypes = {
    id: PropTypes.string,
};

export default Form;
