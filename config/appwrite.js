import { Client, Account, OAuthProvider } from 'appwrite';

// Appwrite Configuration
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Replace with your Appwrite endpoint
    .setProject('your-project-id'); // Replace with your Appwrite project ID

// Initialize Account
export const account = new Account(client);

// OAuth Provider
export { OAuthProvider };

// Helper function to get current user
export const getCurrentUser = async () => {
    try {
        return await account.get();
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
    try {
        await account.get();
        return true;
    } catch (error) {
        return false;
    }
};

// Helper function to logout
export const logout = async () => {
    try {
        await account.deleteSession('current');
        console.log('✅ Logged out successfully');
    } catch (error) {
        console.error('❌ Logout error:', error);
    }
};

export default client; 