import React, {useState, useEffect} from 'react';
import { isMobile } from 'react-device-detect';
import PostService from '../services/post.service';
import * as Constants from '../constants/constants';
import { useHistoryState } from '../hooks/hooks';
import { PostCard } from './PostCard';

// Utilities
import { newArrayWithItemRemoved } from '../utilities/ArrayUtilities';

export const Feed = ({ setTitle, setHeaderMiddleEl }) => {
    const [state, setState] = useState({
        fetchDate: null,
        pageNumber: 0,
        posts: [],
        total: 0
    });

    const [postType, setPostType] = useHistoryState('postType', -1);

    useEffect(() => {
        // Set the page title
        setTitle('My Feed');

        // Set the initial fetch date for when the more posts button is clicked
        let fetchDate = Date.now();

        // Fetch the posts, use postType, which will be set to -1 if it has not been initialized
        // If it has been initialized, it should return a proper value
        // A value of -1 will get whatever the user's preference is
        PostService.getFeed(state.pageNumber, fetchDate, postType).then(({ posts, total, returnPostType }) => {
            setState(prevState => ({
                ...prevState,
                posts,
                total,
                fetchDate
            }));

            // If the postType was -1, we can now set it to what was returned
            if (postType === -1) {
                setPostType(returnPostType);
            }

            setHeaderMiddleEl(getFeedFilter(returnPostType));
        }).catch(err => console.error(err));

        return () => {
            if (PostService.getFeedCancel) {
                PostService.getFeedCancel();
            }

            // Clear out the middle element when unloading Feed
            setHeaderMiddleEl(<></>);
        }
    }, []);

    const updatePostType = (newPostType) => {
        let fetchDate = Date.now();

        setPostType(newPostType);
        setHeaderMiddleEl(getFeedFilter(newPostType));

        PostService.getFeed(0, fetchDate, newPostType).then(({posts, total}) => {
            setState(prevState => ({
                ...prevState,
                fetchDate,
                pageNumber: 0,
                posts: posts,
                total: total
            }));
        }).catch(err => console.error(err));
    }

    const getFeedFilter = (selectedPostType) => {
        return <div className="dropdown">
            <button className="btn btn-link border-0 dropdown-toggle text-decoration-none" style={{color: 'rgb(255,255,255)'}} type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                {`${Constants.POST_TYPES_NAMES[selectedPostType]} Posts`}
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
            let newPosts = newArrayWithItemRemoved(posts, foundIndex);

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
