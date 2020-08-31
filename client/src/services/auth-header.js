// Obsolete
export default function authHeader() {
    try
    {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));

        if (userInfo && userInfo.authToken) {
            return { 'x-access-token': userInfo.authToken};
        }

        return {};
    }
    catch(err)
    {
        return {};
    }
}