import React, { useEffect } from 'react';
import classNames from 'classnames';
import scrollIntoView from 'scroll-into-view-if-needed';

import { adjustGUIDDashes } from '../utilities/TextUtilities';

// Material UI
import { Avatar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

// Material UI Styles
const useStyles = makeStyles(() => ({
    comment: {
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '6px',
        display: 'flex',
        fontSize: '.75em',
        flexWrap: 'wrap',
        margin: '.25em 0',
        padding: '.25em'
    },
    parentCommentHeader: {
        borderBottom: '1px solid rgba(0, 0, 0, 0.5)',
        fontSize: '.75em',
        opacity: .6,
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap',
        width: '100%',
        '&::before': {
            content: '\'↱\'' /* The content has to be wrapped in quotes in order for it to be considered a string */
        }
    },
    parentCommenter: {
        fontWeight: 'bold'
    },
    commentContent: {
        display: 'flex',
        width: '100%'
    },
    commentContentLeft: {
        flexGrow: 0
    },
    commentContentRight: {
        flexGrow: 1
    },
    commenterPfp: {
        padding: '.5em'
    },
    commenter: {
        
    },
    commentText: {

    },
    commentActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%'
    },
    notAvailable: {
        backgroundColor: 'rgba(0,0,0,.1)'
    }
}));

export const PostComment = ({ comment, takeFocus, handleReplyClick }) => {
    const classes = useStyles();
    const posterNA = comment.postedBy.displayName === '';
    const parentPosterNA = comment.parentComment && comment.parentComment.postedBy.displayName === '';
    const commentId = adjustGUIDDashes(comment.uniqueId);

    useEffect(() => {
        if (takeFocus) {
            let focusEl = document.getElementById(commentId);

            if (focusEl) {
                scrollIntoView(focusEl, { block: 'start', scrollMode: 'if-needed'});
            }
        }
    }, []);

    return <li key={comment.uniqueId} id={commentId}>
        <div className={classes.comment}>
            {
                comment.parentComment &&
                <div className={classNames(classes.parentCommentHeader, {[classes.notAvailable]: parentPosterNA})}>
                    <span className={classes.parentCommenter}>
                        {comment.parentComment.postedBy.displayName}
                        {
                            comment.parentComment.postedBy.displayNameIndex !== 0 &&
                            `#${comment.parentComment.postedBy.displayNameIndex}`
                        }
                    </span>
                    <span style={{fontStyle: (parentPosterNA ? 'italic' : 'normal')}}>
                        {`${parentPosterNA ? '' : ': '}${comment.parentComment.commentText}`}
                    </span>
                </div>
            }
            <div className={classNames(classes.commentContent, {[classes.notAvailable]: posterNA})}>
                <div className={classes.commentContentLeft}>
                    <div className={classes.commenterPfp}>
                        <Avatar alt={`${comment.postedBy.displayName}#${comment.postedBy.displayNameIndex}`} src={comment.postedBy.pfpSmall} style={{border: '1px solid rgba(0, 0, 0, 0.08)', height: '1.5em', width: '1.5em'}} />
                    </div>
                </div>
                <div className={classes.commentContentRight}>
                    <div className={classes.commenter}>
                        <a href={`/u/${comment.postedBy.profileName}`}>
                            {comment.postedBy.displayName}
                            {
                                comment.postedBy.displayNameIndex !== 0 &&
                                <small>#{comment.postedBy.displayNameIndex}</small>
                            }
                        </a>
                    </div>
                    <div className={classes.commentText} style={{fontStyle: (posterNA ? 'italic' : 'normal')}}>
                        {comment.commentText}
                    </div>
                </div>
            </div>
            {
                !posterNA &&
                <div className={classes.commentActions}>
                    <div>
                        <button className="btn btn-sm btn-link me-0 p-0" type="button" onClick={(e) => handleReplyClick(e, comment)}>Reply</button>
                    </div>
                </div>
            }
        </div>
    </li>;
};
