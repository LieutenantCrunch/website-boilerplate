import React, {useEffect, useRef} from 'react';

function SmallAddButton (props) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvasObj = canvasRef.current;
        const context = canvasObj.getContext('2d');

        var centerX = canvasObj.width / 2;
        var centerY = canvasObj.height / 2;
        var circleRadius = centerX;
        var plusTop = canvasObj.height / 5;
        var plusBottom = canvasObj.height - plusTop;
        var plusLeft = canvasObj.width / 5;
        var plusRight = canvasObj.width - plusLeft;

        // Draw the circle with border
        context.beginPath();
        context.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI, false);
        context.fillStyle = 'rgba(100,100,100,.5)';
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = 'rgba(0,0,0,.5)';
        context.stroke();

        // Draw a + within the circle
        // Approach #1 - Results in a dark square in the middle of the +
        /*context.beginPath();
        context.moveTo(centerX, plusTop);
        context.lineTo(centerX, plusBottom);
        context.lineWidth = 2;
        context.strokeStyle = 'rgba(0,0,0,.5)';
        context.lineCap = 'round';
        context.stroke();

        context.beginPath();
        context.moveTo(plusLeft, centerY);
        context.lineTo(plusRight, centerY);
        context.lineWidth = 2;
        context.strokeStyle = 'rgba(0,0,0,.5)';
        context.lineCap = 'round';
        context.stroke();*/

        // Approach #2 - More complicated, but no dark square in the middle
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.lineTo(plusLeft, centerY);
        context.moveTo(centerX, centerY);
        context.lineTo(plusRight, centerY);
        context.moveTo(centerX, centerY);
        context.lineTo(centerX, plusTop);
        context.moveTo(centerX, centerY);
        context.lineTo(centerX, plusBottom);
        context.lineWidth = 2;
        context.strokeStyle = 'rgba(255,255,255,.75)';
        context.lineCap = 'round';
        context.stroke();
    }, []);

    return (
        <canvas ref={canvasRef} width={props.width} height={props.height} style={props.style} />
    );
}

export default SmallAddButton;