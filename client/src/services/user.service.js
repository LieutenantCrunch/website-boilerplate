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

        let cacheIndex = `${value}${pageNumber}`.toLocaleUpperCase();
        if (this.resultsCache[cacheIndex] && !this.resultsCache[cacheIndex].isStale()) {
            return this.resultsCache[cacheIndex].results;
        }

        let parsedName = value.match(/^([^\s#]+)(?:#)?(\d+)?$/);
        let results = {status: Constants.USER_SEARCH_STATUS.NO_RESULTS, results: {total: 0, users: undefined}};

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
                let searchResults = await axiosApi.get(Constants.API_PATH_USERS + `/search?${queryString}`, {
                    cancelToken: new CancelToken(c => this.userServiceCancel = c)
                });

                if (searchResults.data?.success) {
                    results = {status: Constants.USER_SEARCH_STATUS.RESULTS, results: searchResults.data.results};
                }
            }
            catch (err) {
                if (axios.isCancel(err)) {
                    results = {status: Constants.USER_SEARCH_STATUS.CANCELLED, results: {total: 0, users: undefined}};
                }
            }
        }

        this.resultsCache[cacheIndex] = {
            results,
            storageDate: new Date(),
            isStale: function () {
                return ((new Date() - this.storageDate) / 60000 > Constants.USER_SEARCH_RESULTS.CACHE_LENGTH);
            }
        };

        return results;
    }
};

// Ideally these should be static properties, but that requires a babel plugin and so on so just set it this way for now
UserService.userServiceCancel = undefined;
UserService.resultsCache = [];