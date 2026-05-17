import { Client, Account, Databases } from 'appwrite';

// APPWRITE: read endpoint and project id from Vite env vars
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
    // APPWRITE: warn when env variables are missing (do not hardcode credentials)
    console.warn('APPWRITE: VITE_APPWRITE_ENDPOINT or VITE_APPWRITE_PROJECT_ID is not set');
}

// APPWRITE: initialize client using env values
const client = new Client().setEndpoint(endpoint).setProject(projectId);

// APPWRITE: expose Account and Databases clients
const account = new Account(client);
const databases = new Databases(client);

// APPWRITE: Ping Appwrite to verify the setup on startup
function pingAppwrite() {
    return client.ping();
}

export { client, account, databases, pingAppwrite };
