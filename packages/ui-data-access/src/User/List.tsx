import React from 'react';
import config from './config';
import ModelList from '../ModelList';

const List: React.FC = () => <ModelList modelName={config.name} />;

export default List;
