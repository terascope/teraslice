import React from 'react';
import PropTypes from 'prop-types';
import { Form, Grid, FormProps } from 'semantic-ui-react';
import ErrorMessage from './ErrorMessage';
import SuccessMessage from './SuccessMessage';
import { tsWithRouter } from './utils';

const RecordForm: React.FC<Props> = ({
    requestError,
    validationErrors = [],
    loading,
    recordType,
    children,
    onSubmit,
    updated,
    created,
    createRedirectPath,
}) => {
    const hasErrors = validationErrors.length > 0;

    return (
        <React.Fragment>
            <Form
                loading={loading}
                onSubmit={onSubmit}
                error={hasErrors}
                success={!hasErrors}
                widths="equal"
            >
                <Grid columns={2}>
                    <Grid.Row>
                        <Grid.Column
                            mobile={16}
                            tablet={16}
                            computer={14}
                            widescreen={10}
                        >
                            {children}
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row columns={1}>
                        <Grid.Column stretched>
                            <Form.Group>
                                <CancelButton />
                                <Form.Button
                                    fluid
                                    width={2}
                                    type="submit"
                                    floated="right"
                                    loading={loading}
                                    disabled={hasErrors}
                                    primary
                                >
                                    Submit
                                </Form.Button>
                            </Form.Group>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Form>
            {requestError && (
                <ErrorMessage
                    title="Request Error"
                    error={requestError}
                    attached="bottom"
                />
            )}
            {hasErrors && (
                <ErrorMessage error={validationErrors} attached="bottom" />
            )}
            {updated && <SuccessMessage attached="bottom" />}
            {created && (
                <SuccessMessage
                    attached="bottom"
                    redirectTo={createRedirectPath}
                    message={`Successfully created ${recordType}`}
                />
            )}
        </React.Fragment>
    );
};

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

type Props = {
    recordType: string;
    createRedirectPath: string;
    onSubmit: (event: React.FormEvent, data: FormProps) => void;
    requestError?: any;
    validationErrors?: string[];
    loading?: boolean;
    updated?: boolean;
    created?: boolean;
};

RecordForm.propTypes = {
    recordType: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    createRedirectPath: PropTypes.string.isRequired,
    validationErrors: PropTypes.arrayOf(PropTypes.string.isRequired),
    requestError: PropTypes.any,
    loading: PropTypes.bool,
    updated: PropTypes.bool,
    created: PropTypes.bool,
};

export default RecordForm;
