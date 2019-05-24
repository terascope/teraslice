import React from 'react';
import ModelList from '../ModelList';
import config from './config';

const List: React.FC = () => {
    return <ModelList modelName={config.name} />;
};

export default List;
