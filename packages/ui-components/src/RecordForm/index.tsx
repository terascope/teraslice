import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Grid, FormProps } from 'semantic-ui-react';
import SuccessMessage from '../SuccessMessage';
import ConfirmDelete from './ConfirmDelete';
import ErrorMessage from '../ErrorMessage';
import CancelButton from './CancelButton';

const RecordForm: React.FC<Props> = ({
    requestError,
    validationErrors = [],
    loading,
    recordType,
    children,
    onSubmit,
    updated,
    created,
    redirectPath,
    deletable,
    deleteRecord,
}) => {
    const hasErrors = validationErrors.length > 0;
    const [actionState, setActionState] = useState<ActionState>({});

    return (
        <React.Fragment>
            <Form
                loading={loading || actionState.loading}
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
                                {deletable && deleteRecord && (
                                    <ConfirmDelete
                                        recordType={recordType}
                                        onConfirm={async () => {
                                            if (actionState.loading) return;

                                            setActionState({
                                                loading: true,
                                            });

                                            try {
                                                await deleteRecord();

                                                setActionState({
                                                    loading: false,
                                                    success: true,
                                                });
                                            } catch (err) {
                                                setActionState({
                                                    loading: false,
                                                    error: true,
                                                    message: err,
                                                });
                                            }
                                        }}
                                    />
                                )}
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
            {updated && <SuccessMessage attached="bottom" />}
            {created && (
                <SuccessMessage
                    attached="bottom"
                    redirectTo={redirectPath}
                    message={`Successfully created ${recordType}`}
                />
            )}
            {actionState.success && (
                <SuccessMessage
                    attached="bottom"
                    redirectTo={redirectPath}
                    message={`Successfully deleted ${recordType}`}
                />
            )}
            {actionState.error && (
                <ErrorMessage attached="bottom" error={actionState.message} />
            )}
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
        </React.Fragment>
    );
};

type Props = {
    recordType: string;
    redirectPath: string;
    onSubmit: (event: React.FormEvent, data: FormProps) => void;
    deletable?: boolean;
    deleteRecord?: () => Promise<void> | void;
    requestError?: any;
    validationErrors?: string[];
    loading?: boolean;
    updated?: boolean;
    created?: boolean;
};

RecordForm.propTypes = {
    recordType: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    redirectPath: PropTypes.string.isRequired,
    validationErrors: PropTypes.arrayOf(PropTypes.string.isRequired),
    deletable: PropTypes.bool,
    deleteRecord: PropTypes.func,
    requestError: PropTypes.any,
    loading: PropTypes.bool,
    updated: PropTypes.bool,
    created: PropTypes.bool,
};

type ActionState = {
    loading?: boolean;
    message?: string;
    success?: boolean;
    error?: boolean;
};

export default RecordForm;
