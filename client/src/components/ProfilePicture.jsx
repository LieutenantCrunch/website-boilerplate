import React from 'react';

function ProfilePicture (props) {
    /* width: 100% + padding-top: 100% for aspect ratio: https://www.w3schools.com/howto/howto_css_aspect_ratio.asp */
    return (
        <label className="w-25" style={{
            position: 'relative'
        }}>
            <div className="border border-secondary rounded-circle" style={{
            overflow: 'hidden'
            }}>
                <div style={{
                    width: '100%',
                    paddingTop: '100%',
                    position: 'relative'
                }}>
                    <div style={{
                        backgroundImage: `url('/${props.pfpSmall}')`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        bottom: 0,
                        left: 0,
                        position: 'absolute',
                        right: 0,
                        top: 0
                    }}>
                    </div>
                </div>
            </div>
        </label>
    );
}

export default ProfilePicture;