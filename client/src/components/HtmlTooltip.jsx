import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import Zoom from '@material-ui/core/Zoom';
import { makeStyles } from '@material-ui/core/styles';
import { RGB_Linear_Shade } from '../utilities/ShadeBlendConvert';

// ## !important became necessary after updating from 5.0.0-alpha.25 to 5.0.0-alpha.27, might be fixed in the final 5.0.0
const useStyles = makeStyles({
  tooltip: {
    backgroundColor: (props) => `${RGB_Linear_Shade(0.5, props.color || 'rgb(153,217,234)')} !important`,
    border: (props) => `1px solid ${props.color || 'rgb(0,162,232)'} !important`,
    color: 'rgb(0,0,0) !important',
    fontWeight: (props) => `${props.fontWeight || 'bold'} !important`,
    margin: '6px 0 !important',
    opacity: `0.9 !important`
  },
  arrow: {
      color: (props) => `${props.color || 'rgb(0,162,232)'} !important`
  }
});

export const HtmlTooltip = ({children, ...props}) => {
  const classes = useStyles(props);

  return (
    <Tooltip classes={classes} {...props} TransitionComponent={Zoom}>
      {children}
    </Tooltip>
  );
};