import React, { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Redirect, Route, useParams, useRouteMatch } from 'react-router-dom';

import ProfilePicture from './ProfilePicture';
import ConnectionButton from './FormControls/ConnectionButton';
import { PostCard } from './PostCard';

// Contexts
import { LoggedInContext } from '../contexts/loggedIn';

// Services
import UserService from '../services/user.service';
import PostService from '../services/post.service';

// Utilities
import { newArrayWithItemRemoved } from '../utilities/ArrayUtilities';

// Redux
import { useDispatch } from 'react-redux';
import { upsertUser } from '../redux/users/usersSlice';


const User = ({ setTitle }) => {
    const loggedIn = useContext(LoggedInContext);

    const dispatch = useDispatch();
    const { profileName } = useParams();
    const [state, setState] = useState({
        fetchDate: null,
        pageNumber: 0,
        posts: [],
        profileInfo: null,
        total: -1
    });

    useEffect(() => {
        UserService.getProfileInfo(profileName).then((profileInfo) => {
            dispatch(upsertUser(profileInfo));

            let title = profileInfo.displayName;

            if (profileInfo.displayNameIndex > 0) {
                title += `#${profileInfo.displayNameIndex}`;
            }

            setTitle(`${title}'s Profile`);

            setState(prevState => ({
                ...prevState,
                profileInfo
            }));
        }).catch((reason) => {
            console.error(reason);
        });

        let fetchDate = Date.now();

        PostService.getUserPosts(undefined, profileName, 0, fetchDate).then(({ posts, total }) => {
            setState(prevState => ({
                ...prevState,
                posts,
                total,
                fetchDate
            }));
        }).catch(err => console.error(err));

        return () => {
            if (UserService.getProfileInfoCancel) {
                UserService.getProfileInfoCancel();
            }

            if (PostService.getUserPostsCancel) {
                PostService.getUserPostsCancel();
            }
        };
    }, []);

    const morePostsAvailable = () => {
        return state.posts.length < state.total;
    };

    const removePost = (uniqueId) => {
        let { posts } = state;
        let foundIndex = posts.findIndex(post => post.uniqueId === uniqueId);

        if (foundIndex > -1) {
            let newPosts = newArrayWithItemRemoved(posts, foundIndex);

            setState(prevState => ({
                ...prevState,
                posts: newPosts
            }));
        }
    };

    const handleMoreResultsClick = async (e) => {
        let pageNumber = state.pageNumber + 1;

        PostService.getUserPosts(undefined, profileName, pageNumber, state.fetchDate || Date.now()).then(({ posts }) => {
            if (posts && posts.length > 0) {
                setState(prevState => ({
                    ...prevState,
                    pageNumber,
                    posts: [
                        ...prevState.posts,
                        ...posts
                    ]
                }));
            }
        }).catch(err => console.error(err));
    };

    return <>
        <div className="card col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 my-2 align-middle text-center">
            <div className="card-header">
                <ProfilePicture pfpSmall={state.profileInfo?.pfpSmall || ''} />
            </div>
            <div className="card-body">
                <h5 className="card-title">{state.profileInfo?.displayName || ''}
                    {
                        state.profileInfo?.displayNameIndex && state.profileInfo?.displayNameIndex > 0
                        ? <small className="text-muted">#{state.profileInfo?.displayNameIndex}</small>
                        : <></>
                    }
                </h5>
            </div>
            {
                loggedIn
                ? <div className="card-footer text-end">
                    <ConnectionButton uniqueId={state.profileInfo?.uniqueId} />
                </div>
                : <></>
            }
        </div>
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
    </>;
}

export const UserPage = ({ setTitle }) => {
    const loggedIn = useContext(LoggedInContext);
    const { url } = useRouteMatch();

    return <>
        <Route path={`${url}/:profileName`}>
            <User 
                setTitle={setTitle}
            />
        </Route>
        <Route path={`${url}`} exact={true} render={() => {
                return (
                    loggedIn
                    ? <Redirect to="/profile" />
                    : <Redirect to="/login" />
                );
            }}
        />
    </>;
}
