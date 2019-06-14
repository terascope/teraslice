import React from 'react';
import { Form } from 'semantic-ui-react';

const SubmitButton: React.FC<Props> = ({ loading, hasErrors }) => (
    <Form.Button type="submit" loading={loading} disabled={hasErrors} primary>
        Submit
    </Form.Button>
);

type Props = {
    loading?: boolean;
    hasErrors?: boolean;
};

export default SubmitButton;
