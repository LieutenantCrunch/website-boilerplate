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
            setFileInfos(response.data);
            props.setProfilePic('/api/users/pfp/get');
        }, []).catch((err) => {
            console.error(err.message);
        });
    })

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
            }).then((pfp) => {
                setFileInfos(pfp.data);
            }).catch(() => {
                setProgress(0);
                setMessage('Failed to upload');
                setCurrentFile(undefined);
            });
        }
    };

    return (
        <>
            {currentFile && (
                <div className="progress">
                    <div className="progress-bar progress-bar-animated progress-bar-info progress-bar-striped"
                    aria-valuenow={progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style={{height: progress + '%'}}
                    >
                        {progress}%
                    </div>
                </div>
            )}
            <input type="file" onChange={selectPicture} style={{visibility: 'hidden', height: 0, width: 0}} />
        </>
    );
}

export default ProfilePictureUpload;