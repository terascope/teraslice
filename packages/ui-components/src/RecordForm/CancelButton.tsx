import React from 'react';
import { Form } from 'semantic-ui-react';
import { tsWithRouter } from '../utils';

const CancelButton = tsWithRouter(({ history }) => (
    <Form.Button
        basic
        type="button"
        onClick={e => {
            e.preventDefault();
            history.goBack();
        }}
    >
        Cancel
    </Form.Button>
));

export default CancelButton;
