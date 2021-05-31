import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { isMobile } from 'react-device-detect';

// Material UI
import { makeStyles } from '@material-ui/core/styles';

// Material UI Icons
import PauseRoundedIcon from '@material-ui/icons/PauseRounded';
import PlayArrowRoundedIcon from '@material-ui/icons/PlayArrowRounded';
import SkipPreviousRoundedIcon from '@material-ui/icons/SkipPreviousRounded';
import VolumeUpRoundedIcon from '@material-ui/icons/VolumeUpRounded';
import VolumeOffRoundedIcon from '@material-ui/icons/VolumeOffRounded';

// Material UI Styles
const useStyles = makeStyles(() => ({
    borderDiv: {
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'flex',
        width: '100%',
        height: '100%',
        flexWrap: 'wrap'
    },
    audioThumbnail: {
        backgroundColor: 'rgb(255,255,255)',
        borderStyle: 'none',
        cursor: 'pointer',
        position: 'relative',
        width: '100%',
        '&.disabled': {
            cursor: 'default',
            pointerEvents: 'none',
            '& $progress': {
                backgroundColor: 'rgb(200,200,200)'
            },
            '& $progressScrubber': {
                border: '1px solid rgb(200,200,200)'
            }
        }
    },
    actualThumbnail: {
        pointerEvents: 'none',
        width: '100%'
    },
    controls: {
        alignItems: 'center',
        display: 'flex',
        height: '2em',
        justifyContent: 'flex-start',
        width: '100%',
        '& > *': {
            margin: '0 3px'
        }
    },
    progress: {
        backgroundColor: 'rgb(0,162,232)',
        height: '100%',
        marginLeft: '-2px',
        opacity: 0.5,
        pointerEvents: 'none',
        position: 'absolute',
        width: '5px',
        top: 0
    },
    progressScrubber: {
        backgroundColor: 'rgb(255,255,255)',
        border: '1px solid rgb(0,162,232)',
        height: '100%',
        left: '-5px',
        marginLeft: '-2px',
        opacity: 0.5,
        pointerEvents: 'none',
        position: 'absolute',
        width: '5px',
        top: 0,
    },
    volumeRange: {
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
        width: '25%',
        height: '1em',
        background: 'rgb(255,255,255)',
        border: '2px solid rgb(0,0,0)',
        borderRadius: '5px',
        outline: 'none',
        '&::-webkit-slider-thumb, &::-moz-range-thumb': {
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
            cursor: 'pointer',
            backgroundColor: 'rgb(0,0,0)',
            borderRadius: '5px',
            borderStyle: 'none',
            height: '1.5em',
            width: '5px'
        }    
    }
}));

export const AudioPlayer = ({sourceFile, thumbnail}) => {
    // State
    const FPS = 30;
    const PROGRESS_DELAY = parseInt(1000 / FPS);

    const [state, setState] = useState({
        audio: null,
        paused: true,
        muted: false,
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
        if (sourceFile !== null) {
            const handleAudioEnded = (e) => {
                if (progressDiv.current) {
                    progressDiv.current.style.left = '100%';
                }

                setState(prevState => ({
                    ...prevState,
                    paused: true
                }));
            };

            let audio = new Audio(sourceFile);

            audio.preload = 'none';
            audio.volume = state.volume;
            audio.addEventListener('ended', handleAudioEnded);

            setState(prevState => ({
                ...prevState,
                audio
            }));

            return () => {
                audio.removeEventListener('ended', handleAudioEnded);
            };
        }
    }, [sourceFile]);
    
    const progressDiv = useRef(null);
    const progressScrubberDiv = useRef(null);

    /*// This works, but it's way too choppy
    useEffect(() => {
        if (!state.audio) {
            return;
        }

        const setAudioTime = () => {
            let progressLeft = '0';

            const main = mainDiv.current;
            const width = main?.offsetWidth || 0;
            const { currentTime, duration } = state.audio;

            let widthToDurationRatio = 0;

            if (duration !== 0) {
                widthToDurationRatio = width / duration;
            }

            let currentLeft = currentTime * widthToDurationRatio;

            progressLeft = `${currentLeft}px`;

            setState(prevState => ({
                ...prevState,
                currentTime,
                progressLeft
            }));
        };

        state.audio.addEventListener('timeupdate', setAudioTime);

        return () => {
            state.audio.removeEventListener('timeupdate', setAudioTime);
        };
    });*/

    useEffect(() => {
        if (state.paused) {
            if (state.progressTimer) {
                clearInterval(state.progressTimer);
            }
        }
        else {
            const progressTimer = setInterval(() => {
                if (progressDiv.current) {
                    let { currentTime, duration } = state.audio;

                    progressDiv.current.style.left = `${(currentTime / duration) * 100}%`;
                }
            }, PROGRESS_DELAY);

            setState(prevState => ({
                ...prevState,
                progressTimer
            }));

            return () => clearInterval(progressTimer);
        }
    }, [state.paused])

    const classes = useStyles();

    const togglePaused = async () => {
        if (state.audio) {
            if (state.paused) {
                try
                {
                    await state.audio.play();
                    setState(prevState => ({
                        ...prevState,
                        paused: false,
                        playedOnce: true
                    }));
                }
                catch (err)
                {
                    console.error(`Failed to start audio:\n${err.message}`);
                }
                
            }
            else {
                state.audio.pause();
                setState(prevState => ({
                    ...prevState,
                    paused: true
                }));
            }
        }
    };

    const toggleMute = async () => {
        if (state.audio) {
            let isMuted = state.audio.muted;
            
            if (isMuted) {
                state.audio.muted = false;

                if (!isMobile) {
                    state.audio.volume = state.previousVolume;
                }

                setState(prevState => ({
                    ...prevState,
                    muted: false,
                    volume: prevState.previousVolume
                }));
            }
            else {
                state.audio.muted = true;

                if (!isMobile) {
                    state.audio.volume = 0;
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
        if (state.audio) {
            state.audio.currentTime = 0;

            if (progressDiv.current) {
                progressDiv.current.style.left = 0;
            }

            setState(prevState => ({
                ...prevState,
                currentTime: 0,
                progressLeft: '0'
            }));
        }
    };

    const handleThumbnailMouseEnter = (e) => {
        if (!isMobile && progressScrubberDiv.current) {
            let { x: thumbnailX } = e.target.getBoundingClientRect();
            let { clientX: mouseX } = e;

            let difference = mouseX - thumbnailX;

            progressScrubberDiv.current.style.left = `${difference}px`;
        }
    };

    const handleThumbnailTouchStart = (e) => {
        if (isMobile && state.playedOnce && progressScrubberDiv.current) {
            let { x: thumbnailX } = e.touches[0].target.getBoundingClientRect();
            let { clientX: mouseX } = e.touches[0];

            let difference = mouseX - thumbnailX;

            setTouchX(difference);

            progressScrubberDiv.current.style.left = `${difference}px`;
        }
    };

    const handleThumbnailTouchMove = (e) => {
        if (isMobile && state.playedOnce && progressScrubberDiv.current) {
            let { x: thumbnailX, width: thumbnailW } = e.touches[0].target.getBoundingClientRect();
            let { clientX: mouseX } = e.touches[0];

            let difference = mouseX - thumbnailX;

            if (difference > thumbnailW) {
                difference = thumbnailW;
            }
            else if (difference < 0) {
                difference = 0;
            }

            setTouchX(difference);

            progressScrubberDiv.current.style.left = `${difference}px`;
        }
    };

    const handleThumbnailMouseClick = (e) => {
        if (!isMobile) {
            let { x: thumbnailX, width: thumbnailW } = e.target.getBoundingClientRect();
            let { clientX: mouseX } = e;
            let { duration } = state.audio;

            let position = mouseX - thumbnailX;
            let percentage = position / thumbnailW;
            let currentTime = duration * percentage;

            state.audio.currentTime = currentTime;

            if (progressDiv.current) {
                progressDiv.current.style.left = `${percentage * 100}%`;
            }
        }
    };

    const handleThumbnailMouseLeave = (e) => {
        if (!isMobile && progressScrubberDiv.current) {
            progressScrubberDiv.current.style.left = '';
        }
    };

    const handleThumbnailTouchCancel = (e) => {
        if (isMobile && progressScrubberDiv.current) {
            progressScrubberDiv.current.style.left = '';
        }
    };

    const handleThumbnailTouchEnd = (e) => {
        if (isMobile && state.playedOnce) { /* iOS is stupid and doesn't let you mess around with the currentTime until the audio has played at least once */
            try
            {
                let { width: thumbnailW } = e.target.getBoundingClientRect();
                let { duration } = state.audio;

                let position = touchX;
                let percentage = position / thumbnailW;
                let currentTime = duration * percentage;

                state.audio.currentTime = currentTime;

                if (progressDiv.current) {
                    progressDiv.current.style.left = `${percentage * 100}%`;
                }

                if (progressScrubberDiv.current) {
                    progressScrubberDiv.current.style.left = '';
                }
            }
            catch(err)
            {
                ;
            }
        }
    };

    const handleThumbnailMouseMove = (e) => {
        if (!isMobile && progressScrubberDiv.current) {
            let { x: thumbnailX } = e.target.getBoundingClientRect();
            let { clientX: mouseX } = e;

            let difference = mouseX - thumbnailX;

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

        state.audio.volume = volume;
        state.audio.muted = muted;
    };

    return <div className={classes.borderDiv}>
        <div className={classNames(classes.audioThumbnail, { 'disabled': !state.playedOnce })} 
            onMouseEnter={handleThumbnailMouseEnter}
            onClick={handleThumbnailMouseClick}
            onMouseLeave={handleThumbnailMouseLeave}
            onMouseMove={handleThumbnailMouseMove}
            onTouchCancel={handleThumbnailTouchCancel}
            onTouchEnd={handleThumbnailTouchEnd}
            onTouchMove={handleThumbnailTouchMove}
            onTouchStart={handleThumbnailTouchStart}
        >
            <img src={thumbnail} className={classes.actualThumbnail} />
            <div ref={progressDiv} className={classes.progress} style={{left: 0}}></div>
            <div ref={progressScrubberDiv} className={classes.progressScrubber}></div>
        </div>
        <div className={classes.controls}>
            {
                <SkipPreviousRoundedIcon onClick={seekToBeginning} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} />
            }
            {
                state.paused
                ? <PlayArrowRoundedIcon onClick={togglePaused} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} />
                : <PauseRoundedIcon onClick={togglePaused} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} />
            }
            {
                state.muted
                ? <VolumeOffRoundedIcon onClick={toggleMute} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} />
                : <VolumeUpRoundedIcon onClick={toggleMute} style={{cursor: 'pointer', position: 'relative', fontSize: '2em'}} />
            }
            {
                !isMobile && <input className={classes.volumeRange} type="range" min="0" max="1" step="0.01" value={state.volume} onChange={handleVolumeChange} />
            }
        </div>
    </div>;
};