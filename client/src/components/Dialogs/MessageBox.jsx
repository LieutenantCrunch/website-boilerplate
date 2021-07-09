// Based on: https://alexandrempsantos.com/draft__solve-modals-with-context-and-hooks/
import React, { useContext } from 'react';
import { MessageBoxStateContext, MessageBoxUpdaterContext } from '../../contexts/withMessageBox';

// Material UI
import { makeStyles } from '@material-ui/styles';

// Material UI Components
import MuiDialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import CloseRoundedIcon from '@material-ui/icons/CloseRounded';

export const MESSAGE_BOX_TYPES = Object.freeze({
    OK: 0,
    YES_NO: 1,
    YES_NO_CANCEL: 2,
    NO_YES: 3
});

const useStyles = makeStyles(() => ({
    title: {
        padding: '.5em'
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: 0
    }
}));

const MessageBox = () => {
    const classes = useStyles();

    const {
        isOpen,
        messageBoxProps: {
            actions,
            caption,
            message,
            onConfirm,
            onDeny,
            onCancel,
            subtext
        }
    } = useContext(MessageBoxStateContext);

    const setMessageBoxOptions = useContext(MessageBoxUpdaterContext);
    const hideMessageBox = () => {
        setMessageBoxOptions({ isOpen: false });
    };

    const getActions = () => {
        switch (actions) {
            case MESSAGE_BOX_TYPES.YES_NO:
                return (
                    <>
                        <button type="button" className="btn btn-primary" autoFocus onClick={e => { hideMessageBox(); onConfirm(); }}>Yes</button>
                        <button type="button" className="btn btn-secondary" onClick={e => { hideMessageBox(); onDeny(); }}>No</button>
                    </>
                );
            case MESSAGE_BOX_TYPES.NO_YES:
                return (
                    <>
                        <button type="button" className="btn btn-secondary" autoFocus onClick={e => { hideMessageBox(); onDeny(); }}>No</button>
                        <button type="button" className="btn btn-primary" onClick={e => { hideMessageBox(); onConfirm(); }}>Yes</button>
                    </>
                );
            case MESSAGE_BOX_TYPES.YES_NO_CANCEL:
                return (
                    <>
                        <button type="button" className="btn btn-primary" autoFocus onClick={e => { hideMessageBox(); onConfirm(); }}>Yes</button>
                        <button type="button" className="btn btn-secondary" onClick={e => { hideMessageBox(); onDeny(); }}>No</button>
                        <button type="button" className="btn btn-secondary" onClick={e => { hideMessageBox(); onCancel(); }}>Cancel</button>
                    </>
                );
            case MESSAGE_BOX_TYPES.OK:
            default:
                return (
                    <button type="button" className="btn btn-primary" autoFocus onClick={e => { hideMessageBox(); onConfirm(); }}>OK</button>
                );
        }
    };

    return (
        <MuiDialog onClose={onCancel} open={isOpen} aria-labelledby='message-box-title'>
            <MuiDialogTitle id="message-box-title" className={classes.title}>
                <Typography variant="h6" component="span">{caption}</Typography>
                {
                    onCancel && 
                    <IconButton aria-label="close" className={classes.closeButton} onClick={onCancel}>
                        <CloseRoundedIcon />
                    </IconButton>
                }
            </MuiDialogTitle>
            <MuiDialogContent dividers>
                <Typography>{message}</Typography>
                {
                    subtext &&
                    <Typography variant="caption">{subtext}</Typography>
                }
            </MuiDialogContent>
            <MuiDialogActions>
                {getActions()}
            </MuiDialogActions>
        </MuiDialog>
    );
};

export default MessageBox;
