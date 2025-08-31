// js/details.js

let selectedBus;
let selectedSeats;

document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    selectedBus = JSON.parse(sessionStorage.getItem('selectedBusData'));
    selectedSeats = JSON.parse(sessionStorage.getItem('selectedSeats'));

    if (!selectedBus || !selectedSeats || selectedSeats.length === 0) {
        console.error("Required booking data not found, redirecting.");
        window.location.href = 'buses.html';
        return;
    }

    renderPassengerForms();
    renderSummary();
});

function renderPassengerForms() {
    const container = document.getElementById('passenger-forms-container');
    container.innerHTML = ''; 

    selectedSeats.forEach((seat, index) => {
        const formHtml = `
            <div class="bg-white p-6 rounded-xl shadow-lg">
                <h3 class="text-lg font-semibold text-gray-700">Passenger ${index + 1} - <span class="text-blue-600">Seat ${seat.number}</span></h3>
                <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label for="name-${index}" class="block text-sm font-medium">Name <span class="text-red-500">*</span></label>
                        <input type="text" id="name-${index}" data-passenger-index="${index}" class="passenger-input mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" required oninput="this.value=this.value.replace(/[^a-zA-Z\\s]/g,'')">
                    </div>
                    <div>
                        <label for="age-${index}" class="block text-sm font-medium">Age <span class="text-red-500">*</span></label>
                        <input type="number" id="age-${index}" data-passenger-index="${index}" class="passenger-input mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" required min="1" oninput="this.value=this.value.replace(/\\D/g,'')" maxlength="3" max="999">
                    </div>
                    <div>
                        <label for="gender-${index}" class="block text-sm font-medium">Gender <span class="text-red-500">*</span></label>
                        <select id="gender-${index}" data-passenger-index="${index}" class="passenger-input mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += formHtml;
    });
}

function renderSummary() {
    const passengerCounts = JSON.parse(sessionStorage.getItem('passengerCounts')) || { adults: 0, children: 0 };
    const adults = passengerCounts.adults;
    const children = passengerCounts.children;
    const adultFare = selectedBus.price;
    const childFare = selectedBus.price / 2;
    const totalPrice = (adults * adultFare) + (children * childFare);

    const summaryContainer = document.getElementById('booking-summary-details');
    
    summaryContainer.innerHTML = `
        <h3 class="text-xl font-semibold border-b border-gray-300 pb-3 mb-4" data-i18n="booking_summary"></h3>
        <div class="space-y-2 text-gray-700">
            <p><strong><span data-i18n="bus"></span>:</strong> ${selectedBus.name}</p>
            <p><strong><span data-i18n="route"></span>:</strong> ${selectedBus.from} to ${selectedBus.to}</p>
            <p><strong><span data-i18n="selected_seats"></span>:</strong> ${selectedSeats.map(s => s.number).join(', ')}</p>
        </div>
        <div class="mt-6 pt-4 border-t border-gray-300">
            <div class="flex justify-between items-center text-2xl font-bold"><span data-i18n="total"></span>:<span>₹${totalPrice.toFixed(2)}</span></div>
            <button id="confirm-booking-btn" class="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex justify-center items-center gap-2">
                 <i data-lucide="check-circle" class="w-5 h-5"></i> <span data-i18n="confirm_booking"></span>
            </button>
        </div>
    `;
    document.getElementById('confirm-booking-btn').addEventListener('click', handleConfirmBooking);
    lucide.createIcons();
    updateTranslations();
}

function showChildBookingErrorPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    modalBox.innerHTML = `
        <i data-lucide="alert-triangle" class="w-12 h-12 mx-auto text-red-500 mb-4"></i>
        <p class="text-lg font-semibold text-gray-800 mb-4">${translations[currentLanguage].single_child_booking_error}</p>
        <button id="popup-ok-btn" class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors" data-i18n="ok">OK</button>
    `;
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    lucide.createIcons();
    updateTranslations();

    const closeModal = () => {
        document.body.removeChild(overlay);
    };

    document.getElementById('popup-ok-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

function showAgeMismatchPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    modalBox.innerHTML = `
        <i data-lucide="alert-circle" class="w-12 h-12 mx-auto text-red-500 mb-4"></i>
        <p class="text-lg font-semibold text-gray-800 mb-4">${translations[currentLanguage].age_mismatch_error}</p>
        <button id="popup-ok-btn" class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors" data-i18n="ok">OK</button>
    `;
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    lucide.createIcons();
    updateTranslations();

    const closeModal = () => {
        document.body.removeChild(overlay);
    };

    document.getElementById('popup-ok-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

async function handleConfirmBooking() {
    const form = document.getElementById('passenger-details-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const passengerCounts = JSON.parse(sessionStorage.getItem('passengerCounts'));
    const expectedAdults = passengerCounts.adults || 0;
    const expectedChildren = passengerCounts.children || 0;

    if (expectedAdults === 0 && expectedChildren > 0) {
        showChildBookingErrorPopup();
        return;
    }

    let actualAdults = 0;
    let actualChildren = 0;
    const passengers = [];
    
    for (let i = 0; i < selectedSeats.length; i++) {
        const age = parseInt(document.getElementById(`age-${i}`).value, 10);
        const gender = document.getElementById(`gender-${i}`).value;
        const seat = selectedSeats[i];

        if (seat.reservedFor && seat.reservedFor !== gender.toLowerCase()) {
            showGenderMismatchPopup();
            return;
        }

        if (age >= 12) {
            actualAdults++;
        } else if (age >= 5 && age < 12) {
            actualChildren++;
        } else {
            actualAdults++; 
        }
        
        passengers.push({
            seatNumber: selectedSeats[i].number,
            name: document.getElementById(`name-${i}`).value,
            age: age,
            gender: gender,
        });
    }

    if (actualAdults !== expectedAdults || actualChildren !== expectedChildren) {
        showAgeMismatchPopup();
        return;
    }

    const searchParams = JSON.parse(sessionStorage.getItem('searchParams'));
    const journeyDate = searchParams.date;
    const departureTimestamp = selectedBus.departureTimestamp;
    const journeyDateTime = new Date(`${journeyDate}T${String(departureTimestamp).padStart(2, '0')}:00:00`);

    const adultFare = selectedBus.price;
    const childFare = selectedBus.price / 2;
    const totalPrice = (expectedAdults * adultFare) + (expectedChildren * childFare);

    const bookingDetails = {
        bus: selectedBus,
        seats: selectedSeats,
        passengers: passengers,
        passengerCounts: passengerCounts,
        primaryContact: {
            name: document.getElementById('primary-name').value,
            mobile: document.getElementById('primary-mobile').value,
            aadhaar: document.getElementById('primary-aadhaar').value,
        },
        totalPrice: totalPrice,
        bookingId: `BG${Date.now()}`,
        journeyTimestamp: journeyDateTime.toISOString(),
        status: 'Confirmed',
    };
    
    sessionStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
    window.location.href = 'payment.html';
}

function showGenderMismatchPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    modalBox.innerHTML = `
        <i data-lucide="alert-circle" class="w-12 h-12 mx-auto text-red-500 mb-4"></i>
        <p class="text-lg font-semibold text-gray-800 mb-4">${translations[currentLanguage].gender_mismatch_error}</p>
        <button id="popup-ok-btn" class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors" data-i18n="ok">OK</button>
    `;
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    lucide.createIcons();
    updateTranslations();

    const closeModal = () => {
        document.body.removeChild(overlay);
    };

    document.getElementById('popup-ok-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}