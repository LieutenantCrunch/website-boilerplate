// Obsolete
export default function authHeader() {
    try
    {
        const loginDetails = JSON.parse(localStorage.getItem('loginDetails'));

        if (loginDetails && loginDetails.authToken) {
            return { 'x-access-token': loginDetails.authToken};
        }

        return {};
    }
    catch(err)
    {
        return {};
    }
}