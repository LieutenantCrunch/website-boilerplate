import axiosApi from '../services/axios-api';
import 'regenerator-runtime'; /* Necessary for async/await to not throw an error. https://tenor.com/view/idk-idont-know-sassy-kid-girl-gif-4561444 */
import * as Constants from '../constants/constants';

export default class PostService {
    static async getFeed() {
        try {
            let response = await axiosApi.get(Constants.API_PATH_POSTS + `/getFeed`);

            if (response.data && response.data.success) {
                const {posts, total} = response.data;

                return {posts, total};
            }
        }
        catch (err) {
            console.error(`Error getting posts:\n${err.message}`);
        }

        return [];
    }
};
