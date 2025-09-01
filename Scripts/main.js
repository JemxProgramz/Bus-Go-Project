// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // These functions run on every page load
    renderHeader();
    renderFooter();
    setupLanguageSwitcher();
    updateTranslations();
    lucide.createIcons();
});

// --- AUTHENTICATION ---

/**
 * Checks if a user is currently logged in for this session.
 * @returns {boolean} True if the user is logged in, false otherwise.
 */
function isLoggedIn() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Handles the login attempt with styled pop-up notifications.
 */
function handleLogin() {
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;
    const users = JSON.parse(localStorage.getItem('busgo_users')) || [];

    const user = users.find(u => (u.email === identifier || u.phone === identifier));

    if (!user) {
        showNotification(translations[currentLanguage].user_not_found, 'error');
        return;
    }

    if (user.password === password) {
        showNotification(translations[currentLanguage].login_successful, 'success');
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', JSON.stringify(user)); // Store the logged-in user's data
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showNotification(translations[currentLanguage].login_failed_password, 'error');
    }
}

/**
 * Logs the user out by clearing the session storage.
 */
function handleLogout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('currentUser'); // Clear the user's data on logout
    window.location.href = 'index.html';
}

/**
 * Creates and displays a styled notification pop-up.
 * @param {string} message - The text to display in the notification.
 * @param {string} type - The type of notification ('success' or 'error').
 */
function showNotification(message, type) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notif = document.createElement('div');
    notif.className = `notification-popup ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    notif.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5"></i>
        <span>${message}</span>
    `;

    container.appendChild(notif);
    lucide.createIcons();

    setTimeout(() => {
        notif.remove();
    }, 4000);
}


// --- RENDERING ---

/**
 * Renders the header dynamically and responsively based on the user's login status.
 */
function renderHeader() {
    const authLinksContainer = document.getElementById('auth-links');
    if (!authLinksContainer) return;

    if (isLoggedIn()) {
        authLinksContainer.innerHTML = `
            <a href="account.html" class="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                <i data-lucide="user" class="w-5 h-5"></i>
                <span class="hidden sm:inline" data-i18n="my_account">My Account</span>
            </a>
            <button id="logout-btn" class="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transform hover:scale-105">
                <i data-lucide="log-out" class="w-5 h-5"></i>
                <span class="hidden sm:inline" data-i18n="logout_btn">Logout</span>
            </button>
        `;
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
    } else {
        authLinksContainer.innerHTML = `
            <a href="login.html" class="bg-blue-600 flex items-center gap-2 text-white px-4 py-2 rounded-lg font-semibold transform hover:scale-105">
                <i data-lucide="log-in" class="w-5 h-5"></i>
                <span class="hidden sm:inline" data-i18n="login_btn">Login</span>
            </a>
        `;
    }
    lucide.createIcons();
}

/**
 * Sets the current year in the footer.
 */
function renderFooter() {
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}


// --- INTERNATIONALIZATION (i18n) ---

let currentLanguage = localStorage.getItem('language') || 'en';

/**
 * Sets up the event listener for the language dropdown.
 */
function setupLanguageSwitcher() {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = currentLanguage;
        languageSelect.addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            localStorage.setItem('language', currentLanguage);
            updateTranslations();
            renderHeader(); 
        });
    }
}

/**
 * Updates all text content on the page to the selected language.
 */
function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
             if (el.childNodes.length > 1 && (el.querySelector('i') || el.querySelector('img'))) {
                const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0);
                if(textNode) textNode.textContent = ` ${translations[currentLanguage][key]} `;
             } else {
                el.textContent = translations[currentLanguage][key];
             }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            el.placeholder = translations[currentLanguage][key];
        }
    });
    
    if (translations[currentLanguage] && translations[currentLanguage]['title']) {
        document.title = translations[currentLanguage]['title'];
    }
}