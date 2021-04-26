import React from 'react';

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
    }
}));

export const PostComment = ({comment, handleReplyClick}) => {
    const classes = useStyles();

    return <li key={comment.uniqueId}>
        <div className={classes.comment}>
            {
                comment.parentComment &&
                <div className={classes.parentCommentHeader}>
                    <span className={classes.parentCommenter}>
                        {comment.parentComment.postedBy.displayName}
                        {
                            comment.parentComment.postedBy.displayNameIndex !== 0 &&
                            `#${comment.parentComment.postedBy.displayNameIndex}`
                        }
                    </span>
                    {`: ${comment.parentComment.commentText}`}
                </div>
            }
            <div className={classes.commentContent}>
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
                    <div className={classes.commentText}>
                        {comment.commentText}
                    </div>
                </div>
            </div>
            <div className={classes.commentActions}>
                <div>
                    <button className="btn btn-sm btn-link me-0 p-0" type="button" onClick={(e) => handleReplyClick(e, comment)}>Reply</button>
                </div>
            </div>
        </div>
    </li>;
};
