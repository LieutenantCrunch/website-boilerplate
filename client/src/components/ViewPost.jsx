import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import queryString from 'query-string';

import PostService from '../services/post.service';
import { PostCard } from './PostCard';

const ViewPost = ({ setTitle }) => {
    const [state, setState] = useState({
        commentId: undefined,
        defaultText: 'Loading...',
        fetchDate: null,
        post: null
    });

    useEffect(() => {
        setTitle('View Post');

        const parsedQueryString = queryString.parse(location.search);
        const parsedHash = queryString.parse(location.hash);

        let postId = parsedQueryString.p;
        let hashKeys = Object.keys(parsedHash);
        let commentId = hashKeys.length > 0 ? hashKeys[0] : undefined;

        PostService.getPost(postId, commentId).then(post => {
            setState({
                commentId,
                defaultText: post ? 'Loading...' : 'Nothing to see here!',
                post,
                fetchDate: Date.now()
            });
        }).catch(err => console.error(`Error getting post ${err.message}`));

        return () => {
            if (PostService.getPostCancel) {
                PostService.getPostCancel();
            }
        }
    }, []);

    return <div className="container-fluid d-flex align-items-center flex-column mt-2">
        {
            state.post 
            ? <PostCard post={state.post} fetchDate={state.fetchDate} focusCommentId={state.commentId} />
            : <div>
                {state.defaultText}
            </div>
        }
    </div>;
};

export default withRouter(ViewPost);