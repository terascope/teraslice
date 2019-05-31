import React from 'react';
import PropTypes from 'prop-types';
import { useCoreContext } from '@terascope/ui-components';
import { AnyModel, DefaultInputProps } from './interfaces';
import { FormInputProps } from 'semantic-ui-react';
import FormInput from './FormInput';

function ClientID<T extends AnyModel>({
    client_id,
    ...props
}: Props & DefaultInputProps<T>): React.ReactElement {
    const authUser = useCoreContext().authUser!;
    return (
        <React.Fragment>
            {authUser.type === 'SUPERADMIN' && (
                <FormInput<T>
                    {...props}
                    value={`${client_id}`}
                    name="client_id"
                    label="Client ID"
                />
            )}
        </React.Fragment>
    );
}

type Props = {
    client_id: number;
} & FormInputProps;

ClientID.propTypes = {
    client_id: PropTypes.number.isRequired,
};

export default ClientID;
