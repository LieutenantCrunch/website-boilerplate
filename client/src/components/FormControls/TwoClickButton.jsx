import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { HtmlTooltip } from '../HtmlTooltip';

const TwoClickButton = ({ 
    firstTitle, 
    secondTitle, 
    className, 
    firstClassName, 
    secondClassName, 
    progressClassName, 
    firstTooltip,
    secondTooltip,
    secondDuration, 
    onClick
}) => {
    const ANIMATION_FREQUENCY = 10; // Number of times a second the animation will fire. Max: 1000. Higher values will produce a smoother animation but will be more CPU intensive and may trigger script warnings.
    const UNCLICKED = 0;
    const CLICKED_ONCE = 1;
    const CLICKED_TWICE = 2;

    const [clickState, setClickState] = useState(UNCLICKED);
    const buttonEl = useRef();

    const [progressValue, setProgressValue] = useState(0);
    const valueDeductionAmount = 100 / (secondDuration * ANIMATION_FREQUENCY);

    const reduceProgressValue = () => {
        let nextValue = Math.floor(progressValue - valueDeductionAmount);

        return nextValue >= 0 ? nextValue : 0;
    };

    useEffect(() => {
        if (progressValue > 0) {
            const timer = setTimeout(() => {
                let newProgressValue = reduceProgressValue();
                setProgressValue(newProgressValue);
            }, (1000 / ANIMATION_FREQUENCY));

            return () => clearTimeout(timer);
        }
        else if (clickState === CLICKED_ONCE) {
            setClickState(UNCLICKED);
        }
    }, [progressValue])
    

    const handleClick = (event) => {
        if (clickState === UNCLICKED) {
            // If they haven't clicked it yet, set the flag indicating they've clicked it
            setClickState(CLICKED_ONCE);
            setProgressValue(100);
        }
        else if (clickState === CLICKED_ONCE) {
            setProgressValue(0);
            setClickState(CLICKED_TWICE);

            // Perform the onClick handler
            onClick();
        }
    };

    const getCurrentValues = () => {
        switch (clickState)
        {
            case CLICKED_TWICE:
                return {
                    className: firstClassName,
                    title: firstTitle,
                    tooltip: ''
                };
            case CLICKED_ONCE:
                return {
                    className: `${secondClassName} text-dark`,
                    title: secondTitle,
                    tooltip: secondTooltip
                };
            case UNCLICKED:
            default:
                return {
                    className: firstClassName,
                    title: firstTitle,
                    tooltip: firstTooltip
                };
        }
    };

    return (
        <HtmlTooltip 
            title={getCurrentValues().tooltip}
                enterDelay={500}
                interactive
                arrow
                placement="bottom"
                color='rgb(255,0,0)'
            >
            <div>
                <button ref={buttonEl} 
                    className={classNames(className, getCurrentValues().className)}
                    onClick={handleClick}
                    style={{
                        position: 'relative',
                        backgroundColor: clickState === CLICKED_ONCE ? 'transparent' : '',
                        pointerEvents: clickState === CLICKED_TWICE ? 'none' : 'auto'
                    }}
                    disabled={clickState === CLICKED_TWICE}
                >
                    <div className={progressClassName} 
                        style={{
                            display: clickState === CLICKED_ONCE ? '' : 'none',
                            height: '100%',
                            left: 0,
                            opacity: .75,
                            position: 'absolute',
                            top: 0,
                            width: `${progressValue}${progressValue > 0 ? '%' : ''}`,
                            zIndex: -1 /* This will put it behind the text */
                        }}
                    ></div>
                    {getCurrentValues().title}
                </button>
            </div>
        </HtmlTooltip>
    );
};

export default TwoClickButton;