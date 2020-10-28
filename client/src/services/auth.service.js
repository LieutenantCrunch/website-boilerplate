import axiosApi from '../services/axios-api';
import * as Constants from '../constants/constants';
import 'regenerator-runtime'; /* Necessary for async/await to not throw an error. https://tenor.com/view/idk-idont-know-sassy-kid-girl-gif-4561444 */

export default class AuthService {
    static async login(email, password) {
        const payload = {
            email,
            password
        };

        try {
            let response = await axiosApi.post(Constants.API_PATH_AUTH + 'login', payload);
        
            let loginSuccess = response.data && response.data.success ? response.data.success : false;
            if (response.status === 200) {
                return {
                    success: loginSuccess, 
                    statusMessage: {
                        type: (loginSuccess ? 'success' : 'danger'), 
                        message: (response.data.message ? response.data.message : 'Login successful, redirecting to application')
                    },
                    userInfo: response.data.userInfo
                };
            }
            else {
                return {
                    success: false, 
                    statusMessage: {
                        type: 'danger', 
                        message: 'Failed to log in: ' + (response.data.message ? response.data.message : response.status)
                    },
                    userInfo: null
                };
            }
        }
        catch(error) {
            return {
                success: false,
                statusMessage: {
                    type: 'danger', 
                    message: error.message
                },
                userInfo: null
            };
        };
    }

    static async register (payload) {
        try {
            let response = await axiosApi.post(Constants.API_PATH_AUTH + 'register', payload);

            let registrationSuccess = response.data.success ? response.data.success : false;

            if (response.status === 200) {
                return {
                    success: registrationSuccess, 
                    statusMessage: {
                        type: (registrationSuccess ? 'success' : 'danger'), 
                        message: (response.data.message ? response.data.message : 'No Message')
                    }
                };
            }
            else {
                return {
                    success: false, 
                    statusMessage: {
                        type: 'danger', 
                        message: 'Failed to register: ' + (response.data.message ? response.data.message : response.status)
                    }
                };
            }
        }
        catch (error) {
            return {
                success: false,
                statusMessage: {
                    type: 'danger', 
                    message: error.message
                }
            };
        }
    }

    static async logout(fromHere = true, fromOtherLocations = false) {
        try {
            let payload = {
                fromHere,
                fromOtherLocations
            };

            let response = await axiosApi.post(Constants.API_PATH_AUTH + 'logout', payload);
        
            let logoutSuccess = response.data.success ? response.data.success : false;
            if (response.status === 200) {
                return {
                    success: logoutSuccess, 
                    statusMessage: {
                        type: (logoutSuccess ? 'success' : 'danger'), 
                        message: (response.data.message ? response.data.message : 'Logout successful, redirecting to login page')
                    }
                };
            }
            else {
                return {
                    success: false, 
                    statusMessage: {
                        type: 'danger', 
                        message: 'Failed to logout: ' + (response.data.message ? response.data.message : response.status)
                    }
                };
            }
        }
        catch(error) {
            return {
                success: false,
                statusMessage: {
                    type: 'danger', 
                    message: error.message
                }
            };
        };
    }

    static async requestPasswordReset (email) {
        const payload = {
            email
        };

        try {
            let response = await axiosApi.post(Constants.API_PATH_AUTH + 'reset-password-request', payload);

            let success = response.data.success ? response.data.success : false;

            if (response.status === 200) {
                return {
                    success, 
                    statusMessage: {
                        type: (success ? 'success' : 'danger'), 
                        message: (response.data.message ? response.data.message : 'No Message')
                    }
                };
            }
            else {
                return {
                    success: false, 
                    statusMessage: {
                        type: 'danger', 
                        message: 'Failed to request password reset: ' + (response.data.message ? response.data.message : response.status)
                    }
                };
            }
        }
        catch (error) {
            return {
                success: false,
                statusMessage: {
                    type: 'danger', 
                    message: error.message
                }
            };
        }
    }

    static async resetPassword (token, email, password, confirmPassword) {
        const payload = {
            token, 
            email,
            password,
            confirmPassword
        };

        try {
            let response = await axiosApi.post(Constants.API_PATH_AUTH + 'reset-password', payload);

            let resetSuccess = response.data.success ? response.data.success : false;

            if (response.status === 200) {
                return {
                    success: resetSuccess, 
                    statusMessage: {
                        type: (resetSuccess ? 'success' : 'danger'), 
                        message: (response.data.message ? response.data.message : 'No Message')
                    }
                };
            }
            else {
                return {
                    success: false, 
                    statusMessage: {
                        type: 'danger', 
                        message: 'Failed to reset password: ' + (response.data.message ? response.data.message : response.status)
                    }
                };
            }
        }
        catch (error) {
            return {
                success: false,
                statusMessage: {
                    type: 'danger', 
                    message: error.message
                }
            };
        }
    }
};