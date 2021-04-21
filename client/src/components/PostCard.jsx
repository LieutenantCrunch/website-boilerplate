import React, { useState } from 'react';
import classNames from 'classnames';
import Lightbox from 'react-image-lightbox';
import * as Constants from '../constants/constants';

// Material UI
import { Avatar, Card, CardContent, CardHeader, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

// Multimedia Components
import { AudioPlayer } from './Multimedia/AudioPlayer';
import { VideoPlayer } from './Multimedia/VideoPlayer';

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
    },
    videoThumbnail: {
        backgroundColor: 'rgb(255,255,255)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        borderStyle: 'none',
        position: 'relative',
        height: '30vmin',
        width: '48%',
        margin: '1%'
    }
}));

export default function PostCard(props) {
    const { post } = props;
    const { postedBy, postFiles, postType } = post;
    const postDate = new Date(post.postedOn);

    const [state, setState] = useState({
        lightboxOpen: false,
        lightboxIndex: 0
    });

    const classes = useStyles();

    const handleImageClick = (e, index) => {
        if (postType === Constants.POST_TYPES.IMAGE) {
            setState(prevState => ({
                ...prevState,
                lightboxOpen: true,
                lightboxIndex: index
            }));
        }
    };

    const getPostFilesSection = () => {
        if (postFiles && postFiles.length > 0) {
            switch (postType) {
            case Constants.POST_TYPES.AUDIO:
                return <AudioPlayer sourceFile={postFiles[0].fileName} thumbnail={postFiles[0].thumbnailFileName} />
                /*return <div key={postFiles[0].thumbnailFileName} 
                        className={classes.audioThumbnail} 
                        style={{backgroundImage: `url('${postFiles[0].thumbnailFileName}')`}}
                    >
                    </div>;*/
            case Constants.POST_TYPES.IMAGE:
                return postFiles.map((postFile, index) => (
                    <div key={postFile.fileName} 
                        className={classes.imageThumbnail} 
                        style={{backgroundImage: `url('${postFile.fileName}')`}}
                        onClick={e => handleImageClick(e, index)}
                    >
                    </div>
                ));
            case Constants.POST_TYPES.VIDEO:
                return <VideoPlayer sourceFile={postFiles[0].fileName} thumbnail={postFiles[0].thumbnailFileName} />;
                /*return <div className={classes.videoThumbnail} 
                        style={{backgroundImage: `url('${postFiles[0].thumbnailFileName}')`}}
                    >
                    </div>;*/
            case Constants.POST_TYPES.TEXT:
            default:
                return <></>;
            }
        }

        return <></>;
    }

    return (
        <Card className="col-12 col-sm-8 col-md-6 col-xl-4 mb-2">
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
            {
                state.lightboxOpen && (
                    <Lightbox 
                        mainSrc={postFiles ? postFiles[state.lightboxIndex].fileName : ''}
                        nextSrc={postFiles ? postFiles[(state.lightboxIndex + 1) % postFiles.length].fileName : ''}
                        prevSrc={postFiles ? postFiles[(state.lightboxIndex + postFiles.length - 1) % postFiles.length].fileName : ''}
                        onCloseRequest={() =>
                            setState(prevState => ({...prevState, lightboxOpen: false}))
                        }
                        onMovePrevRequest={() => 
                            setState(prevState => ({...prevState, lightboxIndex: (prevState.lightboxIndex + postFiles.length - 1) % postFiles.length}))
                        }
                        onMoveNextRequest={() => 
                            setState(prevState => ({...prevState, lightboxIndex: (prevState.lightboxIndex + 1) % postFiles.length}))
                        }
                        reactModalStyle={{
                            overlay: {
                                zIndex: 2000 /* Fight with Bootstrap's fixed-top class, which sets the z-index to 1030 */
                            }
                        }}
                    />
                )
            }
        </Card>
    );
}