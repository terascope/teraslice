import React from 'react';
import ModelList from '../ModelList';
import config from './config';

const List: React.FC = () => <ModelList modelName={config.name} />;

export default List;
