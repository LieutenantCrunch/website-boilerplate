import React from 'react';
import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { usePopper } from 'react-popper';

// Material UI Components
import { Avatar, Divider, Paper } from '@material-ui/core';
import MaterialTextfield from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import PhotoOutlinedIcon from '@material-ui/icons/PhotoOutlined';
import VideocamOutlinedIcon from '@material-ui/icons/VideocamOutlined';
import EqualizerIcon from '@material-ui/icons/Equalizer';
import CancelTwoToneIcon from '@material-ui/icons/CancelTwoTone';

// Material UI Styles
import { makeStyles } from '@material-ui/core/styles';

// Assorted Functionality
import * as Constants from '../constants/constants';
import { isNullOrWhiteSpaceOnly } from '../utilities/TextUtilities';
import PostService from '../services/post.service';

// Redux
import { useSelector } from 'react-redux';
import { selectConnectionTypes } from '../redux/connections/connectionTypesSlice';
import { selectCurrentUserPfpSmall } from '../redux/users/currentUserSlice';

// WB Components
import SwitchCheckbox from './FormControls/SwitchCheckbox';

// Material UI Styles
const useStyles = makeStyles(() => ({
    root: {
        position: 'relative',
        border: '1px solid rgb(153,217,234)'
    },
    header: {
        padding: '8px 16px 16px',
        display: 'flex',
        flexWrap: 'wrap'
    },
    mainTitle: {
        textAlign: 'center',
        width: '100%'
    },
    headerDetails: {
        display: 'flex',
        alignItems: 'start',
        width: '100%'
    },
    avatar: {
        marginRight: '16px',
        flexGrow: 0,
        flexShrink: 0,
        border: '1px solid rgb(108,117,125)'
    },
    headerContent: {
        flexGrow: 1,
        flexShrink: 1
    },
    title: {
        width: '100%'
    },
    body: {
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        padding: '16px'
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 16px 16px'
    },
    bodyContent: {
        width: '100%'
    },
    textProgress: {
        width: '100%'
    },
    titleProgress: {
        width: '100%'
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
    postProgress: {
        backgroundColor: 'rgba(255,255,255)',
        position: 'absolute',
        bottom: 0,
        left: 0,
        opacity: .75,
        right: 0,
        top: 0,
        zIndex: 11,
        '&, & *': {
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
        },
        /* Style to apply to the last thumbnail, which will be the placeholder thumbnail except when 4 images are loaded, this will be overridden below */
        '&:last-child': {
            borderStyle: 'solid'
        }
    },
    contentMessage: {
        color: 'rgb(255,0,0,.5)',
        padding: '0 16px',
        textAlign: 'center',
        whiteSpace: 'pre',
        width: '100%'
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

export const NewPostForm = ({ onNewPostCreated }) => {
    const MAX_TEXT_LENGTH = 2000;
    const MAX_TITLE_LENGTH = 50;
    const MAX_ALLOWED_IMAGES = 4; // This value cannot be changed without making other changes throughout the file. It is set as a constant for readability and to make future updates a bit simpler
    
    // Redux
    const currentUserPfpSmall = useSelector(selectCurrentUserPfpSmall);
    const defaultConnectionTypes = useSelector(selectConnectionTypes);

    const getConnectionTypeDict = () => {
        if (defaultConnectionTypes) {
            return {...defaultConnectionTypes};
        }
        
        return {};
    }

    // State
    const [currentDate, setCurrentDate] = useState((new Date()).toLocaleString());

    const [state, setState] = useState({
        contentError: false,
        contentHelper: '',
        customAudience: [],
        files: [],
        images: [],
        isAudienceOpen: false,
        isDragging: false,
        isLoading: false,
        postAudience: Constants.POST_AUDIENCES.CONNECTIONS,
        postText: '',
        postTextHelper: '',
        postTitle: '',
        postTitleHelper: '',
        postType: Constants.POST_TYPES.TEXT,
        tempThumbnailFileName: '',
        textError: false,
        textLimit: 0,
        titleError: false,
        titleLimit: 0,
        connectionTypes: {}
    });

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (state.connectionTypes && Object.keys(state.connectionTypes).length === 0) {
            setState(prevState => ({
                ...prevState,
                connectionTypes: getConnectionTypeDict()
            }));
        }
    }, [defaultConnectionTypes]);

    useEffect(() => {
        if (popperUpdate) {
            popperUpdate();
        }
    }, [state.postAudience]);

    const classes = useStyles(state);

    // Popper
    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const { styles: popperStyles, update: popperUpdate } = usePopper(referenceElement, popperElement, {
        modifiers: [
        ],
        placement: 'bottom'
    });
    const dropdownMenuContainer = useRef();

    useEffect(() => {
        if (state.isAudienceOpen) {
            document.addEventListener('click', hideAudienceDropdown);

            return function cleanup() {
                document.removeEventListener('click', hideAudienceDropdown);
            }
        }
        else {
            document.removeEventListener('click', hideAudienceDropdown);
        }
    }, [state.isAudienceOpen]);

    const hideAudienceDropdown = (event) => {
        if (dropdownMenuContainer && !dropdownMenuContainer.current.contains(event.target)) {
            setState(prevState => ({
                ...prevState,
                isAudienceOpen: false
            }));
        }       
    };

    // References
    const dropArea = useRef(null);
    const dropOverlay = useRef(null);

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

    const selectEveryoneAudience = () => {
        setState(prevState => ({
            ...prevState,
            postAudience: Constants.POST_AUDIENCES.EVERYONE,
            customAudience: [],
            connectionTypes: getConnectionTypeDict() /* This will reset everything to false */
        }));
    };

    const selectConnectionsAudience = () => {
        setState(prevState => ({
            ...prevState,
            postAudience: Constants.POST_AUDIENCES.CONNECTIONS,
            customAudience: [],
            connectionTypes: getConnectionTypeDict() /* This will reset everything to false */
        }));
    };

    const filterFiles = async (files) => {
        let stateUpdates = {};

        if (files && files.length > 0) {
            // First, filter the files
            let imagesRemaining = MAX_ALLOWED_IMAGES - state.images.length; // Users can only upload a maximum of 4 images

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

                    stateUpdates.files = [
                        ...state.files,
                        ...filteredFiles
                    ];

                    stateUpdates.tempThumbnailFileName = '';

                    break;
                case Constants.POST_TYPES.VIDEO: {
                    let tempThumbnailFileName = URL.createObjectURL(await getVideoCover(filteredFiles[0]));

                    stateUpdates.images = [tempThumbnailFileName];
                    stateUpdates.files = [filteredFiles[0]];
                    stateUpdates.tempThumbnailFileName = tempThumbnailFileName;

                    break;
                }
                case Constants.POST_TYPES.AUDIO:
                    stateUpdates.images = [Constants.STATIC_IMAGES.WAVEFORM];
                    stateUpdates.files = [filteredFiles[0]];
                    stateUpdates.tempThumbnailFileName = '';

                    break;
                case Constants.POST_TYPES.TEXT:
                default:
                    stateUpdates.images = [];
                    stateUpdates.files = [];
                    stateUpdates.tempThumbnailFileName = '';

                    break;
            }
        }

        return stateUpdates;
    };

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
        let PlaceholderComponent = null;

        switch (state.postType) {
            case Constants.POST_TYPES.AUDIO:
                if (state.images.length === 0) {
                    PlaceholderComponent = EqualizerIcon;
                }

                break;
            case Constants.POST_TYPES.IMAGE:
                if (state.images.length < MAX_ALLOWED_IMAGES) {
                    PlaceholderComponent = PhotoOutlinedIcon;
                }
                
                break;
            case Constants.POST_TYPES.VIDEO:
                if (state.images.length === 0) {
                    PlaceholderComponent = VideocamOutlinedIcon;
                }

                break;
            case Constants.POST_TYPES.TEXT:
            default:
                break;
        }

        if (PlaceholderComponent) {
            return <div className={classes.imageThumbnail} style={{cursor: state.isLoading ? 'wait' : 'pointer'}}>
                <div className={classes.placeholderIcon} style={{display: state.isLoading ? 'block' : 'none'}}>
                    <CircularProgress />
                </div>
                <label style={{
                    width: '100%', 
                    height: '100%', 
                    display: state.isLoading ? 'none' : 'block',
                    cursor: state.isLoading ? 'wait' : 'pointer'
                }}>
                    <PlaceholderComponent className={classes.placeholderIcon} style={{
                        color: 'rgb(255,255,255)',
                        fontSize: '5vmin'
                    }} />
                    <input type='file' multiple style={{display: 'none'}} onChange={handleImageChange} />
                </label>
            </div>;
        }

        return <></>;
    };

    const getTextProgressColor = () => {
        return state.textLimit <= 90 ? 'primary' :
            state.textLimit < 100 ? 'warning' :
            'error';
    };

    const getTitleProgressColor = () => {
        return state.titleLimit <= 90 ? 'primary' :
            state.titleLimit < 100 ? 'warning' :
            'error';
    };

    const getImagesFullClass = () => {
        switch (state.postType) {
            case Constants.POST_TYPES.AUDIO:
                if (state.images.length === 1) {
                    return classes.imagesFull;
                }
            case Constants.POST_TYPES.IMAGE:
                if (state.images.length === MAX_ALLOWED_IMAGES) {
                    return classes.imagesFull;
                }
                
                break;
            case Constants.POST_TYPES.VIDEO:
                if (state.images.length === 1) {
                    return classes.imagesFull;
                }

                break;
            case Constants.POST_TYPES.TEXT:
            default:
                break;
        }
        
        return '';
    }

    const handleAudienceClick = (e) => {
        if (!state.isAudienceOpen) {
            popperUpdate(); // This fixes the position of the dropdown menu
        }

        setState(prevState => ({
            ...prevState,
            isAudienceOpen: !prevState.isAudienceOpen /* Toggle whether it's open */
        }));

        e.stopPropagation();
    };

    const handleImageChange = async (e) => {
        // Set loading state right away
        setState(prevState => ({
            ...prevState,
            isLoading: true
        }));

        let stateUpdates = {
            postType: Constants.POST_TYPES.TEXT,
            isLoading: false
        };

        let files = [...e.target.files];
        
        let additionalStateUpdates = await filterFiles(files);

        stateUpdates = {
            ...stateUpdates,
            ...additionalStateUpdates
        };

        setState(prevState => ({
            ...prevState,
            ...stateUpdates
        }));
    };

    const handleTextChange = (e) => {
        const {target} = e;
        const {name, value} = target;

        let stateUpdates = {
            [name]: value
        };

        if (name === 'postText') {
            if (state.textError && !isNullOrWhiteSpaceOnly(value)) {
                stateUpdates.textError = false;
                stateUpdates.postTextHelper = '';
            }

            let textLength = value.length;

            if (textLength <= MAX_TEXT_LENGTH) {
                stateUpdates.textLimit = Math.floor((textLength / MAX_TEXT_LENGTH) * 100);
            }
            else {
                stateUpdates.textLimit = 100;
            }
        }
        else if (name === 'postTitle') {
            if (state.titleError && !isNullOrWhiteSpaceOnly(value)) {
                stateUpdates.titleError = false;
                stateUpdates.postTitleHelper = '';
            }

            let titleLength = value.length;

            if (titleLength <= MAX_TITLE_LENGTH) {
                stateUpdates.titleLimit = Math.floor((titleLength / MAX_TITLE_LENGTH) * 100);
            }
            else {
                stateUpdates.titleLimit = 100;
            }
        }

        setState(prevState => ({
            ...prevState,
            ...stateUpdates
        }));
    };

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

        // Set loading state right away
        setState(prevState => ({
            ...prevState,
            isLoading: true
        }));

        let stateUpdates = {
            postType: Constants.POST_TYPES.TEXT,
            isDragging: false,
            isLoading: false
        };

        const files = [...e.dataTransfer.files];

        // Filter the files and get any additional state updates
        let additionalStateUpdates = await filterFiles(files);

        stateUpdates = {
            ...stateUpdates,
            ...additionalStateUpdates
        };

        // Finally, update the state with all updates
        setState(prevState => ({
            ...prevState,
            ...stateUpdates
        }));
    };

    const handleRemoveImage = (e, i) => {
        let { images, files } = state;
        let updatedImages = images.reduce((finalArray, currentItem, index) => {
            if (index !== i) {
                finalArray.push(currentItem);
            }

            return finalArray;
        }, []);

        let updatedFiles = files.reduce((finalArray, currentItem, index) => {
            if (index !== i) {
                finalArray.push(currentItem);
            }

            return finalArray;
        }, []);

        setState(prevState => ({
            ...prevState,
            images: updatedImages,
            files: updatedFiles
        }));
    };

    const handleCustomChange = (event) => {
        let { name, checked } = event.target;

        let stateUpdates = {
            postAudience: state.postAudience,
            connectionTypes: {
                [name]: checked
            },
            customAudience: state.customAudience
        };

        if (checked) {
            if (!state.customAudience.find(connectionType => connectionType === name)) {
                stateUpdates.postAudience = Constants.POST_AUDIENCES.CUSTOM;
                stateUpdates.customAudience = [
                    ...state.customAudience,
                    name
                ];
            }
        }
        else {
            let foundIndex = state.customAudience.findIndex(connectionType => connectionType === name);

            if (foundIndex >= 0) {
                let customAudience = state.customAudience.reduce((finalArray, currentItem, index,) => {
                    if (index !== foundIndex) {
                        finalArray.push(currentItem);
                    }

                    return finalArray;
                }, []);

                stateUpdates.postAudience = customAudience.length === 0 ? Constants.POST_AUDIENCES.CONNECTIONS : Constants.POST_AUDIENCES.CUSTOM;
                stateUpdates.customAudience = customAudience;
            }
        }

        setState(prevState => ({
            ...prevState,
            postAudience: stateUpdates.postAudience,
            connectionTypes: {
                ...prevState.connectionTypes,
                ...stateUpdates.connectionTypes
            },
            customAudience: stateUpdates.customAudience
        }));

        event.stopPropagation();
    };

    const resetForm = () => {
        setState(prevState => ({
            ...prevState,
            customAudience: [],
            files: [],
            images: [],
            postAudience: Constants.POST_AUDIENCES.CONNECTIONS, /*## This should be based off a preference */
            postText: '',
            postTitle: '',
            postType: Constants.POST_TYPES.TEXT,
            tempThumbnailFileName: '',
            textError: false,
            textLimit: 0,
            titleError: false,
            titleLimit: 0,
        }))
    };

    const validatePost = () => {
        let validationPassed = true;
        let stateUpdates = {};
        let contentHelper = '';

        switch (state.postType) {
            case Constants.POST_TYPES.IMAGE: {
                let contentError = false;

                // First make sure the number of files is between 1 and MAX_ALLOWED_IMAGES
                if (state.files.length > 0 && state.files.length <= MAX_ALLOWED_IMAGES && state.images.length === state.files.length) {
                    let totalFileSize = 0;

                    // Make sure all files are images. If they haven't been messing with the page, this should be the case
                    let index = -1;

                    for (let file of state.files) {
                        index++;

                        if (!file.type.startsWith('image/'))
                        {
                            contentError = true;
                            contentHelper += `${index > 0 ? '\n' : ''} File #${index + 1} is not an image.`;
                            continue;
                        }

                        if (file.name.length > 150) {
                            contentError = true;
                            contentHelper += `${index > 0 ? '\n' : ''} Image #${index + 1}'s file name is too long.`;
                            continue;
                        }

                        totalFileSize += file.size;

                        if (totalFileSize > Constants.MAX_UPLOAD_SIZE * 1024 * 1024) {
                            contentError = true;
                            contentHelper += `${index > 0 ? '\n' : ''} Image #${index + 1} pushes your total upload size past the limit.`;
                            continue;
                        }
                    }
                }
                else {
                    contentError = true;
                    contentHelper = 'Please select a file to upload (or upload less files).';
                }

                if (contentError) {
                    validationPassed = false;
                }

                stateUpdates = {
                    contentError,
                    contentHelper,
                    textError: false,
                    titleError: false,
                    postTextHelper: '',
                    postTitleHelper: ''
                };

                break;
            }
            case Constants.POST_TYPES.VIDEO: {
                let contentError = false;

                // First make sure the number of files is 1
                if (state.files.length === 1 && state.images.length === 1) {
                    let file = state.files[0];

                    // Make sure the file is a video. If they haven't been messing with the page, this should be the case
                    if (!file.type.startsWith('video/')) {
                        contentError = true;
                        contentHelper = `Please select a video to upload.`;
                    }

                    if (file.name.length > 150) {
                        contentError = true;
                        contentHelper += `${contentHelper.length === 0 ? '' : '\n'}The video's file name is too long.`;
                    }

                    if (file.size > Constants.MAX_UPLOAD_SIZE * 1024 * 1024) {
                        contentError = true;
                        contentHelper += `${contentHelper.length === 0 ? '' : '\n'}The video's file size is too large`;
                    }
                }
                else {
                    contentError = true;
                    contentHelper = `Please select a single video to upload`;
                }

                if (contentError) {
                    validationPassed = false;
                }

                stateUpdates = {
                    contentError,
                    contentHelper,
                    textError: false,
                    postTextHelper: false
                };

                // Make sure they have a title
                if (isNullOrWhiteSpaceOnly(state.postTitle)) {
                    stateUpdates.titleError = true;
                    stateUpdates.postTitleHelper = `Please fill in a title`;

                    validationPassed = false;
                }
                else {
                    stateUpdates.titleError = false;
                    stateUpdates.postTitleHelper = '';
                }

                break;
            }
            case Constants.POST_TYPES.AUDIO: {
                let contentError = false;

                // First make sure the number of files is 1
                if (state.files.length === 1 && state.images.length === 1) {
                    let file = state.files[0];

                    // Make sure the file is audio. If they haven't been messing with the page, this should be the case
                    if (!file.type.startsWith('audio/')) {
                        contentError = true;
                        contentHelper = `Please select an audio file to upload.`;
                    }

                    if (file.name.length > 150) {
                        contentError = true;
                        contentHelper += `${contentHelper.length === 0 ? '' : '\n'}The audio's file name is too long.`;
                    }

                    if (file.size > Constants.MAX_UPLOAD_SIZE * 1024 * 1024) {
                        contentError = true;
                        contentHelper += `${contentHelper.length === 0 ? '' : '\n'}The audio's file size is too large`;
                    }
                }
                else {
                    contentError = true;
                    contentHelper = `Please select a single audio file to upload`;
                }

                if (contentError) {
                    validationPassed = false;
                }

                stateUpdates = {
                    contentError,
                    contentHelper,
                    textError: false,
                    postTextHelper: false
                };

                // Make sure they have a title
                if (isNullOrWhiteSpaceOnly(state.postTitle)) {
                    stateUpdates.titleError = true;
                    stateUpdates.postTitleHelper = `Please fill in a title`;

                    validationPassed = false;
                }
                else {
                    stateUpdates.titleError = false;
                    stateUpdates.postTitleHelper = '';
                }

                break;
            }
            case Constants.POST_TYPES.TEXT:
            default: {
                stateUpdates = {
                    contentError: false,
                    contentHelper: '',
                    titleError: false,
                    postTitleHelper: ''
                };

                // If it's a text post, they have to fill in something, the text is not optional (the title is)
                if (isNullOrWhiteSpaceOnly(state.postText)) {
                    stateUpdates.textError = true;
                    stateUpdates.postTextHelper = `You can't post nothing!`;

                    validationPassed = false;
                }
                else {
                    stateUpdates.textError = false;
                    stateUpdates.postTextHelper = '';
                }

                break;
            }
        }

        setState(prevState => ({
            ...prevState,
            ...stateUpdates
        }));

        return validationPassed;
    };

    const validateAndPost = async () => {
        if (validatePost()) {
            setUploadProgress(0);
            setIsUploading(true);

            let postData = {
                audience: state.postAudience,
                postText: state.postText,
                postTitle: state.postTitle,
                postType: state.postType
            };

            if (state.postType !== Constants.POST_TYPES.TEXT) {
                postData.postFiles = state.files;
            }

            if (state.postAudience === Constants.POST_AUDIENCES.CUSTOM) {
                postData.customAudience = state.customAudience;
            }

            let newPost = await PostService.createNewPost(postData, (event) => {
                if (event.loaded === event.total) {
                    setIsUploading(false);
                }

                setUploadProgress(Math.round((100 * event.loaded) / event.total));
            });

            if (newPost) {
                if (state.postType === Constants.POST_TYPES.VIDEO) {
                    newPost.postFiles[0].thumbnailFileName = state.tempThumbnailFileName;
                }

                resetForm();
                onNewPostCreated(newPost);
            }
        }
    };

    return (
        <form className="col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 mb-2">
            <Paper elevation={3} className={classes.root} ref={dropArea} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
                <div className={classes.header}>
                    <div className={classes.mainTitle}>
                        <Typography variant="h6" gutterBottom>
                            New Post
                        </Typography>
                    </div>
                    <div className={classes.headerDetails}>
                        <Avatar className={classes.avatar} src={currentUserPfpSmall} />
                        <div className={classes.headerContent}>
                            <MaterialTextfield name="postTitle" label={`Post Title${state.postType === Constants.POST_TYPES.AUDIO || state.postType === Constants.POST_TYPES.VIDEO ? '' :  ' (optional)'}`} size="small" variant="filled" className={classes.title} inputProps={{'maxLength': MAX_TITLE_LENGTH}} value={state.postTitle} onChange={handleTextChange} error={state.titleError} helperText={state.postTitleHelper} />
                            <LinearProgress className={classes.titleProgress} variant="determinate" value={state.titleLimit} color={getTitleProgressColor()} aria-valuetext={`${state.titleLimit} Percent of Title Characters Used`} />
                            <div>
                                {currentDate}
                            </div>
                        </div>
                    </div>
                </div>
                <div className={classNames(classes.previewImages, getImagesFullClass())}
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
                                        onClick={e => handleRemoveImage(e, index)} 
                                    />
                                </div>
                            </div>
                        ))
                    }
                    {
                        getPlaceholderThumbnail()
                    }
                </div>
                {
                    state.contentError &&
                    <div className={classes.contentMessage}>
                        {state.contentHelper}
                    </div>
                }
                <Divider light={true} variant='middle' />
                <div className={classes.body}>
                    <MaterialTextfield name="postText" className={classes.bodyContent} multiline variant="filled" label={`Post Text${state.postType === Constants.POST_TYPES.TEXT ? '' :  ' (optional)'}`} inputProps={{'maxLength': MAX_TEXT_LENGTH}} value={state.postText} onChange={handleTextChange} error={state.textError} helperText={state.postTextHelper} />
                    <LinearProgress className={classes.textProgress} variant="determinate" value={state.textLimit} color={getTextProgressColor()} aria-valuetext={`${state.textLimit} Percent of Text Characters Used`} />
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
                    <div ref={dropdownMenuContainer} className="dropdown">
                        <button ref={setReferenceElement} 
                            className={classNames("btn btn-outline-primary dropdown-toggle", {'show': state.isAudienceOpen})}
                            type="button" 
                            onClick={handleAudienceClick}
                        >
                                {getCurrentAudience()}
                        </button>
                        <ul ref={setPopperElement} 
                            className={classNames('dropdown-menu', 'px-2', {'show': state.isAudienceOpen})}
                            style={popperStyles.popper}
                            {...popperStyles.popper}
                        >
                            <li className="dropdown-header">Generic</li>
                            <li><button className="dropdown-item" type="button" onClick={selectEveryoneAudience}>Everyone</button></li>
                            <li><button className="dropdown-item" type="button" onClick={selectConnectionsAudience}>Outgoing Connections</button></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li className="dropdown-header">Custom</li>
                            {
                                state.connectionTypes
                                ? Object.entries(state.connectionTypes).map(([connectionType, details]) => (
                                    <SwitchCheckbox key={connectionType} label={connectionType} isChecked={details} onSwitchChanged={handleCustomChange} useListItem />
                                ))
                                : <></>
                            }
                        </ul>
                    </div>
                    <button className="btn btn-primary" type="button" onClick={validateAndPost}>Post</button>
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
                <div className={classes.postProgress} style={{ display: isUploading ? 'flex' : 'none' }}>
                    <div className="progress-bar progress-bar-striped progress-bar-animated" 
                        aria-valuenow={uploadProgress} 
                        aria-valuemin="0" 
                        aria-valuemax="100" 
                        role="progressbar" 
                        style={{
                            bottom: 0,
                            height: `${uploadProgress}%`,
                            position: 'absolute',
                            width: '100%'
                        }}
                    >
                        Uploading... ({uploadProgress}%)
                    </div>
                </div>
            </Paper>
        </form>
    );
}