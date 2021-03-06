import axiosApi from '../services/axios-api';
import * as Constants from '../constants/constants';
import 'regenerator-runtime'; /* Necessary for async/await to not throw an error. https://tenor.com/view/idk-idont-know-sassy-kid-girl-gif-4561444 */

export default class UploadService {
    static async uploadPFP(pfp, onUploadProgress) {
        let formData = new FormData();

        formData.append('pfp', pfp);

        let response = await axiosApi.post(Constants.API_PATH_USERS + Constants.API_PATH_PFP + 'upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }, 
            onUploadProgress
        });

        if (response.data && response.data.success) {
            let {pfp, pfpSmall} = response.data;
            return { pfp, pfpSmall };
        }

        return null;
    }

    static async getPFP() {
        return axiosApi.get(Constants.API_PATH_USERS + Constants.API_PATH_PFP + 'get')
    }
}