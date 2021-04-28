import React, {useState, useEffect} from 'react';
import { isMobile } from 'react-device-detect';
import { withRouter } from 'react-router-dom';
import PostService from '../services/post.service';
import PostCard from './PostCard';

function Feed(props) {
    const [state, setState] = useState({
        fetchDate: null,
        pageNumber: 0,
        posts: [],
        total: 0
    });

    useEffect(() => {
        let fetchDate = Date.now();

        props.setTitle('My Feed');

        PostService.getFeed(state.pageNumber, fetchDate).then(response => {
            setState(prevState => ({
                ...prevState,
                posts: response.posts,
                total: response.total,
                fetchDate
            }));
        }).catch(err => console.error(err));
    }, []);

    const morePostsAvailable = () => {
        return state.posts.length < state.total;
    };

    const handleMoreResultsClick = async (e) => {
        let pageNumber = state.pageNumber + 1;

        PostService.getFeed(pageNumber, state.fetchDate || Date.now()).then(response => {
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
        </div>
    );
};

export default withRouter(Feed);