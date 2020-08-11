import Axios from 'axios';
import * as Constants from '../constants/constants';

export default Axios.create({
    baseURL: Constants.BASE_API_URL
});