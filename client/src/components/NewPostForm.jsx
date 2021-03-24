import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, Divider, Paper } from '@material-ui/core';
import MaterialTextfield from '@material-ui/core/TextField';

import { makeStyles } from '@material-ui/core/styles';
import * as Constants from '../constants/constants';

export default function NewPostForm(props) {
    const [state, setState] = useState({
        postType: Constants.POST_TYPES.TEXT,
        isDragging: false,
        isLoading: false,
        singleImageSrc: ''
    });

    const useStyles = makeStyles((theme) => ({
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
        singleImage: {
            height: 0,
            paddingTop: '50%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            margin: '0 16px'
        }
    }));

    const classes = useStyles();

    const dropArea = useRef(null);
    const dropOverlay = useRef(null);

    useEffect(() => {
        if (dropArea.current) {
            dropArea.current.addEventListener('dragenter', handleDragEnter);
            dropArea.current.addEventListener('dragleave', handleDragLeave);
            dropArea.current.addEventListener('dragover', handleDragOver);
            dropArea.current.addEventListener('drop', handleDrop);
        }

        return () => {
            if (dropArea.current) {
                dropArea.current.removeEventListener('dragenter', handleDragEnter);
                dropArea.current.removeEventListener('dragleave', handleDragLeave);
                dropArea.current.removeEventListener('dragover', handleDragOver);
                dropArea.current.removeEventListener('drop', handleDrop);
            }
        }
    }, []);

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
        setState(prevState => ({
            ...prevState,
            postType: Constants.POST_TYPES.AUDIO,
            singleImageSrc: ''
        }));
    };

    const selectImageType = () => {
        setState(prevState => ({
            ...prevState,
            postType: Constants.POST_TYPES.IMAGE
        }));
    };

    const selectTextType = () => {
        setState(prevState => ({
            ...prevState,
            postType: Constants.POST_TYPES.TEXT,
            singleImageSrc: ''
        }));
    };

    const selectVideoType = () => {
        setState(prevState => ({
            ...prevState,
            postType: Constants.POST_TYPES.VIDEO,
            singleImageSrc: ''
        }));
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
    }

    const getCurrentDropText = () => {
        return state.isLoading ? 'Please wait...' : 'Drop files here';
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
            isDragging: false
        };

        const files = [...e.dataTransfer.files];

        if (files && files.length) {
            console.log(files);
            if (files.every(file => file.type.startsWith('image/'))) {
                stateUpdates.postType = Constants.POST_TYPES.IMAGE;

                if (files.length === 1) {
                    stateUpdates.singleImageSrc = URL.createObjectURL(files[0]);
                }
                else {
                    stateUpdates.singleImageSrc = '';
                }
            }
            else if (files.length === 1 && files[0].type.startsWith('video/')) {
                setState(prevState => ({
                    ...prevState,
                    isLoading: true
                }));

                stateUpdates.postType = Constants.POST_TYPES.VIDEO;
                stateUpdates.singleImageSrc = URL.createObjectURL(await getVideoCover(files[0]));
                stateUpdates.isLoading = false;
            }
            else if (files.length === 1 && files[0].type.startsWith('audio/')) {
                stateUpdates.postType = Constants.POST_TYPES.AUDIO;
                stateUpdates.singleImageSrc = Constants.STATIC_IMAGES.WAVEFORM;
            }
            else {
                stateUpdates.postType = Constants.POST_TYPES.TEXT;
                stateUpdates.singleImageSrc = '';
            }
        }

        setState(prevState => ({
            ...prevState,
            ...stateUpdates
        }));
    };

    return (
        <form className="col-12 col-md-4">
            <Paper elevation={3} className={classes.root} ref={dropArea}>
                <div className={classes.header}>
                    <Avatar className={classes.avatar}>T</Avatar>
                    <div className={classes.headerContent}>
                        <MaterialTextfield label="Post Title (optional)" size="small" variant="filled" className={classes.title} inputProps={{'maxLength': 50}} />
                        <div>
                            {(new Date()).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className={classes.singleImage} style={{
                        backgroundImage: state.singleImageSrc === '' ? 'none' : `url(${state.singleImageSrc})`,
                        backgroundColor: state.singleImageSrc === '' ? 'rgb(230,230,230)' : 'rgb(255,255,255)',
                        display: state.postType === Constants.POST_TYPES.TEXT ? 'none' : ''
                    }}>

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