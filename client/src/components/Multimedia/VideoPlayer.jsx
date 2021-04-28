import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { isIOS } from 'react-device-detect';

// Material UI
import { makeStyles } from '@material-ui/core/styles';

// Material UI Icons
import PauseRoundedIcon from '@material-ui/icons/PauseRounded';
import PlayArrowRoundedIcon from '@material-ui/icons/PlayArrowRounded';
import SkipPreviousRoundedIcon from '@material-ui/icons/SkipPreviousRounded';
import VolumeUpRoundedIcon from '@material-ui/icons/VolumeUpRounded';
import VolumeOffRoundedIcon from '@material-ui/icons/VolumeOffRounded';
import PlayCircleOutlineRoundedIcon from '@material-ui/icons/PlayCircleOutlineRounded';
import PauseCircleOutlineRoundedIcon from '@material-ui/icons/PauseCircleOutlineRounded';
import FullscreenRoundedIcon from '@material-ui/icons/FullscreenRounded';
import FullscreenExitRoundedIcon from '@material-ui/icons/FullscreenExitRounded';

// Material UI Styles
const useStyles = makeStyles(() => ({
    borderDiv: {
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '0 0 6px 6px',
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        overflow: 'hidden',
        position: 'relative',
        '&:fullscreen': {
            '&.mouseMoving': {
                '& $video': {
                    cursor: 'pointer'
                },
                '& $controls': {
                    transform: 'translateY(0)'
                }
            },
            '& $video': {
                cursor: 'none',
                maxHeight: '100vmin',
                position: 'absolute'
            },
            '& $controls': {
                transform: 'translateY(100%)',
                transition: 'transform 1s'
            }
        }
    },
    video: {
        cursor: 'pointer',
        maxHeight: '70vmin', /* This is thanks to stupid iOS once again, which is displaying the video way too tall (its original height) even though it shrinks the width down and scales the video */
        position: 'relative',
        width: '100%',
    },
    videoThumbnail: {
        alignItems: 'center',
        backgroundColor: 'rgb(0,0,0)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        borderStyle: 'none',
        cursor: 'pointer',
        justifyContent: 'center',
        position: 'absolute',
        height: '100%',
        width: '100%'
    },
    thumbnailPlayIcon: {
        pointerEvents: 'none'
    },
    controls: {
        position: 'relative',
        width: '100%',
    },
    controlButtons: {
        alignItems: 'center',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0))',
        display: 'flex',
        height: '2em',
        justifyContent: 'space-between',
        position: 'relative',
        width: '100%',
    },
    leftControls: {
        alignItems: 'center',
        display: 'flex',
        height: '2em',
        justifyContent: 'flex-start',
        '& > *': {
            margin: '0 3px'
        }
    },
    rightControls: {
        alignItems: 'center',
        display: 'flex',
        height: '2em',
        justifyContent: 'flex-end',
        '& > *': {
            margin: '0 3px'
        }
    },
    progressBar: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
        border: '1px solid rgb(0,162,232)',
        cursor: 'pointer',
        display: 'flex',
        height: '1em',
        position: 'relative',
        width: '100%'
    },
    progress: {
        backgroundColor: 'rgb(0,162,232)',
        height: '100%',
        left: 0,
        opacity: 0.5,
        pointerEvents: 'none',
        position: 'absolute',
        top: 0
    },
    progressScrubber: {
        backgroundColor: 'rgb(255,255,255)',
        border: '1px solid rgb(0,162,232)',
        height: '1.2em',
        left: '-4px',
        marginLeft: '-4px',
        pointerEvents: 'none',
        position: 'absolute',
        width: '7px'
    },
    volumeRange: {
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
        cursor: 'pointer',
        width: '33%',
        height: '1em',
        backgroundColor: 'rgba(255,255,255,0.5)',
        border: '2px solid rgb(0,0,0)',
        borderRadius: '5px',
        outline: 'none',
        '&::-webkit-slider-thumb, &::-moz-range-thumb': {
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
            backgroundColor: 'rgb(0,0,0)',
            borderRadius: '5px',
            borderStyle: 'none',
            height: '1.5em',
            width: '5px'
        }    
    }
}));

export const VideoPlayer = ({sourceFile, thumbnail}) => {
    // State
    const FPS = 30;
    const PROGRESS_DELAY = parseInt(1000 / FPS);

    const borderDiv = useRef(null);
    const videoEl = useRef(null);

    const [state, setState] = useState({
        fullScreen: false,
        muted: false,
        paused: true,
        progressLeft: '0',
        progressTimer: null,
        progressMouseDown: false,
        progressMouseDownX: 0,
        playedOnce: false,
        previousVolume: 0.5,
        volume: 0.5
    });

    const [touchX, setTouchX] = useState(0);

    useEffect(() => {
        if (sourceFile !== null && videoEl.current) {
            const handleVideoEnded = (e) => {
                if (progressDiv.current) {
                    progressDiv.current.style.width = '100%';
                }

                setState(prevState => ({
                    ...prevState,
                    paused: true
                }));
            };

            const handleVideoPause = (e) => {
                setState(prevState => ({
                    ...prevState,
                    paused: true
                }));
            };

            const handleVideoPlay = (e) => {
                setState(prevState => ({
                    ...prevState,
                    paused: false
                }));
            };

            videoEl.current.addEventListener('ended', handleVideoEnded);

            if (isIOS) {
                videoEl.current.addEventListener('pause', handleVideoPause);
                videoEl.current.addEventListener('play', handleVideoPlay);
            }

            return () => {
                if (videoEl.current) {
                    videoEl.current.removeEventListener('ended', handleVideoEnded);

                    if (isIOS) {
                        videoEl.current.removeEventListener('pause', handleVideoPause);
                        videoEl.current.removeEventListener('play', handleVideoPlay);
                    }
                }
            };
        }
    }, [sourceFile]);
    
    const progressDiv = useRef(null);
    const progressScrubberDiv = useRef(null);

    useEffect(() => {
        if (state.paused) {
            if (state.progressTimer) {
                clearInterval(state.progressTimer);
            }
        }
        else {
            const progressTimer = setInterval(() => {
                if (progressDiv.current) {
                    let { currentTime, duration } = videoEl.current;

                    progressDiv.current.style.width = `${(currentTime / duration) * 100}%`;
                }
            }, PROGRESS_DELAY);

            setState(prevState => ({
                ...prevState,
                progressTimer
            }));

            return () => clearInterval(progressTimer);
        }
    }, [state.paused]);

    useEffect(() => {
        const unsetFullscreen = () => {
            setState(prevState => ({
                ...prevState,
                fullScreen: false
            }));
        }

        if (state.fullScreen) {
            borderDiv.current.addEventListener('fullscreenchange', unsetFullscreen);
        }

        return () => {
            if (borderDiv.current) {
                borderDiv.current.removeEventListener('fullscreenchange', unsetFullscreen);
            }
        }
    }, [state.fullScreen]);

    const classes = useStyles();

    const togglePaused = async () => {
        if (videoEl.current) {
            if (state.paused) {
                try
                {
                    await videoEl.current.play();
                    setState(prevState => ({
                        ...prevState,
                        paused: false,
                        playedOnce: true
                    }));
                }
                catch (err)
                {
                    console.error(`Failed to start video:\n${err.message}`);
                }
                
            }
            else {
                videoEl.current.pause();
                setState(prevState => ({
                    ...prevState,
                    paused: true
                }));
            }
        }
    };

    const toggleMute = async () => {
        if (videoEl.current) {
            let { muted: isMuted } = videoEl.current;
            
            if (isMuted) {
                videoEl.current.muted = false;

                if (!isIOS) {
                    videoEl.current.volume = state.previousVolume;
                }

                setState(prevState => ({
                    ...prevState,
                    muted: false,
                    volume: prevState.previousVolume
                }));
            }
            else {
                videoEl.current.muted = true;

                if (!isIOS) {
                    videoEl.current.volume = 0;
                }

                setState(prevState => ({
                    ...prevState,
                    muted: true,
                    previousVolume: prevState.volume,
                    volume: 0
                }));
            }
        }
    };

    const seekToBeginning = () => {
        if (videoEl.current) {
            videoEl.current.currentTime = 0;

            if (progressDiv.current) {
                progressDiv.current.style.width = 0;
            }

            setState(prevState => ({
                ...prevState,
                currentTime: 0,
                progressLeft: '0'
            }));
        }
    };

    const handleBorderDivMouseMove = (e) => {
        if (state.fullScreen) {
            if (state.idleTimer) {
                clearTimeout(state.idleTimer);
            }

            let idleTimer = setTimeout(() => {
                setState(prevState => ({
                    ...prevState,
                    mouseMoving: false,
                    idleTimer: null
                }));
            }, 1000);

            setState(prevState => ({
                ...prevState,
                mouseMoving: true,
                idleTimer
            }));
        }
    };

    const handleVideoClick = (e) => {
        if (!isIOS) {
            togglePaused();
        }
    };

    const handleProgressBarMouseEnter = (e) => {
        if (!isIOS && progressScrubberDiv.current) {
            let { x: progressBarX } = e.target.getBoundingClientRect();
            let { clientX: mouseX } = e;

            let difference = mouseX - progressBarX;

            progressScrubberDiv.current.style.left = `${difference}px`;
        }
    };

    const handleProgressBarTouchStart = (e) => {
        if (isIOS && state.playedOnce && progressScrubberDiv.current) {
            let { x: progressBarX } = e.touches[0].target.getBoundingClientRect();
            let { clientX: mouseX } = e.touches[0];

            let difference = mouseX - progressBarX;

            setTouchX(difference);

            progressScrubberDiv.current.style.left = `${difference}px`;
        }
    };

    const handleProgressBarTouchMove = (e) => {
        if (isIOS && state.playedOnce && progressScrubberDiv.current) {
            let { x: progressBarX, width: progressBarW } = e.touches[0].target.getBoundingClientRect();
            let { clientX: mouseX } = e.touches[0];

            let difference = mouseX - progressBarX;

            if (difference > progressBarW) {
                difference = progressBarW;
            }
            else if (difference < 0) {
                difference = 0;
            }

            setTouchX(difference);

            progressScrubberDiv.current.style.left = `${difference}px`;
        }
    };

    const handleProgressBarMouseClick = (e) => {
        if (!isIOS) {
            let { x: progressBarX, width: progressBarW } = e.target.getBoundingClientRect();
            let { clientX: mouseX } = e;
            let { duration } = videoEl.current;

            let position = mouseX - progressBarX;
            let percentage = position / progressBarW;
            let currentTime = duration * percentage;

            videoEl.current.currentTime = currentTime;

            if (progressDiv.current) {
                progressDiv.current.style.width = `${percentage * 100}%`;
            }
        }
    };

    const handleProgressBarMouseLeave = (e) => {
        if (!isIOS && progressScrubberDiv.current) {
            progressScrubberDiv.current.style.left = '';
        }
    };

    const handleProgressBarTouchCancel = (e) => {
        if (isIOS && progressScrubberDiv.current) {
            progressScrubberDiv.current.style.left = '';
        }
    };

    const handleProgressBarTouchEnd = (e) => {
        if (isIOS && state.playedOnce) { /* iOS is stupid and doesn't let you mess around with the currentTime until the video has played at least once */
            try
            {
                let { width: progressBarW } = e.target.getBoundingClientRect();
                let { duration } = videoEl.current;

                let position = touchX;
                let percentage = position / progressBarW;
                let currentTime = duration * percentage;

                videoEl.current.currentTime = currentTime;

                if (progressDiv.current) {
                    progressDiv.current.style.width = `${percentage * 100}%`;
                }

                if (progressScrubberDiv.current) {
                    progressScrubberDiv.current.style.left = '';
                }
            }
            catch(err)
            {
                outputDiv.current.innerText = err.message;
            }
        }
    };

    const handleProgressBarMouseMove = (e) => {
        if (!isIOS && progressScrubberDiv.current) {
            let { x: progressBarX } = e.target.getBoundingClientRect();
            let { clientX: mouseX } = e;

            let difference = mouseX - progressBarX;

            progressScrubberDiv.current.style.left = `${difference}px`;
        }
    };

    const handleVolumeChange = (e) => {
        let {value} = e.target;
        let volume = parseFloat(value);
        let muted = volume === 0;

        setState(prevState => ({
            ...prevState,
            volume,
            muted
        }));

        videoEl.current.volume = volume;
        videoEl.current.muted = muted;
    };

    const handleFullScreenClick = async (e) => {
        let el = borderDiv.current;

        try {
            if (el.requestFullscreen) {
                await el.requestFullscreen();
            }
            else if (el.webkitRequestFullscreen) {
                await el.webkitRequestFullscreen();
            }
            else if (el.msRequestFullscreen) { 
                await el.msRequestFullscreen();
            }

            setState(prevState => ({
                ...prevState,
                fullScreen: true
            }));
        }
        catch (err) {
            handleFullScreenExitClick(e);
            console.error(err.message);
        }
    }

    const handleFullScreenExitClick = async (e) => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
            else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            }
            else if (document.msExitFullscreen) { 
                await document.msExitFullscreen();
            }

            setState(prevState => ({
                ...prevState,
                fullScreen: false
            }));
        }
        catch (err) {
            console.error(err.message);
        }
    };

    return <div ref={borderDiv} 
        className={classNames(classes.borderDiv, state.mouseMoving ? 'mouseMoving' : '')}
        onMouseMove={handleBorderDivMouseMove}
    >
        <video ref={videoEl} className={classes.video} poster={thumbnail} onClick={handleVideoClick} controls={isIOS} playsInline={isIOS}>
            <source src={sourceFile} type="video/mp4" />
        </video>
        {
            !isIOS && <div className={classes.controls}>
                <div className={classes.progressBar}
                    onMouseEnter={handleProgressBarMouseEnter}
                    onClick={handleProgressBarMouseClick}
                    onMouseLeave={handleProgressBarMouseLeave}
                    onMouseMove={handleProgressBarMouseMove}
                    onTouchCancel={handleProgressBarTouchCancel}
                    onTouchEnd={handleProgressBarTouchEnd}
                    onTouchMove={handleProgressBarTouchMove}
                    onTouchStart={handleProgressBarTouchStart}
                >
                    <div ref={progressDiv} className={classes.progress} style={{width: 0}}></div>
                    <div ref={progressScrubberDiv} className={classes.progressScrubber}></div>
                </div>
                <div className={classes.controlButtons}>
                    <div className={classes.leftControls}>
                        {
                            <SkipPreviousRoundedIcon onClick={seekToBeginning} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} titleAccess="Return to start" />
                        }
                        {
                            state.paused
                            ? <PlayArrowRoundedIcon onClick={togglePaused} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} titleAccess="Play video" />
                            : <PauseRoundedIcon onClick={togglePaused} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} titleAccess="Pause video" />
                        }
                        {
                            state.muted
                            ? <VolumeOffRoundedIcon onClick={toggleMute} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} titleAccess="Unmute video" />
                            : <VolumeUpRoundedIcon onClick={toggleMute} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} titleAccess="Mute video" />
                        }
                        {
                            !isIOS && <input className={classes.volumeRange} type="range" min="0" max="1" step="0.01" value={state.volume} onChange={handleVolumeChange} title="Adjust volume" />
                        }
                    </div>
                    <div className={classes.rightControls}>
                        {
                            document.fullscreenEnabled && (
                                state.fullScreen
                                ? <FullscreenExitRoundedIcon onClick={handleFullScreenExitClick} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} titleAccess="Exit fullscreen" />
                                : <FullscreenRoundedIcon onClick={handleFullScreenClick} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} titleAccess="Enter fullscreen" />
                            )
                        }
                    </div>
                </div>
            </div>
        }
    </div>;
};