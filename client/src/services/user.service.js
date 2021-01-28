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
            console.error(`Error getting current user details: ${err.message}`);
        }
    }

    static async getUserDetails(uniqueId) {
        try {
            let queryString = encodeURI(`uniqueId=${uniqueId}`);
            let response = await axiosApi.get(Constants.API_PATH_USERS + `/getUserDetails?${queryString}`);

            if (response.data && response.data.success) {
                return response.data.userDetails;
            }
        }
        catch (err) {
            console.error(`Error getting user details for ${uniqueId}:\n${err.message}`);
        }

        return null;
    }

    static async getProfileInfo(profileName) {
        try
        {
            let queryString = encodeURI(`profileName=${profileName}`);
            let response = await axiosApi.get(Constants.API_PATH_USERS + `/getProfileInfo?${queryString}`);

            if (response.data && response.data.success) {
                return response.data.profileInfo;
            }

            throw new Error(`Failed to look up profile for ${profileName}${ response.data && response.data.message ? `:\n${response.data.message}` :'' }`);
        }
        catch (err)
        {
            throw new Error(`Error looking up profile for ${profileName}:\n${err.message}`);
        }
    }

    static checkForRole(userDetails, roleName) {
        return userDetails?.roles ? userDetails.roles.includes(roleName) : false;
    }

    static async searchDisplayNameAndIndex(value, pageNumber, excludeConnections) {
        if (this.userServiceCancel !== undefined) {
            this.userServiceCancel();
        }

        let cacheIndex = `${value}${pageNumber}${excludeConnections || false}`.toLocaleUpperCase();

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
                queryParameters = {displayNameFilter, displayNameIndexFilter, pageNumber, excludeConnections};
            }
            else {
                queryParameters = {displayNameFilter, pageNumber, excludeConnections};
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

    static async verifyDisplayName(userUniqueID, displayName) {
        try {
            let payload = {userUniqueID, displayName};
            let results = await axiosApi.post(Constants.API_PATH_USERS + '/verifyDisplayName', payload);

            return results.data;
        }
        catch (err) {
            console.error(err.message);

            return {success: false, message: `An exception occurred while making the api request for verifying the display name ${displayName} for the user with unique id: ${userUniqueID}\n${err.message}`};
        }
    }

    static async getIncomingConnections(uniqueId) {
        try {
            let queryString = encodeURI(`uniqueId=${uniqueId}`);
            let response = await axiosApi.get(Constants.API_PATH_USERS + `/getIncomingConnections?${queryString}`);

            if (response.data && response.data.success) {
                return response.data.connections;
            }
        }
        catch (err) {
            console.error(`Error getting connections for user ${uniqueId}:\n${err.message}`);
        }

        return null;
    }

    static async getOutgoingConnections(uniqueId) {
        try {
            let queryString = encodeURI(`uniqueId=${uniqueId}`);
            let response = await axiosApi.get(Constants.API_PATH_USERS + `/getOutgoingConnections?${queryString}`);

            if (response.data && response.data.success) {
                return response.data.connections;
            }
        }
        catch (err) {
            console.error(`Error getting connections for user ${uniqueId}:\n${err.message}`);
        }

        return null;
    }

    static async getConnectionTypeDict() {
        try {
            let response = await axiosApi.get(Constants.API_PATH_USERS + '/getConnectionTypeDict');

            if (response.data && response.data.success) {
                return response.data.connectionTypeDict;
            }
            else {
                console.error(`Failed to get connection type dictionary`);
            }
        }
        catch (err) {
            console.error(`Error getting connection type dictionary:\n${err.message}`);
        }

        return {};
    }

    static async updateOutgoingConnection(outgoingConnection) {
        try {
            let payload = {outgoingConnection};
            axiosApi.post(Constants.API_PATH_USERS + '/updateConnection', payload);
        }
        catch (err) {
            console.error(`Error updating connection:\n${err.message}`);
        }
    }

    static async removeOutgoingConnection(outgoingConnection) {
        try {
            let connectedUserUniqueId = outgoingConnection.id;
            let payload = {connectedUserUniqueId};
            
            let response = await axiosApi.post(Constants.API_PATH_USERS + '/removeConnection', payload);

            return response;
        }
        catch (err) {
            console.error(`Error removing connection:\n${err.message}`);
        }

        return {};
    }
};

// Ideally these should be static properties, but that requires a babel plugin and so on so just set it this way for now
UserService.userServiceCancel = undefined;
UserService.resultsCache = [];