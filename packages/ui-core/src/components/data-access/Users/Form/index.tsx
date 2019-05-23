import React from 'react';
import PropTypes from 'prop-types';
import ModelForm from './Form';
import Query from '../../ModelForm/Query';

const Form: React.FC<Props> = ({ id }) => {
    return <Query model="User" component={ModelForm} id={id} />;
};

type Props = {
    id?: string;
};

Form.propTypes = {
    id: PropTypes.string,
};

export default Form;
