// js/account.js

document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    renderUserDashboard();
    setupEventListeners();
});

/**
 * Renders the entire list of user bookings from localStorage.
 */
function renderUserDashboard() {
    const bookingHistoryContainer = document.getElementById('booking-history-container');
    const bookingHistory = JSON.parse(localStorage.getItem('bookingHistory')) || [];
    
    bookingHistoryContainer.innerHTML = ''; // Clear previous content to prevent duplicates

    if (bookingHistory.length > 0) {
        // Display bookings in reverse chronological order (newest first)
        bookingHistory.slice().reverse().forEach(booking => {
            const isCancelled = booking.status === 'Cancelled';
            const { refundAmount, deductionPercentage } = calculateRefund(booking);

            const passengerList = booking.passengers.map(p => 
                `<li class="text-sm">${p.name} (Age: ${p.age}, Gender: ${p.gender}) - Seat: ${p.seatNumber}</li>`
            ).join('');

            const bookingCard = document.createElement('div');
            // Change card style based on ticket status
            bookingCard.className = `p-4 rounded-lg ${isCancelled ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`;

            bookingCard.innerHTML = `
                <div class="flex flex-wrap justify-between items-start gap-2">
                    <div>
                        <p class="font-bold text-lg ${isCancelled ? 'text-red-800' : 'text-green-800'}"><span data-i18n="booking_id_is"></span>: ${booking.bookingId}</p>
                        <p class="text-gray-700">${booking.bus.name} (${booking.bus.from} to ${booking.bus.to})</p>
                        <p class="text-sm text-gray-600">Booker: ${booking.primaryContact.name} | Mobile: ${booking.primaryContact.mobile}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-xl ${isCancelled ? 'text-red-900' : 'text-green-900'}">₹${booking.totalPrice}</p>
                        <span class="text-sm px-2 py-1 rounded-full ${isCancelled ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}">
                            ${isCancelled ? translations[currentLanguage].ticket_cancelled : translations[currentLanguage].status_confirmed}
                        </span>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t ${isCancelled ? 'border-red-200' : 'border-green-200'}">
                    <strong class="text-gray-700" data-i18n="passengers"></strong>
                    <ul class="list-disc list-inside mt-2 text-gray-600">${passengerList}</ul>
                </div>
                <div class="mt-4 pt-4 border-t ${isCancelled ? 'border-red-200' : 'border-green-200'} flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div class="text-sm text-gray-700">
                        ${!isCancelled && refundAmount > 0 ? `
                            <strong data-i18n="refund_amount"></strong>: ₹${refundAmount} 
                            <span class="text-gray-500">(<span data-i18n="cancellation_charge"></span>: ${deductionPercentage}%)</span>
                        ` : ''}
                        ${isCancelled && booking.refundAmount ? `
                            <strong class="text-red-700">${translations[currentLanguage].refund_amount}: ₹${booking.refundAmount}</strong>
                        ` : ''}
                    </div>
                    <div class="flex justify-end gap-3">
                        <button ${isCancelled ? 'disabled' : ''} data-booking-id="${booking.bookingId}" class="print-btn flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <i data-lucide="printer" class="w-4 h-4"></i> <span data-i18n="print_ticket"></span>
                        </button>
                        <button ${isCancelled ? 'disabled' : ''} data-booking-id="${booking.bookingId}" class="cancel-btn flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <i data-lucide="x-circle" class="w-4 h-4"></i> <span data-i18n="cancel_ticket"></span>
                        </button>
                    </div>
                </div>
            `;
            bookingHistoryContainer.appendChild(bookingCard);
        });
    } else {
        bookingHistoryContainer.innerHTML = `<p class="text-gray-600" data-i18n="no_history"></p>`;
    }
    
    lucide.createIcons();
    updateTranslations();
}

/**
 * Sets up global event listeners for the page.
 */
function setupEventListeners() {
    const container = document.getElementById('booking-history-container');
    container.addEventListener('click', (e) => {
        const printButton = e.target.closest('.print-btn');
        const cancelButton = e.target.closest('.cancel-btn');

        if (printButton) {
            handlePrintTicket(printButton.dataset.bookingId);
        }
        if (cancelButton) {
            handleCancelTicket(cancelButton.dataset.bookingId);
        }
    });

    document.getElementById('refund-rules-btn').addEventListener('click', showRefundPolicyPopup);
}

/**
 * Calculates the refund amount based on the time difference to the journey.
 * @param {object} booking - The booking object.
 * @returns {object} An object containing the refundAmount and deductionPercentage.
 */
function calculateRefund(booking) {
    const journeyTime = new Date(booking.journeyTimestamp).getTime();
    const currentTime = new Date().getTime();
    const hoursDifference = (journeyTime - currentTime) / (1000 * 60 * 60);

    if (hoursDifference < 1) {
        return { refundAmount: 0, deductionPercentage: 100 };
    }
    if (hoursDifference >= 1 && hoursDifference < 24) {
        const deduction = 25;
        return { refundAmount: Math.round(booking.totalPrice * ((100 - deduction) / 100)), deductionPercentage: deduction };
    }
    if (hoursDifference >= 24 && hoursDifference < 48) {
        const deduction = 20;
        return { refundAmount: Math.round(booking.totalPrice * ((100 - deduction) / 100)), deductionPercentage: deduction };
    }
    if (hoursDifference >= 48) {
        const deduction = 10;
        return { refundAmount: Math.round(booking.totalPrice * ((100 - deduction) / 100)), deductionPercentage: deduction };
    }
    return { refundAmount: 0, deductionPercentage: 100 }; // Default case
}

/**
 * Initiates the ticket cancellation process by showing a confirmation pop-up.
 * @param {string} bookingId - The ID of the booking to cancel.
 */
function handleCancelTicket(bookingId) {
    const bookingHistory = JSON.parse(localStorage.getItem('bookingHistory')) || [];
    const booking = bookingHistory.find(b => b.bookingId === bookingId);
    if (!booking) return;

    const { refundAmount, deductionPercentage } = calculateRefund(booking);

    if (refundAmount <= 0) {
        showNotification("This ticket is no longer eligible for a refund as the departure time is less than 1 hour away.", 'error');
        return;
    }

    showCancellationPopup(booking, refundAmount, deductionPercentage);
}

/**
 * Shows a custom styled pop-up to confirm ticket cancellation.
 * @param {object} booking - The booking object being cancelled.
 * @param {number} refundAmount - The calculated refund amount.
 * @param {number} deductionPercentage - The calculated deduction percentage.
 */
function showCancellationPopup(booking, refundAmount, deductionPercentage) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';

    modalBox.innerHTML = `
        <h3 class="text-xl font-bold text-gray-800 mb-2" data-i18n="confirm_cancellation_title"></h3>
        <p class="text-gray-600 mb-4" data-i18n="confirm_cancellation_body"></p>
        <div class="text-left bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6 space-y-1">
            <p><strong><span data-i18n="total_fare"></span>:</strong> ₹${booking.totalPrice}</p>
            <p><strong><span data-i18n="cancellation_charge"></span>:</strong> - ₹${booking.totalPrice - refundAmount} (${deductionPercentage}%)</p>
            <p class="font-bold text-green-700"><strong><span data-i18n="refund_amount"></span>:</strong> ₹${refundAmount}</p>
        </div>
        <div class="flex justify-end gap-4">
            <button id="close-modal-btn" class="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 font-semibold" data-i18n="go_back"></button>
            <button id="confirm-cancel-btn" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold" data-i18n="confirm"></button>
        </div>
    `;

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    lucide.createIcons();
    updateTranslations();

    const closeModal = () => document.body.removeChild(overlay);

    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
        let bookingHistory = JSON.parse(localStorage.getItem('bookingHistory')) || [];
        const bookingIndex = bookingHistory.findIndex(b => b.bookingId === booking.bookingId);
        
        if (bookingIndex > -1) {
            bookingHistory[bookingIndex].status = 'Cancelled';
            bookingHistory[bookingIndex].refundAmount = refundAmount;
            localStorage.setItem('bookingHistory', JSON.stringify(bookingHistory));
            
            showNotification(translations[currentLanguage].cancellation_successful, 'success');
            renderUserDashboard();
        }
        closeModal();
    });
}

/**
 * Shows a pop-up with the detailed refund policy.
 */
function showRefundPolicyPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    modalBox.innerHTML = `
        <div class="text-right"><button id="close-modal-btn" class="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button></div>
        ${translations[currentLanguage].refund_policy_details}
    `;
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    
    const closeModal = () => document.body.removeChild(overlay);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
}

/**
 * Generates a printable ticket and opens the print dialog.
 * @param {string} bookingId - The ID of the booking to print.
 */
function handlePrintTicket(bookingId) {
    const bookingHistory = JSON.parse(localStorage.getItem('bookingHistory')) || [];
    const booking = bookingHistory.find(b => b.bookingId === bookingId);

    if (!booking || booking.status === 'Cancelled') return;

    const printArea = document.getElementById('print-area');
    
    const passengerRows = booking.passengers.map(p => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.name}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.age}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.gender}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.seatNumber}</td>
        </tr>
    `).join('');

    printArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #333; margin: 20px;">
            <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="font-size: 24px; margin: 0;">BusGo Ticket</h1>
            </div>
            <h2>Booking ID: ${booking.bookingId}</h2>
            <p><strong>Bus Operator:</strong> ${booking.bus.name}</p>
            <p><strong>Route:</strong> ${booking.bus.from} to ${booking.bus.to}</p>
            <p><strong>Date & Time of Departure:</strong> ${new Date(booking.journeyTimestamp).toLocaleString()}</p>
            <hr style="margin: 20px 0;">
            <h3>Passenger Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Age</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Gender</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Seat</th>
                    </tr>
                </thead>
                <tbody>${passengerRows}</tbody>
            </table>
            <hr style="margin: 20px 0;">
            <p style="text-align: right; font-size: 18px;"><strong>Total Fare: ₹${booking.totalPrice}</strong></p>
            <p style="text-align: center; margin-top: 30px; font-size: 12px;">Thank you for choosing BusGo. Have a safe journey!</p>
        </div>
    `;

    window.print();
    location.reload(); 
}