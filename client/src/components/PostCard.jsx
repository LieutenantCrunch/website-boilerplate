import React from 'react';
import { Avatar, Card, CardContent, CardHeader, Divider } from '@material-ui/core';

export default function PostCard(props) {
    const { post } = props;
    const { postedBy } = post;
    const postDate = new Date(post.postedOn);

    return (
        <Card className="mb-2">
            <CardHeader
                avatar={
                    <Avatar alt={`${postedBy.displayName}#${postedBy.displayNameIndex}`} src={postedBy.pfpSmall} />
                }
                subheader={postDate.toLocaleString()}
                title={post.postTitle}
            />
            <Divider light={true} variant='middle' />
            <CardContent>
                {post.postText}
            </CardContent>
        </Card>
    );
}