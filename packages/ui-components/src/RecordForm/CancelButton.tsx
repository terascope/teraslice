import React from 'react';
import { Form } from 'semantic-ui-react';
import { tsWithRouter } from '../utils';

const CancelButton = tsWithRouter(({ history }) => (
    <Form.Button
        basic
        width={15}
        type="button"
        floated="right"
        onClick={e => {
            e.preventDefault();
            history.goBack();
        }}
    >
        Cancel
    </Form.Button>
));

export default CancelButton;
