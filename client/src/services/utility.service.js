import axiosApi from '../services/axios-api';
import 'regenerator-runtime'; /* Necessary for async/await to not throw an error. https://tenor.com/view/idk-idont-know-sassy-kid-girl-gif-4561444 */

export default class UtilityService {
    static async getConstants() {
        try {
            let response = await axiosApi.get('getConstants');
        
            return response.data;
        }
        catch(err) {
            console.error(`Failed to update constants from the server:\n${err.message}`);
            return null;
        }
    }
}