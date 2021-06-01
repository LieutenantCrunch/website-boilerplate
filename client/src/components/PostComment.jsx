import React, { useEffect } from 'react';
import classNames from 'classnames';
import scrollIntoView from 'scroll-into-view-if-needed';

import PostService from '../services/post.service';

import { adjustGUIDDashes } from '../utilities/TextUtilities';

// Material UI
import { Avatar } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';

// Material UI Icons
import DeleteOutlineRoundedIcon from '@material-ui/icons/DeleteOutlineRounded';

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
    commentContentMiddle: {
        flexGrow: 1
    },
    commentContentRight: {
        flexGrow: 0
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

export const PostComment = ({ comment, takeFocus, handleReplyClick, deleteCommentCB }) => {
    const classes = useStyles();
    const { canDelete, parentComment, postedBy, uniqueId } = comment;
    const posterNA = postedBy.displayName === '';
    const parentPosterNA = parentComment && parentComment.postedBy.displayName === '';
    const commentId = adjustGUIDDashes(uniqueId);

    useEffect(() => {
        if (takeFocus) {
            let focusEl = document.getElementById(commentId);

            if (focusEl) {
                scrollIntoView(focusEl, { block: 'start', scrollMode: 'if-needed'});
            }
        }
    }, []);

    const handleDeleteClick = (e) => {
        if (confirm('Do you want to delete this comment?')) {
            deleteComment();
        }
    };

    const deleteComment = async () => {
        if (await PostService.deletePostComment(uniqueId)) {
            if (deleteCommentCB) {
                deleteCommentCB(uniqueId);
            }
        }
    };

    return <li key={commentId} id={commentId}>
        <div className={classes.comment}>
            {
                parentComment &&
                <div className={classNames(classes.parentCommentHeader, {[classes.notAvailable]: parentPosterNA})}>
                    <span className={classes.parentCommenter}>
                        {parentComment.postedBy.displayName}
                        {
                            parentComment.postedBy.displayNameIndex !== 0 &&
                            `#${parentComment.postedBy.displayNameIndex}`
                        }
                    </span>
                    <span style={{fontStyle: (parentPosterNA ? 'italic' : 'normal')}}>
                        {`${parentPosterNA ? '' : ': '}${parentComment.commentText}`}
                    </span>
                </div>
            }
            <div className={classNames(classes.commentContent, {[classes.notAvailable]: posterNA})}>
                <div className={classes.commentContentLeft}>
                    <div className={classes.commenterPfp}>
                        <Avatar alt={`${postedBy.displayName}#${postedBy.displayNameIndex}`} src={postedBy.pfpSmall} style={{border: '1px solid rgba(0, 0, 0, 0.08)', height: '1.5em', width: '1.5em'}} />
                    </div>
                </div>
                <div className={classes.commentContentMiddle}>
                    <div className={classes.commenter}>
                        <a href={`/u/${postedBy.profileName}`}>
                            {postedBy.displayName}
                            {
                                postedBy.displayNameIndex !== 0 &&
                                <small>#{postedBy.displayNameIndex}</small>
                            }
                        </a>
                    </div>
                    <div className={classes.commentText} style={{fontStyle: (posterNA ? 'italic' : 'normal')}}>
                        {comment.commentText}
                    </div>
                </div>
                {
                    canDelete &&
                    <div className={classes.commentContentRight}>
                        <IconButton aria-label="Delete Post" size="small" onClick={handleDeleteClick}>
                            <DeleteOutlineRoundedIcon />
                        </IconButton>
                    </div>
                }
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
