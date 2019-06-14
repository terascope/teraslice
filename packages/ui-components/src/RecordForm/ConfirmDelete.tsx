import React, { useState } from 'react';
import { Modal, Button, Header, Icon, Form } from 'semantic-ui-react';

const ConfirmDelete: React.FC<Props> = ({ recordType, onConfirm }) => {
    const [open, setOpen] = useState(false);

    return (
        <Modal
            trigger={
                <Form.Button
                    basic
                    color="red"
                    type="button"
                    onClick={e => {
                        e.preventDefault();
                        setOpen(true);
                    }}
                >
                    Delete
                </Form.Button>
            }
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            open={open}
            size="tiny"
        >
            <Header icon="trash alternate" content="Delete record" />
            <Modal.Content>
                <p>Are you sure you want to delete {recordType} record</p>
            </Modal.Content>
            <Modal.Actions>
                <Button basic onClick={() => setOpen(false)}>
                    Cancel
                </Button>
                <Button
                    color="red"
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
    recordType: string;
    onConfirm: () => void;
};

export default ConfirmDelete;
