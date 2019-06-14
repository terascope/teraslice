import React, { useState } from 'react';
import { Modal, Button, Header, Icon } from 'semantic-ui-react';

const ConfirmExport: React.FC<Props> = ({
    children,
    numSelected,
    onConfirm,
}) => {
    const [open, setOpen] = useState(false);

    return (
        <Modal
            trigger={children}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            open={open}
            size="tiny"
        >
            <Header icon="download" content="Export records" />
            <Modal.Content>
                <p>Are you sure you want to export {numSelected} records</p>
            </Modal.Content>
            <Modal.Actions>
                <Button basic onClick={() => setOpen(false)}>
                    Cancel
                </Button>
                <Button
                    color="blue"
                    onClick={() => {
                        setOpen(false);
                        onConfirm();
                    }}
                >
                    <Icon name="check" /> Yes
                </Button>
            </Modal.Actions>
        </Modal>
    );
};

type Props = {
    numSelected: number;
    onConfirm: () => void;
};

export default ConfirmExport;
