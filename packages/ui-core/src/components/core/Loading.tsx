import React from 'react';
import { Loader, Segment } from 'semantic-ui-react';

const Loading: React.FC = () => {
    return (
        <Segment>
            <Loader inverted content="Loading" />
        </Segment>
    );
};

export default Loading;
