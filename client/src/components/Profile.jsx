import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import {withRouter} from 'react-router-dom';
import PostService from '../services/post.service';

import { PostCard } from './PostCard';
import ProfilePictureUpload from './ProfilePictureUpload';
import { NewPostForm } from './NewPostForm';

// Redux
import { useSelector } from 'react-redux';
import { selectCurrentUserDisplayName, selectCurrentUserDisplayNameIndex, selectCurrentUserEmail } from '../redux/users/currentUserSlice';

function Profile(props) {
    const currentUserDisplayName = useSelector(selectCurrentUserDisplayName);
    const currentUserDisplayNameIndex = useSelector(selectCurrentUserDisplayNameIndex);
    const currentUserEmail = useSelector(selectCurrentUserEmail);

    const [state, setState] = useState({
        fetchDate: null,
        pageNumber: 0,
        posts: [],
        total: 0
    });

    useEffect(() => {
        props.setTitle('Profile');

        let fetchDate = Date.now();

        PostService.getMyPosts(state.pageNumber, fetchDate).then(response => {
            setState(prevState => ({
                ...prevState,
                posts: response.posts,
                total: response.total,
                fetchDate
            }));
        }).catch(err => console.error(err));

        return () => {
            if (PostService.getMyPostsCancel) {
                PostService.getMyPostsCancel();
            }
        }
    }, []);

    const addNewPost = (post) => {
        if (post) {
            setState(prevState => ({
                ...prevState,
                posts: [
                    post,
                    ...prevState.posts
                ]
            }));
        }
    };

    const morePostsAvailable = () => {
        return state.posts.length < state.total;
    };

    const removePost = (uniqueId) => {
        let { posts } = state;
        let foundIndex = posts.findIndex(post => post.uniqueId === uniqueId);

        if (foundIndex > -1) {
            let newPosts = [...posts];

            newPosts.splice(foundIndex, 1);

            setState(prevState => ({
                ...prevState,
                posts: newPosts
            }));
        }
    };

    const handleMoreResultsClick = async (e) => {
        let pageNumber = state.pageNumber + 1;

        PostService.getMyPosts(pageNumber, state.fetchDate || Date.now()).then(response => {
            if (response.posts.length > 0) {
                setState(prevState => ({
                    ...prevState,
                    pageNumber,
                    posts: [
                        ...prevState.posts,
                        ...response.posts
                    ]
                }));
            }
        }).catch(err => console.error(err));
    };

    return (
        <>
            <div className="card col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 mt-2 mb-2 align-middle text-center">
                <div className="card-header">
                    <ProfilePictureUpload />
                </div>
                <div className="card-body">
                    <h5 className="card-title">{currentUserDisplayName}
                        {
                            currentUserDisplayNameIndex > 0
                            ? <small className="text-muted">#{currentUserDisplayNameIndex}</small>
                            : <></>
                        }
                    </h5>
                    <p className="card-text">Email Address: {currentUserEmail}</p>
                </div>
            </div>
            <NewPostForm onNewPostCreated={addNewPost} />
            {
                state.posts.map(post => (
                    <PostCard key={post.uniqueId} post={post} deletePostCB={removePost} />
                ))
            }
            {
                morePostsAvailable() &&
                <div>
                    <button className="btn btn-link btn-sm text-nowrap text-truncate shadow-none" 
                        type="button"
                        onClick={handleMoreResultsClick}
                    >
                        {isMobile ? 'Tap' : 'Click'} here for more posts
                    </button>
                </div>
            }
        </>
    );
};

export default withRouter(Profile);