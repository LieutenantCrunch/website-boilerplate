import axiosApi from '../services/axios-api';
import 'regenerator-runtime'; /* Necessary for async/await to not throw an error. https://tenor.com/view/idk-idont-know-sassy-kid-girl-gif-4561444 */
import * as Constants from '../constants/constants';

export default class UserService {
    static async setDisplayName(displayName) {
        try
        {
            let payload = {displayName};

            return await axiosApi.post(Constants.API_PATH_USERS + '/setDisplayName', payload);
        }
        catch(err)
        {
            return null;
        }
    }

    static getCurrentDetails(successCallback) {
        try {
            axiosApi.get(Constants.API_PATH_USERS + 'currentUserDetails').then(response => {
                if (response.data && response.data.success) {
                    successCallback(response.data.userDetails);
                }
            })
        }
        catch (err) {
            console.error(`Error getting user details: ${err.message}`);
        }
    }

    static checkForRole(userDetails, roleName) {
        return userDetails?.roles ? userDetails.roles.includes(roleName) : false;
    }
}