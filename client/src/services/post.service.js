import axiosApi from '../services/axios-api';
import axios from 'axios';
import 'regenerator-runtime'; /* Necessary for async/await to not throw an error. https://tenor.com/view/idk-idont-know-sassy-kid-girl-gif-4561444 */
import * as Constants from '../constants/constants';
import { isNullOrWhiteSpaceOnly } from '../utilities/TextUtilities';

const CancelToken = axios.CancelToken;

export default class PostService {
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
                let { newPost } = response.data;

                return newPost;
            }
        }
        catch (err) {
            console.error(`Error creating new post:\n${err.message}`);
        }

        return null;
    }

    static async createNewPostComment(postUniqueId, commentText, parentCommentUniqueId) {
        try {
            let payload = {postUniqueId, commentText, parentCommentUniqueId};

            let response = await axiosApi.post(Constants.API_PATH_POSTS + 'createNewPostComment', payload);
    
            if (response.data && response.data.success) {
                let { newComment } = response.data;

                return newComment;
            }
        }
        catch (err) {
            console.error(`Error creating new post comment:\n${err.message}`);
        }

        return null;
    }

    static async deletePost(uniqueId) {
        try {
            let payload = { uniqueId };

            let response = await axiosApi.post(Constants.API_PATH_POSTS + 'deletePost', payload);
    
            if (response.data) {
                return response.data.success;
            }
        }
        catch (err) {
            console.error(`Error marking deleting post:\n${err.message}`);
        }

        return false;
    }

    static async deletePostComment(uniqueId) {
        try {
            let payload = { uniqueId };

            let response = await axiosApi.post(Constants.API_PATH_POSTS + 'deletePostComment', payload);
    
            if (response.data) {
                return response.data.success;
            }
        }
        catch (err) {
            console.error(`Error marking deleting post comment:\n${err.message}`);
        }

        return false;
    }

    static async getFeed(pageNumber, endDate, postType) {
        try {
            if (this.getFeedCancel !== undefined) {
                this.getFeedCancel();
            }

            let queryParameters = {
                pageNumber,
                endDate
            };

            if (postType !== undefined) {
                queryParameters.postType = postType;
            }

            let queryString = encodeURI(Object.keys(queryParameters).map(key => `${key}=${queryParameters[key]}`).join('&'));
            
            let response = await axiosApi.get(Constants.API_PATH_POSTS + `getFeed?${queryString}`, {
                cancelToken: new CancelToken(c => this.getFeedCancel = c)
            });

            if (response.data && response.data.success) {
                const {posts, total, returnPostType} = response.data;

                return {posts, total, returnPostType};
            }
        }
        catch (err) {
            if (axios.isCancel(err)) {
                // Don't need to do anything special, the return below will handle it
            }
            else {
                console.error(`Error getting posts:\n${err.message}`);
            }
        }

        return {posts: [], total: 0, postType: Constants.POST_TYPES.ALL};
    }

    static async getMyPosts(pageNumber, endDate) {
        try {
            if (this.getMyPostsCancel !== undefined) {
                this.getMyPostsCancel();
            }

            let queryParameters = {
                pageNumber,
                endDate
            };

            let queryString = encodeURI(Object.keys(queryParameters).map(key => `${key}=${queryParameters[key]}`).join('&'));

            let response = await axiosApi.get(Constants.API_PATH_POSTS + `getMyPosts?${queryString}`, {
                cancelToken: new CancelToken(c => this.getMyPostsCancel = c)
            });

            if (response.data && response.data.success) {
                const {posts, total} = response.data;

                return {posts, total};
            }
        }
        catch (err) {
            if (axios.isCancel(err)) {
                // Don't need to do anything special, the return below will handle it
            }
            else {
                console.error(`Error getting my posts:\n${err.message}`);
            }
        }

        return {posts: [], total: 0};
    }

    static async getPost(postId, commentId) {
        try {
            if (this.getPostCancel !== undefined) {
                this.getPostCancel();
            }

            let queryParameters = {
                postId
            };

            if (!isNullOrWhiteSpaceOnly(commentId)) {
                queryParameters.commentId = commentId;
            }

            let queryString = encodeURI(Object.keys(queryParameters).map(key => `${key}=${queryParameters[key]}`).join('&'));

            let response = await axiosApi.get(Constants.API_PATH_POSTS + Constants.API_PATH_PUBLIC + `getPost?${queryString}`, {
                cancelToken: new CancelToken(c => this.getPostCancel = c)
            });

            if (response.data && response.data.success) {
                return response.data.post;
            }
        }
        catch (err) {
            console.error(`Error getting post:\n${err.message}`);
        }

        return null;
    }

    static async getPostComments(postUniqueId, pageNumber, endDate) {
        try {
            if (this.getPostCommentsCancel !== undefined) {
                this.getPostCommentsCancel();
            }

            let queryParameters = {
                postUniqueId,
                pageNumber,
                endDate
            };

            let queryString = encodeURI(Object.keys(queryParameters).map(key => `${key}=${queryParameters[key]}`).join('&'));

            let response = await axiosApi.get(Constants.API_PATH_POSTS + `getPostComments?${queryString}`, {
                cancelToken: new CancelToken(c => this.getPostCommentsCancel = c)
            });

            if (response.data && response.data.success) {
                let { comments, total } = response.data;

                return { comments, total };
            }
        }
        catch (err) {
            if (axios.isCancel(err)) {
                // Don't need to do anything special, the return below will handle it
            }
            else {
                console.error(`Error getting post comments:\n${err.message}`);
            }
        }

        return {comments: [], total: 0};
    }

    static async getPostNotifications() {
        try {
            if (this.getPostNotificationsCancel !== undefined) {
                this.getPostNotificationsCancel();
            }

            let response = await axiosApi.get(Constants.API_PATH_POSTS + `getPostNotifications`, {
                cancelToken: new CancelToken(c => this.getPostNotificationsCancel = c)
            });

            if (response.data && response.data.success) {
                let { notifications } = response.data;

                return notifications;
            }
        }
        catch (err) {
            if (axios.isCancel(err)) {
                // Don't need to do anything special, the return below will handle it
            }
            else {
                console.error(`Error getting post notifications:\n${err.message}`);
            }
        }

        return [];
    }

    static async getUserPosts(uniqueId, profileName, pageNumber, endDate) {
        try {
            if (this.getUserPostsCancel !== undefined) {
                this.getUserPostsCancel();
            }

            let queryParameters = {
                pageNumber,
                endDate
            };

            if (!isNullOrWhiteSpaceOnly(uniqueId)) {
                queryParameters.postedByUniqueId = uniqueId;
            }
            else if (!isNullOrWhiteSpaceOnly(profileName)) {
                queryParameters.profileName = profileName;
            }

            let queryString = encodeURI(Object.keys(queryParameters).map(key => `${key}=${queryParameters[key]}`).join('&'));

            let response = await axiosApi.get(Constants.API_PATH_POSTS + Constants.API_PATH_PUBLIC + `getUserPosts?${queryString}`, {
                cancelToken: new CancelToken(c => this.getUserPostsCancel = c)
            });

            if (response.data && response.data.success) {
                const {posts, total} = response.data;

                return {posts, total};
            }
        }
        catch (err) {
            if (axios.isCancel(err)) {
                // Don't need to do anything special, the return below will handle it
            }
            else {
                console.error(`Error getting my posts:\n${err.message}`);
            }
        }

        return {posts: [], total: 0};
    }

    static async markAllPostNotificationsAsSeen() {
        try {
            let endDate = Date.now();
            let payload = { endDate };

            let response = await axiosApi.post(Constants.API_PATH_POSTS + 'markAllPostNotificationsAsSeen', payload);
    
            if (response.data) {
                return response.data.success;
            }
        }
        catch (err) {
            console.error(`Error marking post notifications as seen:\n${err.message}`);
        }

        return undefined;
    }

    static async markPostNotificationsAsRead(postId, endDate) {
        try {
            let payload = { postId, endDate };

            let response = await axiosApi.post(Constants.API_PATH_POSTS + 'markPostNotificationsAsRead', payload);
    
            if (response.data) {
                return response.data.success;
            }
        }
        catch (err) {
            // Don't log request aborted messages that happen due to the page changing when clicking on a link
            // The requests will still make it to the server and do what they're supposed to
            if (!(/aborted/i).test(err.message)) {
                console.error(`Error marking post notification as read:\n${err.message}`);
            }
        }

        return undefined;
    }

    static async removeAllPostNotifications(endDate) {
        try {
            let payload = { endDate };

            let response = await axiosApi.post(Constants.API_PATH_POSTS + 'removeAllPostNotifications', payload);
    
            if (response.data) {
                return response.data.success;
            }
        }
        catch (err) {
            console.error(`Error removing all post notifications:\n${err.message}`);
        }

        return undefined;
    }

    static async removePostNotifications(postId, endDate) {
        try {
            let payload = { postId, endDate };

            let response = await axiosApi.post(Constants.API_PATH_POSTS + 'removePostNotifications', payload);
    
            if (response.data) {
                return response.data.success;
            }
        }
        catch (err) {
            console.error(`Error removing post notifications:\n${err.message}`);
        }

        return undefined;
    }
};

// Ideally these should be static properties, but that requires a babel plugin and so on so just set it this way for now
PostService.getFeedCancel = undefined;
PostService.getMyPostsCancel = undefined;
PostService.getPostCancel = undefined;
PostService.getPostCommentsCancel = undefined;
PostService.getPostNotificationsCancel = undefined;
PostService.getUserPostsCancel = undefined;
