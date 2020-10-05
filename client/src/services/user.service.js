import axiosApi from '../services/axios-api';
import axios from 'axios';
import 'regenerator-runtime'; /* Necessary for async/await to not throw an error. https://tenor.com/view/idk-idont-know-sassy-kid-girl-gif-4561444 */
import * as Constants from '../constants/constants';

const CancelToken = axios.CancelToken;

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

    static async searchDisplayNameAndIndex(value, pageNumber) {
        if (this.userServiceCancel !== undefined) {
            this.userServiceCancel();
        }

        let parsedName = value.match(/^([^\s#]+)(?:#)?(\d+)?$/);

        if (parsedName) {
            let displayNameFilter = parsedName[1];
            let displayNameIndexFilter = parsedName[2];
            var queryParameters;

            if (displayNameFilter && displayNameIndexFilter) {
                queryParameters = {displayNameFilter, displayNameIndexFilter, pageNumber};
            }
            else {
                queryParameters = {displayNameFilter, pageNumber};
            }

            let queryString = encodeURI(Object.keys(queryParameters).map(key => `${key}=${queryParameters[key]}`).join('&'));
            
            try {
                let results = await axiosApi.get(Constants.API_PATH_USERS + `/search?${queryString}`, {
                    cancelToken: new CancelToken(c => this.userServiceCancel = c)
                });

                if (results.data?.success) {
                    return {status: Constants.USER_SEARCH_STATUS.RESULTS, results: results.data.results};
                }
            }
            catch (err) {
                if (axios.isCancel(err)) {
                    return {status: Constants.USER_SEARCH_STATUS.CANCELLED, results: {total: 0, users: undefined}};
                }
            }
        }

        return {status: Constants.USER_SEARCH_STATUS.NO_RESULTS, results: {total: 0, users: undefined}};
    }
};

// Ideally this should be a static property, but that requires a babel plugin and so on so just set it this way for now
UserService.userServiceCancel = undefined;