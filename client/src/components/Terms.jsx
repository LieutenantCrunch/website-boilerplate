import React, { useEffect } from 'react';

export const Terms = ({ setTitle }) => {
    useEffect(() => {
        setTitle('Terms of Service');
    }, []);
    return (
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 mt-2 align-middle text-left">
            <div className="mb-2">
                So you want to use my website, huh? Well, I know that nobody really reads Terms of Service anyway, so I'll try to keep it simple.
                If you register for my website, you agree to the following:
            </div>
            <ul className="list-group">
                <li className="list-group-item">
                    You will not hold me legally responsible for anything related to this website.
                    I just built this thing to improve my skills so I could get a job. There's no security team to ensure your data is safe or that best practices are being followed 100%.
                </li>
                <li className="list-group-item">
                    Don't use a password for this website that you use elsewhere.
                    Passwords are encrypted and are not stored in plain text, but it's just general bad practice to reuse passwords.
                </li>
                <li className="list-group-item">
                    I reserve the right to delete anything I find on this website.
                </li>
                <li className="list-group-item">
                    Don't post anything here you wouldn't want the entire world to see.
                </li>
                <li className="list-group-item">
                    Don't post stuff you don't have the rights to post (i.e. mp3s/videos/whatever that could get you or me nailed with a copyright notice).
                </li>
                <li className="list-group-item">
                    Don't use this site to launch a nuclear missile. I don't know how you would, but that seems to be a popular thing to put in terms of service.
                </li>
            </ul>
        </div>
    );
};