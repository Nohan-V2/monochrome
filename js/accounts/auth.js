// js/accounts/auth.js
// APPWRITE: use Appwrite Account client for authentication
import { account } from '../appwrite.js';
import { ID } from 'appwrite';

function normalizeUser(user) {
    if (!user) return null;
    return { ...user, $id: user.id };
}

export class AuthManager {
    constructor() {
        this.user = null;
        this.authListeners = [];
        this.init().catch(console.error);
    }

    async init() {
        const params = new URLSearchParams(window.location.search);
        if (params.has('oauth') || params.has('userId') || params.has('secret')) {
            window.history.replaceState({}, '', window.location.pathname);
        }

        try {
            // APPWRITE: check current session using Appwrite Account APIs
            // If it fails (network/CORS), proceed in disconnected mode
            let session = null;
            try {
                // APPWRITE: getSession('current') returns the active session if present
                session = await account.getSession('current');
            } catch (fetchErr) {
                // APPWRITE: fallback to account.get() which returns the current user if logged in
                try {
                    const user = await account.get();
                    this.user = normalizeUser(user);
                } catch (innerErr) {
                    console.warn('APPWRITE: session/user fetch failed:', fetchErr, innerErr);
                }
            }

            if (session && session.user) {
                this.user = normalizeUser(session.user);
            }

            this.updateUI(this.user);
            this.authListeners.forEach((listener) => listener(this.user));
        } catch (err) {
            console.warn('Session check failed:', err);
            this.user = null;
            this.updateUI(null);
        }
    }

    onAuthStateChanged(callback) {
        this.authListeners.push(callback);
        if (this.user !== null) {
            callback(this.user);
        }
    }

    async _signInSocial(provider) {
        try {
            // APPWRITE: create an OAuth2 session for the provider
            // NOTE: Appwrite opens a redirect for OAuth providers
            await account.createOAuth2Session(provider, window.location.origin + '/index.html');
        } catch (error) {
            console.error('Login failed:', error);
            alert(`Login failed: ${error.message}`);
        }
    }

    async signInWithGoogle() {
        return this._signInSocial('google');
    }
    async signInWithGitHub() {
        return this._signInSocial('github');
    }
    async signInWithDiscord() {
        return this._signInSocial('discord');
    }
    async signInWithSpotify() {
        return this._signInSocial('spotify');
    }

    async signInWithEmail(email, password) {
        try {
            // APPWRITE: create email/password session
            const session = await account.createEmailPasswordSession(email, password);
            // APPWRITE: fetch current user
            const user = await account.get();
            this.user = normalizeUser(user);
            this.updateUI(this.user);
            this.authListeners.forEach((listener) => listener(this.user));
            return this.user;
        } catch (error) {
            console.error('Email Login failed:', error);
            alert(`Login failed: ${error.message}`);
            throw error;
        }
    }

    async signUpWithEmail(email, password) {
        try {
            // APPWRITE: create a new account
            const name = email.split('@')[0];
            await account.create(ID.unique(), email, password, name);
            // APPWRITE: after account creation, create a session
            await account.createEmailPasswordSession(email, password);
            const user = await account.get();
            this.user = normalizeUser(user);
            this.updateUI(this.user);
            this.authListeners.forEach((listener) => listener(this.user));
            return this.user;
        } catch (error) {
            console.error('Sign Up failed:', error);
            alert(`Sign Up failed: ${error.message}`);
            throw error;
        }
    }

    async sendPasswordReset(email) {
        try {
            // APPWRITE: create a password recovery (sends email)
            await account.createRecovery(email, window.location.origin + '/reset-password');
            alert(`Password reset email sent to ${email}`);
        } catch (error) {
            console.error('Password reset failed:', error);
            alert(`Failed to send reset email: ${error.message}`);
            throw error;
        }
    }

    async resetPassword(token, password, confirmPassword) {
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
        try {
            // APPWRITE: complete password recovery using the token
            await account.updateRecovery(token, password);
        } catch (error) {
            console.error('Password reset failed:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            // APPWRITE: delete the current session
            await account.deleteSession('current');
            this.user = null;
            this.updateUI(null);
            this.authListeners.forEach((listener) => listener(null));

            if (window.__AUTH_GATE__) {
                window.location.href = '/login';
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    }

    updateUI(user) {
        const connectBtn = document.getElementById('auth-connect-btn');
        const clearDataBtn = document.getElementById('auth-clear-cloud-btn');
        const statusText = document.getElementById('auth-status');
        const emailContainer = document.getElementById('email-auth-container');
        const emailToggleBtn = document.getElementById('toggle-email-auth-btn');
        const githubBtn = document.getElementById('auth-github-btn');
        const discordBtn = document.getElementById('auth-discord-btn');

        if (!connectBtn) return;

        if (window.__AUTH_GATE__) {
            connectBtn.textContent = 'Sign Out';
            connectBtn.classList.add('danger');
            connectBtn.onclick = () => this.signOut();
            if (clearDataBtn) clearDataBtn.style.display = 'none';
            if (emailContainer) emailContainer.style.display = 'none';
            if (emailToggleBtn) emailToggleBtn.style.display = 'none';
            if (githubBtn) githubBtn.style.display = 'none';
            if (discordBtn) discordBtn.style.display = 'none';
            if (statusText) statusText.textContent = user ? `Signed in as ${user.email}` : 'Signed in';

            const accountPage = document.getElementById('page-account');
            if (accountPage) {
                const title = accountPage.querySelector('.section-title');
                if (title) title.textContent = 'Account';
                accountPage.querySelectorAll('.account-content > p, .account-content > div').forEach((el) => {
                    if (el.id !== 'auth-status' && el.id !== 'auth-buttons-container') {
                        el.style.display = 'none';
                    }
                });
            }

            const customDbBtn = document.getElementById('custom-db-btn');
            if (customDbBtn) {
                const pbFromEnv = !!window.__POCKETBASE_URL__;
                if (pbFromEnv) {
                    const settingItem = customDbBtn.closest('.setting-item');
                    if (settingItem) settingItem.style.display = 'none';
                }
            }

            return;
        }

        if (user) {
            connectBtn.textContent = 'Sign Out';
            connectBtn.classList.add('danger');
            connectBtn.onclick = () => this.signOut();

            if (clearDataBtn) clearDataBtn.style.display = 'block';
            if (emailContainer) emailContainer.style.display = 'none';
            if (emailToggleBtn) emailToggleBtn.style.display = 'none';
            if (githubBtn) githubBtn.style.display = 'none';
            if (discordBtn) discordBtn.style.display = 'none';
            if (statusText) statusText.textContent = `Signed in as ${user.email}`;
        } else {
            connectBtn.textContent = 'Connect with Google';
            connectBtn.classList.remove('danger');
            connectBtn.onclick = () => this.signInWithGoogle();

            if (clearDataBtn) clearDataBtn.style.display = 'none';
            if (emailToggleBtn) emailToggleBtn.style.display = 'inline-block';
            if (githubBtn) {
                githubBtn.style.display = 'inline-block';
                githubBtn.onclick = () => this.signInWithGitHub();
            }
            if (discordBtn) {
                discordBtn.style.display = 'inline-block';
                discordBtn.onclick = () => this.signInWithDiscord();
            }
            if (statusText) statusText.textContent = 'Sync your library across devices';
        }
    }
}

export const authManager = new AuthManager();
