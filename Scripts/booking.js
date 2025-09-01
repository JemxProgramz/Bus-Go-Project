// js/booking.js

let selectedBus;
let selectedSeats = [];
let passengerCounts = { adults: 0, children: 0 };

document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    selectedBus = JSON.parse(sessionStorage.getItem('selectedBusData'));

    if (!selectedBus) {
        console.error("Selected bus data not found in sessionStorage.");
        window.location.href = 'buses.html';
        return;
    }
    
    renderSeats();
    renderBookingSummary();

    document.getElementById('seat-selection').addEventListener('click', (e) => {
        if (e.target.dataset.seatId) {
            handleToggleSeat(parseInt(e.target.dataset.seatId));
        }
    });
});

function handleToggleSeat(seatId) {
    const seat = selectedBus.seats.find(s => s.id === seatId);
    if (!seat || !seat.isAvailable) return;

    const seatIndex = selectedSeats.findIndex(s => s.id === seatId);
    if (seatIndex > -1) {
        selectedSeats.splice(seatIndex, 1);
    } else {
        selectedSeats.push(seat);
    }
    
    renderSeats();
    updateBookingSummary();
}

function renderSeats() {
    const seatSelectionContainer = document.getElementById('seat-selection');
    seatSelectionContainer.innerHTML = `
        <h3 class="text-xl font-semibold mb-4">${selectedBus.name}</h3>
        <div class="p-4 border border-gray-200 rounded-lg">
             <div class="grid grid-cols-5 gap-2" id="seat-grid">
                <div class="col-span-1 flex justify-center items-center">
                    <i data-lucide="steering-wheel" class="w-8 h-8 text-gray-400"></i>
                </div>
                <div class="col-span-4"></div>
             </div>
        </div>
        <div class="mt-4 flex justify-center flex-wrap gap-4 text-sm text-gray-700">
            <div class="flex items-center gap-2"><div class="w-4 h-4 bg-blue-100 rounded"></div><span data-i18n="available_seat"></span></div>
            <div class="flex items-center gap-2"><div class="w-4 h-4 bg-green-500 rounded"></div><span data-i18n="selected_seat"></span></div>
            <div class="flex items-center gap-2"><div class="w-4 h-4 bg-blue-300 rounded"></div><span data-i18n="booked_male_seat"></span></div>
            <div class="flex items-center gap-2"><div class="w-4 h-4 bg-pink-300 rounded"></div><span data-i18n="booked_female_seat"></span></div>
            <div class="flex items-center gap-2"><div class="w-4 h-4 bg-pink-100 rounded"></div><span data-i18n="reserved_for_female"></span></div>
        </div>`;
        
    const seatGrid = document.getElementById('seat-grid');
    selectedBus.seats.forEach((seat, index) => {
        const seatButton = document.createElement('button');
        seatButton.dataset.seatId = seat.id;
        seatButton.textContent = seat.number;
        seatButton.disabled = !seat.isAvailable;

        let seatClass = 'w-full h-12 rounded-md text-sm font-semibold transition-all duration-200 ';
        if (!seat.isAvailable) { 
            seatClass += (seat.gender === 'male' ? 'bg-blue-300' : 'bg-pink-300') + ' cursor-not-allowed text-gray-800'; 
        } else if (selectedSeats.find(s => s.id === seat.id)) { 
            seatClass += 'bg-green-500 text-white ring-2 ring-green-700'; 
        } else if (seat.reservedFor === 'female') {
            seatClass += 'bg-pink-100 hover:bg-pink-200 text-pink-800';
        } else { 
            seatClass += 'bg-blue-100 hover:bg-blue-200 text-blue-800'; 
        }
        seatButton.className = seatClass;

        seatGrid.appendChild(seatButton);
        if ((index + 1) % 4 === 2) { 
            seatGrid.appendChild(document.createElement('div')); 
        }
    });
    lucide.createIcons();
    updateTranslations();
}

function calculateTotalPrice() {
    const adults = passengerCounts.adults;
    const children = passengerCounts.children;
    const adultFare = selectedBus.price;
    const childFare = selectedBus.price / 2;
    return (adults * adultFare) + (children * childFare);
}

function renderBookingSummary() {
    const bookingSummaryContainer = document.getElementById('booking-summary');
    const totalPrice = calculateTotalPrice();
    
    bookingSummaryContainer.innerHTML = `
        <h3 class="text-xl font-semibold border-b border-gray-300 pb-3 mb-4" data-i18n="booking_summary"></h3>
        <div class="space-y-2 text-gray-700">
            <p><strong><span data-i18n="bus"></span>:</strong> ${selectedBus.name}</p>
            <p><strong><span data-i18n="route"></span>:</strong> ${selectedBus.from} to ${selectedBus.to}</p>
            <p><strong><span data-i18n="selected_seats"></span>:</strong> <span id="selected-seats-display">${selectedSeats.map(s => s.number).join(', ') || 'None'}</span></p>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-300">
            <h4 class="font-semibold mb-3" data-i18n="passenger_details"></h4>
            <div class="space-y-4">
                <div>
                    <label for="adult-count" class="block text-sm font-medium" data-i18n="adults"></label>
                    <input type="number" id="adult-count" value="${passengerCounts.adults}" min="0" class="passenger-count-input mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" onfocus="if(this.value==='0') this.value='';" onblur="if(this.value==='') this.value='0';">
                </div>
                <div>
                    <label for="child-count" class="block text-sm font-medium" data-i18n="children"></label>
                    <input type="number" id="child-count" value="${passengerCounts.children}" min="0" class="passenger-count-input mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" onfocus="if(this.value==='0') this.value='';" onblur="if(this.value==='') this.value='0';">
                </div>
            </div>
            <p class="text-xs text-gray-500 mt-2" data-i18n="child_fare_note"></p>
        </div>
        
        <div class="mt-6 pt-4 border-t border-gray-300">
            <div class="flex justify-between items-center text-2xl font-bold"><span data-i18n="total"></span>:<span id="total-price-display">₹${totalPrice.toFixed(2)}</span></div>
            <button id="proceed-btn" ${selectedSeats.length === 0 ? 'disabled' : ''} class="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex justify-center items-center gap-2">
                Proceed to Enter Details <i data-lucide="arrow-right" class="w-5 h-5"></i>
            </button>
        </div>
    `;

    document.querySelectorAll('.passenger-count-input').forEach(input => {
        input.addEventListener('input', (e) => {
            if (e.target.id === 'adult-count') passengerCounts.adults = parseInt(e.target.value) || 0;
            if (e.target.id === 'child-count') passengerCounts.children = parseInt(e.target.value) || 0;
            updateBookingSummary();
        });
    });

    document.getElementById('proceed-btn').addEventListener('click', handleProceedToDetails);
    
    lucide.createIcons();
    updateTranslations();
}

function updateBookingSummary() {
    document.getElementById('selected-seats-display').textContent = selectedSeats.map(s => s.number).join(', ') || 'None';
    const totalPrice = calculateTotalPrice();
    document.getElementById('total-price-display').textContent = `₹${totalPrice.toFixed(2)}`;
    document.getElementById('proceed-btn').disabled = selectedSeats.length === 0;
}


function showMismatchPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    modalBox.innerHTML = `
        <i data-lucide="users" class="w-12 h-12 mx-auto text-yellow-500 mb-4"></i>
        <p class="text-lg font-semibold text-gray-800 mb-4">${translations[currentLanguage].mismatch_message}</p>
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

function handleProceedToDetails() {
    const totalPassengers = passengerCounts.adults + passengerCounts.children;
    if (totalPassengers !== selectedSeats.length) {
        showMismatchPopup();
        return;
    }

    sessionStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
    sessionStorage.setItem('passengerCounts', JSON.stringify(passengerCounts));
    window.location.href = 'details.html';
}