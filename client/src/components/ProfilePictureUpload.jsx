import React, {useState, useEffect} from 'react';
import {isMobile} from 'react-device-detect';

import UploadService from '../services/upload.service';

import SmallAddButton from './SmallAddButton';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { currentUserPfpUpdated, selectCurrentUserPfpSmall } from '../redux/users/currentUserSlice';

function ProfilePictureUpload (props) {
    const dispatch = useDispatch();
    const [currentFile, setCurrentFile] = useState(undefined);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const currentUserPfpSmall = useSelector(selectCurrentUserPfpSmall);

    // Load the image in the background
    // When it's loaded, update the state with the new url
    // Clear the current file and set is processing to false
    const imageLoadHandler = (pfp, pfpSmall) => {
        const tempImage = new Image();
        tempImage.src = pfp;
        tempImage.onload = (e) => {
            dispatch(currentUserPfpUpdated({pfp, pfpSmall}));
            setCurrentFile(undefined);
            setIsProcessing(false);
        };
    };

    // When the user selects a file
    // Get a reference to it
    // Set the progress to 0
    // Set the current file to the selected file
    // Upload the selected file
    // When it's finished, get the profile picture URL from the server
    // Call the imageLoadHandler with the new URL
    const selectPicture = (event) => {
        if (event.target.files && event.target.files[0]) {
            let selectedFile = event.target.files[0];
            setProgress(0);
            setCurrentFile(selectedFile);

            UploadService.uploadPFP(selectedFile, (event) => {
                if (event.loaded === event.total) {
                    setIsProcessing(true);
                }

                setProgress(Math.round((100 * event.loaded) / event.total));
            }).then(results => {
                imageLoadHandler(results.pfp, results.pfpSmall);
            }).catch((err) => {
                setProgress(0);
                setCurrentFile(undefined);
                console.error(err.message);
            });
        }
    };

    /* width: 100% + padding-top: 100% for aspect ratio: https://www.w3schools.com/howto/howto_css_aspect_ratio.asp */
    return (
        <label className="w-25" style={{
            cursor: currentFile ? 'wait' : 'pointer',
            position: 'relative'
        }} title={`${isMobile ? 'Tap' : 'Click'} to add a new Profile Picture`}>
            <div className="border border-secondary rounded-circle" style={{
            overflow: 'hidden'
            }}>
                <div style={{
                    width: '100%',
                    paddingTop: '100%',
                    position: 'relative'
                }}>
                    <div style={{
                        backgroundImage: `url('${currentUserPfpSmall}')`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        bottom: 0,
                        left: 0,
                        position: 'absolute',
                        right: 0,
                        top: 0
                    }}>
                        <input type="file" disabled={currentFile ? true : false} onChange={selectPicture} style={{
                            visibility: 'hidden', 
                            height: 0, 
                            width: 0
                        }} /> 
                    </div>

                    {currentFile && (
                        <div className="progress rounded-circle" style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            opacity: '50%',
                            width: '100%'
                        }}>
                            <div className="progress-bar progress-bar-animated progress-bar-info progress-bar-striped"
                            aria-valuenow={progress}
                            aria-valuemin="0"
                            aria-valuemax="100"
                            role="progressbar"
                            style={{
                                bottom: 0,
                                height: progress + '%', 
                                position: 'absolute',
                                width: '100%'
                            }}>
                                {isProcessing ? 'Processing' : progress + '%'}
                            </div>
                        </div>
                    )}
                </div>
                <SmallAddButton width={15} height={15} style={{
                    position: 'absolute',
                    top: 0,
                    right: 0
                }} />
            </div>
        </label>
    );
}

export default ProfilePictureUpload;