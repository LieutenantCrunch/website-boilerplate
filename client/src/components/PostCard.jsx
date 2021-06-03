import React, { useContext, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import Lightbox from 'react-image-lightbox';
import * as Constants from '../constants/constants';
import PostService from '../services/post.service';
import { adjustGUIDDashes } from '../utilities/TextUtilities';
import { MESSAGE_BOX_TYPES } from './Dialogs/MessageBox';

// Contexts
import { LoggedInContext } from '../contexts/loggedIn';
import { MessageBoxUpdaterContext } from './../contexts/withMessageBox';

// Material UI
import { Avatar, Card, CardActions, CardContent, CardHeader, Divider } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import MaterialTextfield from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

// Material UI Icons
import CancelTwoToneIcon from '@material-ui/icons/CancelTwoTone';
import DeleteOutlineRoundedIcon from '@material-ui/icons/DeleteOutlineRounded';

// Multimedia Components
import { AudioPlayer } from './Multimedia/AudioPlayer';
import { VideoPlayer } from './Multimedia/VideoPlayer';

// Other Components
import { PostComment } from './PostComment';

// Material UI Styles
const useStyles = makeStyles(() => ({
    imageThumbnail: {
        backgroundColor: 'rgb(230,230,230)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        borderStyle: 'none',
        cursor: 'pointer',
        position: 'relative',
        height: '10vmin',
        width: '48%',
        margin: '1%',
        /* Single Image */
        '&:only-child': {
            width: '100%',
            height: '20vmin',
            borderRadius: '10px 10px 0 0'
        },
        /* Style to apply to the first and second thumbnail when there are 2 thumbnails */
        '&:first-child:nth-last-child(2), &:first-child:nth-last-child(2) + $imageThumbnail': {
            height: '20vmin'
        },
        /* Style to apply to the first thumbnail when there are 2-4 thumbnails */ 
        '&:first-child:nth-last-child(2), &:first-child:nth-last-child(3), &:first-child:nth-last-child(4)': {
            borderRadius: '10px 0 0 0'
        },
        /* Style to apply to the second thumbnail when there are 2-4 thumbnails */
        '&:first-child:nth-last-child(2) + $imageThumbnail, &:first-child:nth-last-child(3) + $imageThumbnail, &:first-child:nth-last-child(4) + $imageThumbnail': {
            borderRadius: '0 10px 0 0'
        }
    },
    previewImages: {
        flexWrap: 'wrap',
        justifyContent: 'space-evenly'
    },
    commentProgress: {
        width: '100%'
    },
    commentList: {
        listStyle: 'none',
        paddingLeft: '.5em',
        width: '100%'
    },
    parentCommentHeader: {
        display: 'flex',
        fontSize: '.75em',
        opacity: .6,
        overflow: 'hidden', 
        position: 'relative',
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
    moreCommentsDiv: {
        textAlign: 'center',
        width: '100%'
    }
}));

export const PostCard = ({ post, fetchDate, focusCommentId, deletePostCB } ) => {
    const MAX_COMMENT_LENGTH = 500;
    const loggedIn = useContext(LoggedInContext);
    const { canDelete, commentCount, commentPage, postedBy, postComments, postFiles, postType, uniqueId } = post;
    const postDate = new Date(post.postedOn);
    const postLinkId = adjustGUIDDashes(uniqueId);
    const setMessageBoxOptions = useContext(MessageBoxUpdaterContext);

    const [state, setState] = useState({
        comments: [],
        commentLimit: 0,
        commentText: '',
        fetchDate: null,
        lightboxOpen: false,
        lightboxIndex: 0,
        pageNumber: 0,
        postedByDisplayName: undefined,
        replyToComment: null,
        total: -1
    });

    const classes = useStyles();
    const commentTextfield = useRef(null);

    useEffect(() => {
        let stateUpdates = {};

        if (fetchDate) {
            stateUpdates.fetchDate = fetchDate;
        }

        if (postComments && postComments.length > 0) {
            stateUpdates.comments = [...postComments];
            stateUpdates.total = commentCount;
        }

        if (commentPage !== undefined) {
            stateUpdates.pageNumber = commentPage;
        }

        if (Object.keys(stateUpdates).length > 0) {
            setState(prevState => ({
                ...prevState,
                ...stateUpdates
            }));
        }
    }, [post]);

    const handleImageClick = (e, index) => {
        if (postType === Constants.POST_TYPES.IMAGE) {
            setState(prevState => ({
                ...prevState,
                lightboxOpen: true,
                lightboxIndex: index
            }));
        }
    };

    const handleCommentChange = (e) => {
        let { value: commentText } = e.target;
        let commentLength = commentText.length;
        let commentLimit = 0;

        if (commentLength <= MAX_COMMENT_LENGTH) {
            commentLimit = Math.floor((commentLength / MAX_COMMENT_LENGTH) * 100);
        }
        else {
            commentLimit = 100;
        }

        setState(prevState => ({
            ...prevState,
            commentText,
            commentLimit
        }));
    };

    const handlePostClick = async (e) => {
        if (state.commentText && state.commentText.length > 0 && state.commentText.length <= MAX_COMMENT_LENGTH) {
            let parentCommentUniqueId = undefined;

            if (state.replyToComment) {
                parentCommentUniqueId = state.replyToComment.uniqueId;
            }

            let newComment = await PostService.createNewPostComment(uniqueId, state.commentText, parentCommentUniqueId);

            if (newComment) {
                let fetchOtherComments = state.fetchDate === null;

                if (fetchOtherComments) {
                    handleViewCommentsClick(e, true);
                }
                else {
                    setState(prevState => ({
                        ...prevState,
                        comments: [
                            newComment,
                            ...prevState.comments
                        ],
                        commentText: '',
                        commentLimit: 0,
                        replyToComment: null
                    }));
                }
            }
        }
    };

    const handleViewCommentsClick = async (e, clearCommentForm) => {
        let fetchDate = Date.now();

        let response = await PostService.getPostComments(uniqueId, 0, fetchDate);

        if (response) {
            if (clearCommentForm) {
                setState(prevState => ({
                    ...prevState,
                    comments: response.comments,
                    commentText: '',
                    commentLimit: 0,
                    fetchDate,
                    replyToComment: null,
                    total: response.total
                }));
            }
            else {
                setState(prevState => ({
                    ...prevState,
                    comments: response.comments,
                    fetchDate,
                    total: response.total
                }));
            }
        }
    };

    const handleReplyClick = (e, replyToComment) => {
        setState(prevState => ({
            ...prevState,
            replyToComment
        }));

        if (commentTextfield.current) {
            commentTextfield.current.focus();
        }
    };

    const handleCancelReply = (e) => {
        setState(prevState => ({
            ...prevState,
            replyToComment: null
        }));
    };

    const handleMoreResultsClick = async (e) => {
        let pageNumber = state.pageNumber + 1;

        PostService.getPostComments(uniqueId, pageNumber, state.fetchDate || Date.now()).then(response => {
            if (response.comments.length > 0) {
                setState(prevState => ({
                    ...prevState,
                    pageNumber,
                    comments: [
                        ...prevState.comments,
                        ...response.comments
                    ]
                }));
            }
        }).catch(err => console.error(err));
    };

    const handleDeleteClick = (e) => {
        setMessageBoxOptions({
            isOpen: true,
            messageBoxProps: {
                actions: MESSAGE_BOX_TYPES.YES_NO,
                caption: 'Delete Post Confirmation',
                message: 'Are you sure you want to delete this post?',
                onConfirm: () => { deletePost(uniqueId) },
                onDeny: () => {},
                onCancel: undefined,
                subtext: 'You will not be able to undo this action.'
            }
        });
    };

    const deletePost = async (postUniqueId) => {
        if (await PostService.deletePost(postUniqueId)) {
            if (deletePostCB) {
                deletePostCB(postUniqueId);
            }
        }
    };

    const getPostedByDisplayName = () => {
        let { postedByDisplayName } = state;

        if (postedByDisplayName) {
            return postedByDisplayName;
        }

        postedByDisplayName = postedBy.displayName;

        if (postedBy.displayNameIndex !== 0) {
            postedByDisplayName += `#${postedBy.displayNameIndex}`;
        }

        setState(prevState => ({
            ...prevState,
            postedByDisplayName
        }));
        
        return postedByDisplayName;
    };

    const getPostFilesSection = () => {
        if (postFiles && postFiles.length > 0) {
            switch (postType) {
            case Constants.POST_TYPES.AUDIO: {
                let thumbnail = postFiles[0].thumbnailFileName || Constants.STATIC_IMAGES.WAVEFORM;

                return <AudioPlayer sourceFile={postFiles[0].fileName} thumbnail={thumbnail} />
            }
            case Constants.POST_TYPES.IMAGE:
                return postFiles.map((postFile, index) => (
                    <div key={postFile.fileName} 
                        className={classes.imageThumbnail} 
                        style={{backgroundImage: `url('${postFile.fileName}')`}}
                        onClick={e => handleImageClick(e, index)}
                    >
                    </div>
                ));
            case Constants.POST_TYPES.VIDEO: {
                let thumbnail = postFiles[0].thumbnailFileName || Constants.STATIC_IMAGES.VID_TEMP_THUMB;

                return <VideoPlayer sourceFile={postFiles[0].fileName} thumbnail={thumbnail} />;
            }
            case Constants.POST_TYPES.TEXT:
            default:
                return <></>;
            }
        }

        return <></>;
    };

    const getCommentProgressColor = () => {
        return state.commentLimit <= 90 ? 'primary' :
            state.commentLimit < 100 ? 'warning' :
            'error';
    };

    const moreCommentsAvailable = () => {
        return state.comments.length < state.total;
    };

    const removeComment = (uniqueId) => {
        let { comments } = state;
        let foundIndex = comments.findIndex(comment => comment.uniqueId === uniqueId);

        if (foundIndex > -1) {
            let newComments = [...comments];

            newComments.splice(foundIndex, 1);

            setState(prevState => ({
                ...prevState,
                comments: newComments
            }));
        }
    };

    return (
        <>
            <Card id={postLinkId} className="col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 mb-2">
                <CardHeader
                    action={
                        canDelete &&
                        <IconButton aria-label="Delete Post" onClick={handleDeleteClick}>
                            <DeleteOutlineRoundedIcon />
                        </IconButton>
                    }
                    avatar={
                        <a href={`/u/${postedBy.profileName}`}>
                            <Avatar alt={getPostedByDisplayName()} title={getPostedByDisplayName()} src={postedBy.pfpSmall} style={{border: '1px solid rgba(0, 0, 0, 0.08)'}} />
                        </a>
                    }
                    subheader={
                        <small>
                            <a href={`/view-post?p=${postLinkId}`} style={{color: 'inherit', textDecoration: 'none'}}>
                                {postDate.toLocaleString()}
                            </a>
                        </small>
                    }
                    title={
                        <>
                            <Typography variant="h6">{post.postTitle}</Typography>
                            <a href={`/u/${postedBy.profileName}`} style={{color: 'inherit', textDecoration: 'none'}}>
                                {postedBy.displayName}<small className="text-muted">{postedBy.displayNameIndex === 0 ? '' : `#${postedBy.displayNameIndex}`}</small>
                            </a>
                        </>
                    }
                />
                <CardContent>
                    <div className={classes.previewImages}
                        style={{
                            display: postType === Constants.POST_TYPES.TEXT ? 'none' : 'flex'
                        }}
                    >
                        {
                            getPostFilesSection()
                        }
                    </div>
                    {
                        post.postText && <p>
                            {post.postText}
                        </p>
                    }
                </CardContent>
                <Divider light={true} variant='middle' />
                <CardActions style={{flexWrap: 'wrap', padding: '16px'}}>
                    {
                        loggedIn &&
                        <div className="d-flex mb-2 w-100">
                            <div style={{flexGrow: 1}}>
                                {
                                    state.replyToComment &&
                                    <div className={classes.parentCommentHeader}>
                                        <div style={{flexGrow: 1}}>
                                            <span className={classes.parentCommenter}>
                                                {state.replyToComment.postedBy.displayName}
                                                {
                                                    state.replyToComment.postedBy.displayNameIndex !== 0 &&
                                                    `#${state.replyToComment.postedBy.displayNameIndex}`
                                                }
                                            </span>
                                            {`: ${state.replyToComment.commentText}`}
                                        </div>
                                        <div style={{alignContent: 'center', display: 'flex'}}>
                                            <CancelTwoToneIcon style={{
                                                    cursor: 'pointer',
                                                    fontSize: 'small',
                                                    height: '100%'
                                                }}
                                                onClick={handleCancelReply}
                                                titleAccess="Cancel reply" 
                                            />
                                        </div>
                                    </div>
                                }
                                <MaterialTextfield inputRef={commentTextfield} style={{width: '100%'}} label={`Add a ${state.replyToComment ? 'reply' : 'comment'}`} multiline variant="filled" size="small" inputProps={{'maxLength': MAX_COMMENT_LENGTH}} onChange={handleCommentChange} value={state.commentText}></MaterialTextfield>
                                <LinearProgress className={classes.commentProgress} variant="determinate" value={state.commentLimit} color={getCommentProgressColor()} aria-valuetext={`${state.commentLimit} Percent of Comment Characters Used`} />
                            </div>
                            <button className="btn btn-primary ms-2" type="button" onClick={handlePostClick}>Post</button>
                        </div>
                    }
                    {
                        commentCount > 0 && state.total === -1 && 
                        <div className="d-flex justify-content-end w-100">
                            <button className="btn btn-link border-0 dropdown-toggle text-decoration-none" type="button" onClick={handleViewCommentsClick}>View Comments ({commentCount})</button>
                        </div>
                    }
                    {
                        state.comments.length > 0 && 
                        <>
                            <ul className={classes.commentList}>
                            {
                                state.comments.map(comment => {
                                    let commentId = adjustGUIDDashes(comment.uniqueId);

                                    return <PostComment key={comment.uniqueId} comment={comment} takeFocus={commentId === focusCommentId} handleReplyClick={handleReplyClick} deleteCommentCB={removeComment} />;
                                })
                            }
                            </ul>
                            {
                                moreCommentsAvailable() &&
                                <div className={classes.moreCommentsDiv}>
                                    <button className="btn btn-link btn-sm text-nowrap text-truncate shadow-none" 
                                        type="button"
                                        onClick={handleMoreResultsClick}
                                    >
                                        {isMobile ? 'Tap' : 'Click'} here for more comments
                                    </button>
                                </div>
                            }
                        </>
                    }
                    {
                        state.comments.length === 0 && state.total === 0 &&
                        <div>
                            <span>Either there are no comments or you are <a href="/register">not authorized</a> to view comments.</span>
                        </div>
                    }
                </CardActions>
                {
                    state.lightboxOpen && (
                        <Lightbox 
                            mainSrc={postFiles ? postFiles[state.lightboxIndex].fileName : ''}
                            nextSrc={postFiles ? postFiles[(state.lightboxIndex + 1) % postFiles.length].fileName : ''}
                            prevSrc={postFiles ? postFiles[(state.lightboxIndex + postFiles.length - 1) % postFiles.length].fileName : ''}
                            onCloseRequest={() =>
                                setState(prevState => ({...prevState, lightboxOpen: false}))
                            }
                            onMovePrevRequest={() => 
                                setState(prevState => ({...prevState, lightboxIndex: (prevState.lightboxIndex + postFiles.length - 1) % postFiles.length}))
                            }
                            onMoveNextRequest={() => 
                                setState(prevState => ({...prevState, lightboxIndex: (prevState.lightboxIndex + 1) % postFiles.length}))
                            }
                            reactModalStyle={{
                                overlay: {
                                    zIndex: 2000 /* Fight with Bootstrap's fixed-top class, which sets the z-index to 1030 */
                                }
                            }}
                        />
                    )
                }
            </Card>
        </>
    );
}