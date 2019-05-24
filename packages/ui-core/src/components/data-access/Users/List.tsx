import React from 'react';
import config from './config';
import ModelList from '../ModelList';

const List: React.FC = () => {
    return <ModelList modelName={config.name} />;
};

export default List;
