import React, {useState, useEffect} from 'react';
import {withRouter} from 'react-router-dom';
import PostService from '../services/post.service';
import PostCard from './PostCard';

function Feed(props) {
    const [state, setState] = useState({
        posts: [],
        total: 0,
        fetchDate: null
    });

    useEffect(() => {
        props.setTitle('My Feed');

        PostService.getFeed().then(response => {
            setState(prevState => ({
                ...prevState,
                posts: response.posts,
                total: response.total,
                fetchDate: Date.now()
            }));
        }).catch(err => console.error(err));
    }, []);

    return (
        <div className="align-middle text-center">
            {
                state.posts.map(post => (
                    <PostCard key={post.uniqueId} post={post} />
                ))
            }
        </div>
    );
};

export default withRouter(Feed);