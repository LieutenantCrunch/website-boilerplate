import React, {useState, useEffect} from 'react';
import { isMobile } from 'react-device-detect';
import { withRouter } from 'react-router-dom';
import PostService from '../services/post.service';
import * as Constants from '../constants/constants';
import { useHistoryState } from '../hooks/hooks';
import { PostCard } from './PostCard';

function Feed(props) {
    const [state, setState] = useState({
        fetchDate: null,
        pageNumber: 0,
        posts: [],
        total: 0
    });

    const [postType, setPostType] = useHistoryState('postType', Constants.POST_TYPES.ALL);

    useEffect(() => {
        let fetchDate = Date.now();

        props.setTitle('My Feed');
        props.setHeaderMiddleEl(getFeedFilter());

        PostService.getFeed(state.pageNumber, fetchDate, postType).then(({ posts, total }) => {
            setState(prevState => ({
                ...prevState,
                posts,
                total,
                fetchDate
            }));
        }).catch(err => console.error(err));

        return () => {
            if (PostService.getFeedCancel) {
                PostService.getFeedCancel();
            }

            // Clear out the middle element when unloading Feed
            props.setHeaderMiddleEl(<></>);
        }
    }, []);

    useEffect(() => {
        props.setHeaderMiddleEl(getFeedFilter());
    }, [postType])

    const updatePostType = (newPostType) => {
        let fetchDate = Date.now();

        PostService.getFeed(0, fetchDate, newPostType).then(response => {
            setState(prevState => ({
                ...prevState,
                fetchDate,
                pageNumber: 0,
                posts: response.posts,
                total: response.total
            }));

            setPostType(newPostType);
        }).catch(err => console.error(err));
    }

    const getFeedFilter = () => {
        return <div className="dropdown">
            <button className="btn btn-link border-0 dropdown-toggle text-decoration-none" style={{color: 'rgb(255,255,255)'}} type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                {Constants.POST_TYPES_NAMES[postType]}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                <li><button className="dropdown-item" type="button" onClick={e => updatePostType(Constants.POST_TYPES.ALL)}>All Posts</button></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item" type="button" onClick={e => updatePostType(Constants.POST_TYPES.AUDIO)}>Audio Posts</button></li>
                <li><button className="dropdown-item" type="button" onClick={e => updatePostType(Constants.POST_TYPES.IMAGE)}>Image Posts</button></li>
                <li><button className="dropdown-item" type="button" onClick={e => updatePostType(Constants.POST_TYPES.TEXT)}>Text Posts</button></li>
                <li><button className="dropdown-item" type="button" onClick={e => updatePostType(Constants.POST_TYPES.VIDEO)}>Video Posts</button></li>
            </ul>
        </div>;
    }

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

        PostService.getFeed(pageNumber, state.fetchDate || Date.now(), postType).then(response => {
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
        <div className="container-fluid d-flex align-items-center flex-column mt-2">
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
        </div>
    );
};

export default withRouter(Feed);