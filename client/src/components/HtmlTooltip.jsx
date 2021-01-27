import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import { RGB_Linear_Shade } from '../utilities/ShadeBlendConvert';

const useStyles = makeStyles({
  tooltip: {
    backgroundColor: (props) => RGB_Linear_Shade(0.5, props.color || 'rgb(153,217,234)'),
    border: (props) => `1px solid ${props.color || 'rgb(0,162,232)'}`,
    color: 'rgb(0,0,0)',
    fontWeight: (props) => props.fontWeight || 'bold',
    margin: '6px 0',
    opacity: 0.9
  },
  arrow: {
      color: (props) => props.color || 'rgb(0,162,232)'
  }
});

export const HtmlTooltip = ({children, ...props}) => {
  const classes = useStyles(props);

  return (
    <Tooltip classes={classes} {...props}>
      {children}
    </Tooltip>
  );
};