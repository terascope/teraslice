import React from 'react';
import { Loader, Segment, Dimmer } from 'semantic-ui-react';

const Loading: React.FC = () => {
    return (
        <Segment>
            <Dimmer active inverted>
                <Loader>Loading...</Loader>
            </Dimmer>
        </Segment>
    );
};

export default Loading;
