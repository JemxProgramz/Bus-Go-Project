// js/payment.js

let qrTimerInterval;
let finalAmount = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails'));

    if (!bookingDetails) {
        window.location.href = 'index.html';
        return;
    }
    
    finalAmount = bookingDetails.totalPrice;

    // Render the summary in BOTH the mobile and desktop containers from the start
    renderBothBookingSummaries(bookingDetails);

    setupPaymentTabs();
    renderBankList();
    setupCardInputFormatting();

    document.getElementById('bank-search').addEventListener('input', filterBankList);
});

const banks = [
    { name: 'Andhra Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/andhra-bank.webp' },
    { name: 'Axis Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/axis-bank.webp' },
    { name: 'Bandhan Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/bandhan-bank.webp' },
    { name: 'Bank Of Baroda', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/bank-of-baroda.webp' },
    { name: 'Bank Of India', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/bank-of-india.webp' },
    { name: 'Bank Of Maharashtra', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/bank-of-maharashtra.webp' },
    { name: 'Canara Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/canara-bank.webp' },
    { name: 'Citibank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/citibank.webp' },
    { name: 'HDFC Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/hdfc-bank.webp' },
    { name: 'ICICI Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/icici-bank.webp' },
    { name: 'IDBI Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/idbi-bank.webp' },
    { name: 'IDFC First Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/idfc-first-bank.webp' },
    { name: 'Indian Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/indian-bank.webp' },
    { name: 'Indian Overseas Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/indian-overseas-bank.webp' },
    { name: 'IndusInd Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/indusind-bank.webp' },
    { name: 'Karnataka Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/karnataka-bank.webp' },
    { name: 'Kotak Mahindra Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/kotak-mahindra-bank.webp' },
    { name: 'Punjab National Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/punjab-national-bank.webp' },
    { name: 'SBI', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/sbi.webp' },
    { name: 'Standard Chartered Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/standard-chartered-bank.webp' },
    { name: 'Tamilnad Mercantile Bank', logo: 'https://cm-cdn.creditmantri.com/bundle/lenders-webp/tamilnad-mercantile-bank.webp' }
];

function renderBankList() {
    const bankListContainer = document.getElementById('bank-list');
    bankListContainer.innerHTML = banks.map(bank => `
        <button class="bank-option w-full justify-start">
            <img src="${bank.logo}" alt="${bank.name} logo" class="w-10 h-10 object-contain mr-2">
            ${bank.name} Net Banking
        </button>
    `).join('');
}

function filterBankList() {
    const searchTerm = document.getElementById('bank-search').value.toLowerCase();
    const bankButtons = document.querySelectorAll('#bank-list .bank-option');
    bankButtons.forEach(button => {
        button.style.display = button.textContent.toLowerCase().includes(searchTerm) ? 'flex' : 'none';
    });
}

function setupPaymentTabs() {
    const tabs = document.querySelectorAll('.payment-tab');
    const methods = document.querySelectorAll('.payment-method');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            methods.forEach(method => method.classList.toggle('hidden', method.id !== tab.dataset.target));
            
            clearInterval(qrTimerInterval);
            if (tab.dataset.target === 'upi-qr-payment') {
                generateAndShowQRCode();
            }
        });
    });

    document.getElementById('show-qr-btn').addEventListener('click', () => {
        document.querySelector('.payment-tab[data-target="upi-qr-payment"]').click();
    });

    document.getElementById('generate-qr-btn').addEventListener('click', generateAndShowQRCode);
}

function generateAndShowQRCode() {
    const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails'));
    if (!bookingDetails) return;

    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = ''; 

    const upiId = "busgo@upi";
    const amount = finalAmount;
    const upiUrl = `upi://pay?pa=${upiId}&am=${amount}&tn=BookingID-${bookingDetails.bookingId}`;

    new QRCode(qrContainer, {
        text: upiUrl,
        width: 150,
        height: 150,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    document.getElementById('qr-code-container').classList.remove('hidden');
    document.getElementById('qr-code-expired').classList.add('hidden');

    startQRTimer();
}

function startQRTimer() {
    clearInterval(qrTimerInterval);
    let timer = 300; 
    const timerElement = document.getElementById('qr-timer');
    if(!timerElement) return;

    timerElement.textContent = '05:00';

    qrTimerInterval = setInterval(() => {
        timer--;
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (timer <= 0) {
            clearInterval(qrTimerInterval);
            document.getElementById('qr-code-container').classList.add('hidden');
            document.getElementById('qr-code-expired').classList.remove('hidden');
        }
    }, 1000);
}

function renderBothBookingSummaries(bookingDetails) {
    const { bookingId, totalPrice } = bookingDetails;
    const summaryHTML = `
        <div class="bg-white p-6 rounded-xl shadow-lg sticky top-24">
            <h3 class="text-xl font-semibold border-b border-gray-200 pb-3 mb-4" data-i18n="summary">Summary</h3>
            <div class="space-y-3 text-gray-700 mb-4">
                <div class="flex justify-between"><span>Order ID</span><span class="font-mono">${bookingId}</span></div>
                <div class="flex justify-between"><span>Original Amount</span><span>₹${totalPrice}</span></div>
                <div class="discount-row hidden flex justify-between text-green-600">
                    <span data-i18n="discount">Discount</span>
                    <span class="flex items-center gap-2">
                        <span class="discount-amount"></span>
                        <button class="remove-coupon-btn text-red-500 hover:text-red-700 hidden">
                             <i data-lucide="x-circle" class="w-4 h-4"></i>
                        </button>
                    </span>
                </div>
            </div>
            <div class="coupon-section mb-6">
                <label for="coupon-code" class="block text-sm font-medium text-gray-700" data-i18n="apply_coupon">Apply Coupon</label>
                <div class="mt-1 flex rounded-md shadow-sm">
                    <input type="text" class="coupon-code-input flex-1 block w-full rounded-none rounded-l-md px-3 py-2 border border-gray-300" placeholder="Enter coupon code">
                    <button class="apply-coupon-btn inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-blue-600 text-white text-sm hover:bg-blue-700">
                        <span data-i18n="apply">Apply</span>
                    </button>
                </div>
                <p class="coupon-message text-xs mt-1 h-4"></p>
            </div>
            <div class="border-t border-gray-200 pt-4">
                 <div class="flex justify-between font-bold text-lg mb-4">
                    <span data-i18n="total_amount">Total Amount</span><span class="total-amount-display">₹${finalAmount.toFixed(2)}</span>
                 </div>
                 <button class="pay-now-btn w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex justify-center items-center gap-2">
                    <i data-lucide="check-circle" class="w-5 h-5"></i> <span class="pay-now-text" data-i18n="pay_now">Pay ₹${finalAmount.toFixed(2)}</span>
                </button>
            </div>
        </div>
    `;

    document.getElementById('booking-summary-desktop').innerHTML = summaryHTML;
    document.getElementById('booking-summary-mobile').innerHTML = summaryHTML;
    
    document.querySelectorAll('.pay-now-btn').forEach(btn => btn.addEventListener('click', handlePayment));
    document.querySelectorAll('.apply-coupon-btn').forEach(btn => btn.addEventListener('click', handleApplyCoupon));
    document.querySelectorAll('.remove-coupon-btn').forEach(btn => btn.addEventListener('click', handleRemoveCoupon));

    lucide.createIcons();
    updateTranslations();
}

function handleApplyCoupon(event) {
    const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails'));
    const summaryContainer = event.target.closest('.bg-white');
    const couponCodeInput = summaryContainer.querySelector('.coupon-code-input');
    const couponCode = couponCodeInput.value.toUpperCase();

    if (coupons[couponCode]) {
        const discountPercentage = coupons[couponCode];
        const discount = (bookingDetails.totalPrice * discountPercentage) / 100;
        finalAmount = bookingDetails.totalPrice - discount;

        document.querySelectorAll('.discount-amount').forEach(el => el.textContent = `- ₹${discount.toFixed(2)}`);
        document.querySelectorAll('.discount-row').forEach(el => el.classList.remove('hidden'));
        document.querySelectorAll('.remove-coupon-btn').forEach(el => el.classList.remove('hidden'));
        document.querySelectorAll('.total-amount-display').forEach(el => el.textContent = `₹${finalAmount.toFixed(2)}`);
        document.querySelectorAll('.pay-now-text').forEach(el => el.textContent = `Pay ₹${finalAmount.toFixed(2)}`);
        document.querySelectorAll('.coupon-section').forEach(el => el.classList.add('hidden'));
        
        showCouponSuccessPopup(discount);

    } else {
        const couponMessage = summaryContainer.querySelector('.coupon-message');
        couponMessage.textContent = translations[currentLanguage].invalid_coupon;
        couponMessage.className = 'coupon-message text-red-600 text-xs mt-1 animate-shake';
        document.querySelectorAll('.coupon-message').forEach(el => {
            if (el !== couponMessage) el.textContent = '';
        });
    }
}

function handleRemoveCoupon() {
    const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails'));
    finalAmount = bookingDetails.totalPrice;

    document.querySelectorAll('.discount-row').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.total-amount-display').forEach(el => el.textContent = `₹${finalAmount.toFixed(2)}`);
    document.querySelectorAll('.pay-now-text').forEach(el => el.textContent = `Pay ₹${finalAmount.toFixed(2)}`);
    document.querySelectorAll('.coupon-section').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.coupon-code-input').forEach(el => el.value = '');
    document.querySelectorAll('.coupon-message').forEach(el => el.textContent = '');
}

function showCouponSuccessPopup(discountAmount) {
    const popupContainer = document.getElementById('popup-container');
    const popup = document.createElement('div');
    popup.className = 'coupon-popup-overlay';
    
    popup.innerHTML = `
        <div class="coupon-popup-box">
            <h2 class="text-3xl font-bold text-yellow-500 mb-2" data-i18n="coupon_success_title"></h2>
            <p class="text-lg text-gray-700"><span data-i18n="you_saved"></span> <span class="font-bold text-green-600">₹${discountAmount.toFixed(2)}!</span></p>
            <button id="popup-ok-btn" class="mt-6 bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-700">OK</button>
        </div>
    `;

    popupContainer.appendChild(popup);
    updateTranslations();

    const popupBox = popup.querySelector('.coupon-popup-box');
    const popperColors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    
    for (let i = 0; i < 50; i++) {
        const popper = document.createElement('div');
        const isSparkle = Math.random() > 0.5;
        popper.className = isSparkle ? 'sparkle' : 'party-popper';
        
        if (!isSparkle) {
            popper.style.setProperty('--popper-color', popperColors[Math.floor(Math.random() * popperColors.length)]);
        }

        popper.style.top = `${Math.random() * 100}%`;
        popper.style.left = `${Math.random() * 100}%`;
        const size = Math.random() * 8 + 4;
        popper.style.width = `${size}px`;
        popper.style.height = `${size}px`;
        popper.style.setProperty('--x', `${(Math.random() - 0.5) * 600}%`);
        popper.style.setProperty('--y', `${(Math.random() - 0.5) * 600}%`);
        popupBox.appendChild(popper);
    }
    
    const closePopup = () => {
        popupContainer.innerHTML = '';
    };

    popup.querySelector('#popup-ok-btn').addEventListener('click', closePopup);
    popup.addEventListener('click', (e) => {
        if(e.target === popup) closePopup();
    });
}


function setupCardInputFormatting() {
    const cardNumberInput = document.getElementById('card-number');
    cardNumberInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^\dA-Z]/g, '').replace(/(.{4})/g, '$1 ').trim();
    });

    const expiryDateInput = document.getElementById('expiry-date');
    expiryDateInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
}

function validateCardDetails() {
    let isValid = true;
    document.querySelectorAll('[id$="-error"]').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
    document.querySelectorAll('#payment-form input').forEach(el => el.classList.remove('border-red-500'));

    const cardNumberInput = document.getElementById('card-number');
    const cardNumber = cardNumberInput.value.replace(/\s/g, '');
    if (!/^\d{13,16}$/.test(cardNumber) || !luhnCheck(cardNumber)) {
        document.getElementById('card-number-error').textContent = 'Please enter a valid card number.';
        document.getElementById('card-number-error').classList.remove('hidden');
        cardNumberInput.classList.add('border-red-500');
        isValid = false;
    }

    const expiryDateInput = document.getElementById('expiry-date');
    const expiryDate = expiryDateInput.value;
    const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    if (!expiryRegex.test(expiryDate)) {
        document.getElementById('expiry-date-error').textContent = 'Invalid format. Use MM/YY.';
        document.getElementById('expiry-date-error').classList.remove('hidden');
        expiryDateInput.classList.add('border-red-500');
        isValid = false;
    } else {
        const match = expiryDate.match(expiryRegex);
        const month = parseInt(match[1], 10);
        const year = parseInt(`20${match[2]}`, 10);
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
             document.getElementById('expiry-date-error').textContent = 'Card has expired.';
             document.getElementById('expiry-date-error').classList.remove('hidden');
             expiryDateInput.classList.add('border-red-500');
             isValid = false;
        }
    }

    const cvvInput = document.getElementById('cvv');
    const cvv = cvvInput.value;
    if (!/^\d{3,4}$/.test(cvv)) {
        document.getElementById('cvv-error').textContent = 'Enter a valid 3 or 4 digit CVV.';
        document.getElementById('cvv-error').classList.remove('hidden');
        cvvInput.classList.add('border-red-500');
        isValid = false;
    }

    const cardNameInput = document.getElementById('card-name');
    const cardName = cardNameInput.value.trim();
    if (cardName.length < 2 || !/^[a-zA-Z\s]+$/.test(cardName)) {
        document.getElementById('card-name-error').textContent = 'Please enter a valid name.';
        document.getElementById('card-name-error').classList.remove('hidden');
        cardNameInput.classList.add('border-red-500');
        isValid = false;
    }

    return isValid;
}

function luhnCheck(val) {
    let sum = 0;
    for (let i = 0; i < val.length; i++) {
        let intVal = parseInt(val.substr(i, 1));
        if (i % 2 === val.length % 2) {
            intVal *= 2;
            if (intVal > 9) {
                intVal = 1 + (intVal % 10);
            }
        }
        sum += intVal;
    }
    return (sum % 10) === 0;
}

function handlePayment() {
    const activeTab = document.querySelector('.payment-tab.active').dataset.target;
    let isValid = false;

    if (activeTab === 'card-payment') {
        isValid = validateCardDetails();
    } else {
        isValid = true;
    }

    if (!isValid) return;

    const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails'));
    if (!bookingDetails) return;

    bookingDetails.totalPrice = finalAmount;

    const bookingHistory = JSON.parse(localStorage.getItem('bookingHistory')) || [];
    bookingHistory.push(bookingDetails);
    localStorage.setItem('bookingHistory', JSON.stringify(bookingHistory));
    
    ['searchParams', 'selectedBusId', 'selectedSeats', 'passengerCounts', 'bookingDetails'].forEach(item => sessionStorage.removeItem(item));
    
    showNotification(`${translations[currentLanguage].booking_confirmed}! ID: ${bookingDetails.bookingId}`, 'success');
    setTimeout(() => { window.location.href = 'account.html'; }, 3000);
}