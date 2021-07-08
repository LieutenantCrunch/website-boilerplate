import React from 'react';
import classNames from 'classnames';
import * as Constants from '../constants/constants';
import PostService from '../services/post.service';
import { isNullOrWhiteSpaceOnly } from '../utilities/TextUtilities';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { removePostNotifications, selectPostNotificationById } from '../redux/notifications/postsSlice';

// Material UI
import { makeStyles } from '@material-ui/styles';
import ClearRoundedIcon from '@material-ui/icons/ClearRounded';

// Material UI Styles
const useStyles = makeStyles(() => ({
    item: {
        display: 'flex',
        justifyContent: 'end'
    },
    link: {
        flexGrow: 1
    },
    removeButton: {
        color: 'rgba(255,255,255,.25)',
        '&:hover': {
            color: 'rgba(255,255,255,.75)'
        }
    },
    unseen: {
        backgroundColor: 'rgba(0,200,100,0.2)',
        transition: 'all 1s'
    },
    seenOnce: {
        backgroundColor: 'rgba(0,200,100,0.2)',
        transition: 'all 1s'
    },
    unread: {
        backgroundColor: 'rgba(0,100,200,0.2)',
        transition: 'all 1s'
    },
    read: {
        backgroundColor: 'rgba(0,0,0,0)'
    }
}));

export const PostNotification = ({ notificationId }) => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const notification = useSelector(state => selectPostNotificationById(state, notificationId));
    const { commentId, createdOn, message, postId, status, triggeredBy, type, uniqueId } = notification;

    let noCommentId = isNullOrWhiteSpaceOnly(commentId);
    let href = `/view-post?p=${postId}`;
    
    if (!noCommentId) {
        href += `#${commentId}`;
    }

    const getListItemClass = () => {
        switch (status) {
            case Constants.NOTIFICATION_STATUS.UNSEEN:
                return classes.unseen;
            case Constants.NOTIFICATION_STATUS.SEEN_ONCE:
                return classes.seenOnce;
            case Constants.NOTIFICATION_STATUS.UNREAD:
                return classes.unread;
            case Constants.NOTIFICATION_STATUS.READ:
            default:
                return classes.read;
        }
    };

    const getText = () => {
        let totalTriggeredBy = triggeredBy.length;

        if (totalTriggeredBy === 1) {
            return `${triggeredBy[0]} ${message}`;
        }
        else if (totalTriggeredBy == 2) {
            return `${triggeredBy[0]} and ${triggeredBy[1]} ${message}`;
        }
        else if (totalTriggeredBy > 2) {
            return `${triggeredBy[0]}, ${triggeredBy[1]}, and ${totalTriggeredBy - 2} others ${message}`;
        }
        else {
            return message;
        }
    };

    const handleNotificationClick = (e) => {
        if (status !== Constants.NOTIFICATION_STATUS.READ) {
            PostService.markPostNotificationsAsRead(postId, createdOn);
        }
    };

    const handleRemoveNotificationClick = (e) => {
        PostService.removePostNotifications(postId, createdOn);
        dispatch(removePostNotifications(postId));
    };

    return <li className={classNames('nav-item px-1', classes.item, getListItemClass())} >
        <a className={classNames('nav-link text-end', classes.link)} href={href} onClick={handleNotificationClick}>{getText()}</a>
        <button className={classNames('btn btn-sm', classes.removeButton)} type="button" title="Remove all notifications for this post" onClick={handleRemoveNotificationClick}>
            <ClearRoundedIcon />
        </button>
    </li>;
};
