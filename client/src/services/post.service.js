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

    static async createNewPost(postData, onUploadProgress) {
        try {
            let formData = new FormData();
            
            Object.keys(postData).forEach(key => {
                if (key !== 'postFiles') {
                    let data = postData[key];

                    if (data != null && data != undefined) {
                        formData.append(key, data);
                    }
                }
            });

            // Append this last so hopefully all of the other data arrives first
            if (postData.postFiles) {
                postData.postFiles.forEach(file => {
                    formData.append('postFiles', file);
                });
            }

            let response = await axiosApi.post(Constants.API_PATH_POSTS + 'createNewPost', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }, 
                onUploadProgress
            });
    
            if (response.data && response.data.success) {
                return {};
            }
        }
        catch (err) {
            console.error(`Error creating new post:\n${err.message}`);
        }

        return null;
    }
};
