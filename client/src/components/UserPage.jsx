import React, { useContext, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Redirect, Route, useParams, useRouteMatch, withRouter } from 'react-router-dom';
import classNames from 'classnames';

import ProfilePicture from './ProfilePicture';
import ConnectionButton from './FormControls/ConnectionButton';
import { PostCard } from './PostCard';

import { LoggedInContext } from '../contexts/loggedIn';

import UserService from '../services/user.service';
import PostService from '../services/post.service';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { upsertUser } from '../redux/users/usersSlice';


function User (props) {
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

    const updateConnection = (connection) => {
        setState(prevState => ({
            ...prevState,
            profileInfo: connection
        }));
    }

    useEffect(() => {
        UserService.getProfileInfo(profileName).then((profileInfo) => {
            dispatch(upsertUser(profileInfo));

            let title = profileInfo.displayName;

            if (profileInfo.displayNameIndex > 0) {
                title += `#${profileInfo.displayNameIndex}`;
            }

            props.setTitle(`${title}'s Profile`);

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
                <PostCard key={post.uniqueId} post={post} />
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

function UserPage (props) {
    const loggedIn = useContext(LoggedInContext);
    const { url } = useRouteMatch();

    return <>
        <Route path={`${url}/:profileName`}>
            <User 
                setTitle={props.setTitle}
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

export default withRouter(UserPage);
