import React, {useState, useEffect} from 'react';
import UploadService from '../services/upload.service';

function ProfilePictureUpload (props) {
    const [selectedFile, setSelectedFile] = useState(undefined);
    const [currentFile, setCurrentFile] = useState(undefined);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [fileInfos, setFileInfos] = useState([]);

    useEffect(() => {
        UploadService.getPFP().then((response) => {
            // Don't trigger this while waiting for an upload to finish, we don't want the image to change until the temp object has loaded it
            if (!currentFile && response.data.path) {
                props.setProfilePic(response.data.path);
            }
        }, []).catch((err) => {
            console.error(err.message);
        });
    })

    const imageLoadHandler = (imageSrc) => {
        const tempImage = new Image();
        tempImage.src = imageSrc;
        tempImage.onload = (event) => {
            console.log(`Load: ${Date.now()}`);
            props.setProfilePic(imageSrc)
            setCurrentFile(undefined);
            console.log(`End: ${Date.now()}`);
        };
    };

    const selectPicture = (event) => {
        if (event.target.files && event.target.files[0]) {
            let selectedFile = event.target.files[0];
            setProgress(0);
            setCurrentFile(selectedFile);

            UploadService.uploadPFP(selectedFile, (event) => {
                setProgress(Math.round((100 * event.loaded) / event.total));
            }).then((response) => {
                setMessage(response.data.message);
                return UploadService.getPFP();
            }).then((response) => {
                console.log(`Start: ${Date.now()}`);
                imageLoadHandler(response.data.path);
                //props.setProfilePic(response.data.path);
                //setCurrentFile(undefined);
            }).catch((err) => {
                setProgress(0);
                setMessage(`Failed to upload: ${err.message}`);
                setCurrentFile(undefined);
            });
        }
    };

    /* width: 100% + padding-top: 100% for aspect ratio: https://www.w3schools.com/howto/howto_css_aspect_ratio.asp */
    return (
        <label className="rounded-circle w-25" style={{
            cursor: currentFile ? 'wait' : 'pointer',
            overflow: 'hidden'
            }}>
            <div style={{
                width: '100%',
                paddingTop: '100%',
                position: 'relative'
            }}>
                <div style={{
                    backgroundImage: `url('${props.profilePic}')`,
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
                        style={{
                            bottom: 0,
                            height: progress + '%', 
                            position: 'absolute',
                            width: '100%'
                        }}>
                            {progress}%
                        </div>
                    </div>
                )}
            </div>
        </label>
    );
}

export default ProfilePictureUpload;