import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, Divider, Paper } from '@material-ui/core';
import MaterialTextfield from '@material-ui/core/TextField';

import PhotoOutlinedIcon from '@material-ui/icons/PhotoOutlined';
import VideocamOutlinedIcon from '@material-ui/icons/VideocamOutlined';
import EqualizerIcon from '@material-ui/icons/Equalizer';
import CancelTwoToneIcon from '@material-ui/icons/CancelTwoTone';

import { makeStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import * as Constants from '../constants/constants';

export default function NewPostForm(props) {
    const [state, setState] = useState({
        postType: Constants.POST_TYPES.IMAGE,
        postAudience: Constants.POST_AUDIENCES.CONNECTIONS,
        isDragging: false,
        isLoading: false,
        images: [],
        customAudience: []
    });

    const useStyles = makeStyles(() => ({
        root: {
            position: 'relative'
        },
        header: {
            padding: '16px',
            display: 'flex',
            alignItems: 'center'
        },
        body: {
            display: 'flex',
            alignItems: 'center',
            padding: '16px'
        },
        footer: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 16px 16px'
        },
        avatar: {
            marginRight: '16px',
            flexGrow: 0,
            flexShrink: 0
        },
        headerContent: {
            flexGrow: 1,
            flexShrink: 1
        },
        title: {
            width: '100%'
        },
        bodyContent: {
            flexGrow: 1,
            flexShrink: 1
        },
        overlay: {
            backgroundColor: 'rgba(255,255,255,.75)',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
            zIndex: 10,
            justifyContent: 'center',
            alignItems: 'center',
            '& *': {
                /* This is necessary due to the dragLeave event firing when the mouse moves from the overlay to one of its children */
                pointerEvents: 'none'
            }
        },
        removeControls: {
            display: 'none',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            right: 0
        },
        imageThumbnail: {
            backgroundColor: 'rgb(230,230,230)',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            borderStyle: 'none',
            borderWidth: '5px',
            borderColor: 'rgb(240,240,240)',
            position: 'relative',
            height: '10vmin',
            width: '48%',
            margin: '1%',
            /* When there aren't any images loaded and only one preview thumbnail exists */
            '&:only-child': {
                width: '100%',
                height: '20vmin',
                borderRadius: '10px 10px 0 0'
            },
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
            },
            /* Style to apply to the last thumbnail, which will be the placeholder thumbnail except when 4 images are loaded, this will be overridden below */
            '&:last-child': {
                borderStyle: 'solid'
            }
        },
        imageLoaded: {
            '&:hover $removeControls': {
                display: 'block'
            }
        },
        previewImages: {
            flexWrap: 'wrap',
            justifyContent: 'space-evenly',
            padding: '0 16px',
        },
        imagesFull: {
            /* Style to apply to the last thumbnail once all images have been loaded */
            '& $imageThumbnail:last-child': {
                borderStyle: 'none'
            }
        },
        placeholderIcon: {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
        }
    }));

    const classes = useStyles(state);

    const dropArea = useRef(null);
    const dropOverlay = useRef(null);

    // Modified from https://stackoverflow.com/questions/23640869/create-thumbnail-from-video-file-via-file-input
    const getVideoCover = (file) => {
        return new Promise((resolve, reject) => {
            // load the file to a video player
            const videoPlayer = document.createElement('video');

            videoPlayer.addEventListener('error', (ex) => {
                reject("error when loading video file", ex);
            });
            // load metadata of the video to get video duration and dimensions
            videoPlayer.addEventListener('loadedmetadata', () => {
                // seek to the middle of the video
                let seekTo = videoPlayer.duration / 2;

                // delay seeking or else 'seeked' event won't fire on Safari
                setTimeout(() => {
                  videoPlayer.currentTime = seekTo;
                }, 200);

                // extract video thumbnail once seeking is complete
                videoPlayer.addEventListener('seeked', () => {

                    // define a canvas to have the same dimension as the video
                    const canvas = document.createElement("canvas");
                    canvas.width = videoPlayer.videoWidth;
                    canvas.height = videoPlayer.videoHeight;

                    // draw the video frame to canvas
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);

                    // return the canvas image as a blob
                    ctx.canvas.toBlob(
                        blob => {
                            resolve(blob);
                        },
                        "image/jpeg",
                        0.75 /* quality */
                    );
                });
            });

            videoPlayer.setAttribute('src', URL.createObjectURL(file));
            videoPlayer.load();
        });
    }

    const selectAudioType = () => {
        if (state.postType !== Constants.POST_TYPES.AUDIO) {
            setState(prevState => ({
                ...prevState,
                postType: Constants.POST_TYPES.AUDIO,
                images: []
            }));
        }
    };

    const selectImageType = () => {
        if (state.postType !== Constants.POST_TYPES.IMAGE) {
            setState(prevState => ({
                ...prevState,
                postType: Constants.POST_TYPES.IMAGE,
                images: []
            }));
        }
    };

    const selectTextType = () => {
        if (state.postType !== Constants.POST_TYPES.TEXT) {
            setState(prevState => ({
                ...prevState,
                postType: Constants.POST_TYPES.TEXT,
                images: []
            }));
        }
    };

    const selectVideoType = () => {
        if (state.postType !== Constants.POST_TYPES.VIDEO) {
            setState(prevState => ({
                ...prevState,
                postType: Constants.POST_TYPES.VIDEO,
                images: []
            }));
        }
    };

    const getCurrentPostType = () => {
        switch (state.postType) {
            case Constants.POST_TYPES.AUDIO:
                return 'Audio';
            case Constants.POST_TYPES.IMAGE:
                return 'Image';
            case Constants.POST_TYPES.VIDEO:
                return 'Video';
            case Constants.POST_TYPES.TEXT:
            default:
                return 'Text';
        }
    };

    const selectEveryoneAudience = () => {
        setState(prevState => ({
            ...prevState,
            postAudience: Constants.POST_AUDIENCES.EVERYONE,
            customAudience: []
        }));
    };

    const selectConnectionsAudience = () => {
        setState(prevState => ({
            ...prevState,
            postAudience: Constants.POST_AUDIENCES.CONNECTIONS,
            customAudience: []
        }));
    };

    const selectCustomAudience = (e, type) => {
        if (!state.customAudience.find(connectionType => connectionType === type)) {
            setState(prevState => ({
                ...prevState,
                postAudience: Constants.POST_AUDIENCES.CUSTOM,
                customAudience: [
                    ...prevState.customAudience,
                    type
                ]
            }));     
        }
    };

    const getCurrentAudience = () => {
        switch (state.postAudience) {
            case Constants.POST_AUDIENCES.EVERYONE:
                return 'Everyone';
            case Constants.POST_AUDIENCES.CUSTOM:
                return 'Custom';
            case Constants.POST_AUDIENCES.CONNECTIONS:
            default:
                return 'Outgoing Connections';
        }
    };

    const getCurrentDropText = () => {
        return state.isLoading ? 'Please wait...' : 'Drop files here';
    }

    const getPlaceholderThumbnail = () => {
        switch (state.postType) {
            case Constants.POST_TYPES.AUDIO:
                if (state.images.length === 0) {
                    return <div className={classes.imageThumbnail}>
                        <EqualizerIcon className={classes.placeholderIcon} style={{
                            color: 'rgb(255,255,255)',
                            fontSize: '5vmin'
                        }} />
                    </div>;
                }

                break;
            case Constants.POST_TYPES.IMAGE:
                if (state.images.length < 4) {
                    return <div className={classes.imageThumbnail}>
                        <PhotoOutlinedIcon className={classes.placeholderIcon}  style={{
                            color: 'rgb(255,255,255)',
                            fontSize: '5vmin'
                        }} />
                    </div>;
                }
                
                break;
            case Constants.POST_TYPES.VIDEO:
                if (state.images.length === 0) {
                    return <div className={classes.imageThumbnail}>
                        <VideocamOutlinedIcon className={classes.placeholderIcon}  style={{
                            color: 'rgb(255,255,255)',
                            fontSize: '5vmin'
                        }} />
                    </div>;
                }

                break;
            case Constants.POST_TYPES.TEXT:
            default:
                break;;
        }

        return <></>;
    }

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.target !== dropOverlay.current) {
            setState(prevState => ({
                ...prevState,
                isDragging: true
            }));
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.target === dropOverlay.current) {
            setState(prevState => ({
                ...prevState,
                isDragging: false
            }));
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        let stateUpdates = {
            postType: Constants.POST_TYPES.TEXT,
            isDragging: false
        };

        const files = [...e.dataTransfer.files];

        if (files && files.length > 0) {
            // First, filter the files
            let imagesRemaining = 4 - state.images.length; // Users can only upload a maximum of 4 images

            let filteredFiles = files.filter(file => {
                // If the type has already been determined to be video or audio
                if (stateUpdates.postType === Constants.POST_TYPES.VIDEO || stateUpdates.postType === Constants.POST_TYPES.AUDIO) {
                    // Only one file of those types is allowed, so we can skip all the logic and return false
                    return false;
                }
                // Else, if the type has been determined to be image and we still have images left to upload
                else if (stateUpdates.postType === Constants.POST_TYPES.IMAGE && imagesRemaining > 0) {
                    // Decrement the number of images remaining
                    imagesRemaining--;
                    return true;
                }
                // Else, we haven't determined the type yet
                else {
                    let fileType = file.type;

                    // Check for accepted types and set the postType if we find one
                    if (fileType.startsWith('image/')) {
                        stateUpdates.postType = Constants.POST_TYPES.IMAGE;

                        // Previous images might still be set from previous requests, make sure we don't go above the limit
                        if (imagesRemaining > 0) {
                            // Decrement the number of images remaining
                            imagesRemaining--;

                            return true;
                        }

                        return false;
                    }
                    else if (fileType.startsWith('video/')) {
                        stateUpdates.postType = Constants.POST_TYPES.VIDEO;
                        return true;
                    }
                    else if (fileType.startsWith('audio/')) {
                        stateUpdates.postType = Constants.POST_TYPES.AUDIO;
                        return true;
                    }
                    else {
                        // Not a supported type
                        return false;
                    }
                }
            });

            // Populate the image thumbnails as necessary
            switch (stateUpdates.postType) {
                case Constants.POST_TYPES.IMAGE:
                    let imageUrls = filteredFiles.map(file => URL.createObjectURL(file));
                    
                    stateUpdates.images = [
                        ...state.images,
                        ...imageUrls
                    ];

                    break;
                case Constants.POST_TYPES.VIDEO:
                    // Because getting the video preview is async, update the state now to show that it's loading, reset it once the video thumbnail is done
                    setState(prevState => ({
                        ...prevState,
                        isLoading: true
                    }));

                    stateUpdates.images = [URL.createObjectURL(await getVideoCover(filteredFiles[0]))];
                    stateUpdates.isLoading = false;

                    break;
                case Constants.POST_TYPES.AUDIO:
                    stateUpdates.images = [Constants.STATIC_IMAGES.WAVEFORM];

                    break;
                case Constants.POST_TYPES.TEXT:
                default:
                    stateUpdates.images = [];

                    break;
            }
        }

        // Finally, update the state with all updates
        setState(prevState => ({
            ...prevState,
            ...stateUpdates
        }));
    };

    const handleRemoveImage = (e, i) => {
        let { images } = state;
        let updatedImages = images.reduce((finalArray, currentItem, index) => {
            if (index !== i) {
                finalArray.push(currentItem);
            }

            return finalArray;
        }, []);

        setState(prevState => ({
            ...prevState,
            images: updatedImages
        }));
    };

    return (
        <form className="col-12 col-sm-8 col-md-6 col-xl-4">
            <Paper elevation={3} className={classes.root} ref={dropArea} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
                <div className={classes.header}>
                    <Avatar className={classes.avatar}>T</Avatar>
                    <div className={classes.headerContent}>
                        <MaterialTextfield label="Post Title (optional)" size="small" variant="filled" className={classes.title} inputProps={{'maxLength': 50}} />
                        <div>
                            {(new Date()).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className={classNames(classes.previewImages, state.images.length === 4 ? classes.imagesFull : '')}
                    style={{
                        display: state.postType === Constants.POST_TYPES.TEXT ? 'none' : 'flex'
                    }}
                >
                    {
                        /* Need to make the Cancel Icon mobile-friendly */
                        state.images.map((image, index) => (
                            <div key={image} className={classNames(classes.imageThumbnail, classes.imageLoaded)} style={{backgroundImage: `url('${image}')`}}>
                                <div className={classes.removeControls}>
                                    <div style={{
                                        backgroundColor: 'rgba(255,255,255,0.75)',
                                        height: '100%'
                                    }}>
                                    </div>
                                    <CancelTwoToneIcon style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        transform: 'translate(50%, -50%)',
                                        zIndex: 10,
                                        cursor: 'pointer'
                                    }}
                                    onClick={e => handleRemoveImage(e, index)} />
                                </div>
                            </div>
                        ))
                    }
                    {
                        getPlaceholderThumbnail()
                    }
                </div>
                <Divider light={true} variant='middle' />
                <div className={classes.body}>
                    <MaterialTextfield multiline variant="filled" label="Post Text (optional)" className={classes.bodyContent} inputProps={{'maxLength': 2000}} />
                </div>
                <div className={classes.footer}>
                    <div className="dropdown">
                        <button className="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" id="newPostTypeDropdown" aria-expanded="false">{getCurrentPostType()}</button>
                        <ul className="dropdown-menu" aria-labelledby="newPostTypeDropdown">
                            <li><button className="dropdown-item" type="button" onClick={selectAudioType}>Audio</button></li>
                            <li><button className="dropdown-item" type="button" onClick={selectImageType}>Image</button></li>
                            <li><button className="dropdown-item" type="button" onClick={selectTextType}>Text</button></li>
                            <li><button className="dropdown-item" type="button" onClick={selectVideoType}>Video</button></li>
                        </ul>
                    </div>
                    <div className="dropdown">
                        <button className="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" id="newPostAudienceDropdown" aria-expanded="false">{getCurrentAudience()}</button>
                        <ul className="dropdown-menu" aria-labelledby="newPostAudienceDropdown">
                            <li className="dropdown-header">Generic</li>
                            <li><button className="dropdown-item" type="button" onClick={selectEveryoneAudience}>Everyone</button></li>
                            <li><button className="dropdown-item" type="button" onClick={selectConnectionsAudience}>Outgoing Connections</button></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li className="dropdown-header">Custom</li>
                            <li><button className="dropdown-item" type="button" onClick={e => selectCustomAudience(e, 'Friends')}>Friends</button></li>
                        </ul>
                    </div>
                    <button className="btn btn-primary" type="button">Post</button>
                </div>
                <div className={classes.overlay} ref={dropOverlay} style={{ display: state.isDragging ? 'flex' : 'none' }}>
                    <div style={{
                        padding: '16px',
                        border: '1px dashed rgb(100,100,100)',
                        borderRadius: '4px'
                    }}>
                        {getCurrentDropText()}
                    </div>
                </div>
            </Paper>
        </form>
    );
}