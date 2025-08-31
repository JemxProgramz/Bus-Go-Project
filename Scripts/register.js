// js/register.js

let captchaText = '';

document.addEventListener('DOMContentLoaded', () => {
    generateCaptcha();

    document.getElementById('refresh-captcha').addEventListener('click', generateCaptcha);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
});

/**
 * Generates a new 6-character alphanumeric CAPTCHA code.
 */
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    captchaText = result;
    document.getElementById('captcha-code').textContent = captchaText;
}

/**
 * Handles the registration form submission with validation and styled feedback.
 * @param {Event} e - The form submission event.
 */
function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const captchaInput = document.getElementById('captcha-input').value;

    // --- Validation with styled pop-up notifications ---

    if (password !== confirmPassword) {
        showNotification(translations[currentLanguage].passwords_do_not_match, 'error');
        return;
    }

    if (captchaInput.toUpperCase() !== captchaText.toUpperCase()) {
        showNotification(translations[currentLanguage].captcha_mismatch, 'error');
        generateCaptcha(); // Refresh captcha after a failed attempt
        return;
    }

    const users = JSON.parse(localStorage.getItem('busgo_users')) || [];
    
    if (users.some(user => user.phone === phone)) {
        showNotification(translations[currentLanguage].phone_already_registered, 'error');
        return;
    }
    if (email && users.some(user => user.email === email)) {
        showNotification(translations[currentLanguage].email_already_registered, 'error');
        return;
    }

    // --- Success Case ---

    users.push({ name, phone, email, password });
    localStorage.setItem('busgo_users', JSON.stringify(users));

    showNotification(translations[currentLanguage].registration_successful, 'success');
    
    // Automatically log the new user in
    sessionStorage.setItem('isLoggedIn', 'true');

    // Redirect to the home page after a short delay to allow the user to see the success message
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}