import React from 'react';
import { Grid } from 'semantic-ui-react';

const ButtonRow: React.FC = ({ children }) => (
    <Grid.Column
        mobile={16}
        tablet={16}
        computer={16}
        widescreen={15}
        className="recordFormButtonRow"
    >
        <div className="recordFormButtons">{children}</div>
    </Grid.Column>
);

export default ButtonRow;
