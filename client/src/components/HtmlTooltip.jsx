import Tooltip from '@material-ui/core/Tooltip';
import { withStyles } from '@material-ui/core/styles';

export const HtmlTooltip = withStyles((theme) => ({
    tooltip: {
      backgroundColor: 'rgb(153,217,234)',
      border: '1px solid rgb(0,162,232)',
      color: 'rgb(0,0,0)',
      fontWeight: 'bold',
      margin: '6px 0',
      opacity: 0.9
    },
    arrow: {
        color: 'rgb(0,162,232)'
    }
}))(Tooltip);