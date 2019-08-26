import React from 'react';
import { Form } from 'semantic-ui-react';

const SubmitButton: React.FC<Props> = ({ isCreate, loading, hasErrors }) => (
    <Form.Button
        className="submit"
        type="submit"
        loading={loading}
        disabled={hasErrors}
        primary
    >
        {isCreate ? 'Create' : 'Save'}
    </Form.Button>
);

type Props = {
    isCreate: boolean;
    loading?: boolean;
    hasErrors?: boolean;
};

export default SubmitButton;
