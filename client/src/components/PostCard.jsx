import React from 'react';
import classNames from 'classnames';
import { Avatar, Card, CardContent, CardHeader, Divider } from '@material-ui/core';
import * as Constants from '../constants/constants';

// Material UI Styles
import { makeStyles } from '@material-ui/core/styles';

export default function PostCard(props) {
    const { post } = props;
    const { postedBy, postFiles, postType } = post;
    const postDate = new Date(post.postedOn);

    // Material UI Styles
    const useStyles = makeStyles(() => ({
        imageThumbnail: {
            backgroundColor: 'rgb(230,230,230)',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            borderStyle: 'none',
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
            justifyContent: 'space-evenly',
            padding: '0 16px',
        }
    }));

    const classes = useStyles();

    const getPostFilesSection = () => {
        if (postFiles && postFiles.length > 0) {
            return postFiles.map((postFile, index) => (
                <div key={postFile.fileName} className={classes.imageThumbnail} style={{backgroundImage: `url('${postFile.fileName}')`}}>
                </div>
            ))
        }

        return <></>;
    }

    return (
        <Card className="mb-2">
            <CardHeader
                avatar={
                    <Avatar alt={`${postedBy.displayName}#${postedBy.displayNameIndex}`} src={postedBy.pfpSmall} />
                }
                subheader={postDate.toLocaleString()}
                title={post.postTitle}
            />
            <div className={classes.previewImages}
                style={{
                    display: postType === Constants.POST_TYPES.TEXT ? 'none' : 'flex'
                }}
            >
            {
                getPostFilesSection()
            }
            </div>
            <Divider light={true} variant='middle' />
            <CardContent>
                {post.postText}
            </CardContent>
        </Card>
    );
}