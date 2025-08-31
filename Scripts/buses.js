// js/buses.js

let routeBuses = [];
let activeFilters = {
    price: 3000, // Increased default max price
    busTypes: [],
    departureTimes: [],
    rating: 0
};

document.addEventListener('DOMContentLoaded', () => {
    const searchParams = JSON.parse(sessionStorage.getItem('searchParams'));
    if (!searchParams) {
        window.location.href = 'index.html';
        return;
    }
    setupPage(searchParams);
    setupEventListeners();
});

function setupPage(params) {
    const { from, to, date } = params;
    document.getElementById('buses-title').textContent = `${from} to ${to}`;
    const formattedDate = new Date(date).toDateString();
    
    const filteredRawData = setcBusData.filter(bus => 
        bus.from.toLowerCase().includes(from.toLowerCase()) &&
        bus.to.toLowerCase().includes(to.toLowerCase())
    );

    routeBuses = filteredRawData.flatMap((bus, index) => {
        const timings = bus.departureTimings.split(',');

        return timings.map((time, subIndex) => {
            const departureHour = parseInt(time.trim().split('.')[0]);
            
            const timeParts = time.trim().split('.');
            const depHour = parseInt(timeParts[0]);
            const depMinute = parseInt(timeParts[1] || 0);
            const departureDate = new Date();
            departureDate.setHours(depHour, depMinute, 0, 0);
            
            const durationParts = bus.duration.match(/(\d+)h\s*(\d+)m/);
            let totalMinutes = 0;
            if (durationParts) {
                totalMinutes = parseInt(durationParts[1]) * 60 + parseInt(durationParts[2]);
            }
            
            const arrivalDate = new Date(departureDate.getTime() + totalMinutes * 60000);
            const arrivalTime = `${String(arrivalDate.getHours()).padStart(2, '0')}:${String(arrivalDate.getMinutes()).padStart(2, '0')}`;
            
            return {
                id: `${bus.routeNo}-${index}-${subIndex}`,
                name: `SETC Route ${bus.routeNo}`,
                from: bus.from,
                to: bus.to,
                departureTime: time.trim().replace('.', ':'),
                arrivalTime: arrivalTime,
                duration: bus.duration,
                price: bus.price,
                rating: bus.rating,
                busType: bus.type === 'A/C' ? 'AC Buses' : 'Ultra Deluxe Buses',
                departureTimestamp: departureHour,
                seats: Array(40).fill(null).map((_, i) => {
                    const isAvailable = Math.random() > 0.4;
                    let gender = null;
                    let reservedFor = null;

                    if (!isAvailable) {
                        gender = Math.random() > 0.5 ? 'male' : 'female';
                    } else {
                        // Reserve first 4 seats for females
                        if (i < 4) {
                            reservedFor = 'female';
                        }
                    }

                    return { 
                        id: i + 1, 
                        number: `S${i + 1}`, 
                        isAvailable: isAvailable,
                        gender: gender,
                        reservedFor: reservedFor
                    }
                })
            };
        });
    });

    if (routeBuses.length > 0) {
        document.getElementById('buses-subtitle').textContent = `Found ${routeBuses.length} buses for your journey on ${formattedDate}.`;
        renderBusTypesFilter();
        setupPriceFilter();
        displayBuses(routeBuses);
    } else {
        document.getElementById('buses-list').innerHTML = `<div class="text-center py-16 bg-white rounded-lg shadow-lg"><i data-lucide="bus-front" class="mx-auto text-gray-400 w-16 h-16"></i><h3 class="mt-4 text-xl font-semibold text-gray-700">No buses found for this route.</h3></div>`;
        document.getElementById('buses-subtitle').textContent = `No buses found for your journey on ${formattedDate}.`;
        lucide.createIcons();
    }
}

function setupEventListeners() {
    document.getElementById('price-range').addEventListener('input', (e) => {
        document.getElementById('price-value').textContent = e.target.value;
        activeFilters.price = Number(e.target.value);
        applyAndDisplayFilters();
    });

    document.getElementById('bus-type-filter').addEventListener('change', (e) => {
        if (e.target.checked) {
            activeFilters.busTypes.push(e.target.value);
        } else {
            activeFilters.busTypes = activeFilters.busTypes.filter(type => type !== e.target.value);
        }
        applyAndDisplayFilters();
    });

    document.getElementById('departure-time-filter').addEventListener('change', (e) => {
        const value = e.target.value;
        if (e.target.checked) {
            activeFilters.departureTimes.push(value);
        } else {
            activeFilters.departureTimes = activeFilters.departureTimes.filter(time => time !== value);
        }
        applyAndDisplayFilters();
    });

    document.getElementById('rating-filter').addEventListener('change', (e) => {
        activeFilters.rating = Number(e.target.value);
        applyAndDisplayFilters();
    });
    
    document.getElementById('clear-filters-btn').addEventListener('click', () => {
        activeFilters = { price: 3000, busTypes: [], departureTimes: [], rating: 0 };
        document.querySelectorAll('#filters-container input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('#filters-container input[type="radio"]').forEach(rb => rb.checked = rb.value === '0');
        const priceRange = document.getElementById('price-range');
        if (priceRange) {
            priceRange.value = priceRange.max;
            document.getElementById('price-value').textContent = priceRange.max;
        }
        displayBuses(routeBuses);
    });
    
    document.getElementById('buses-list').addEventListener('click', (e) => {
        const button = e.target.closest('.book-seat-btn');
        if (button) {
            handleSelectBus(button.dataset.busId);
        }
    });
}

function applyAndDisplayFilters() {
    let filteredBuses = [...routeBuses];

    if (activeFilters.price) {
        filteredBuses = filteredBuses.filter(bus => bus.price <= activeFilters.price);
    }
    if (activeFilters.busTypes.length > 0) {
        filteredBuses = filteredBuses.filter(bus => activeFilters.busTypes.includes(bus.busType));
    }
    if (activeFilters.departureTimes.length > 0) {
        filteredBuses = filteredBuses.filter(bus => {
            const hour = bus.departureTimestamp;
            return activeFilters.departureTimes.some(timeSlot => {
                if (timeSlot === '1') return hour < 6;
                if (timeSlot === '2') return hour >= 6 && hour < 12;
                if (timeSlot === '3') return hour >= 12 && hour < 18;
                if (timeSlot === '4') return hour >= 18;
                return false;
            });
        });
    }
    if (activeFilters.rating > 0) {
        filteredBuses = filteredBuses.filter(bus => bus.rating >= activeFilters.rating);
    }
    
    displayBuses(filteredBuses);
}

function displayBuses(buses) {
    const busesListContainer = document.getElementById('buses-list');
    busesListContainer.innerHTML = '';
    
    if (buses.length > 0) {
        buses.forEach((bus) => {
            const busCard = document.createElement('div');
            busCard.className = "bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1";
            busCard.innerHTML = `
                <div class="p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div class="md:col-span-3">
                        <h3 class="text-xl font-bold text-gray-900">${bus.name}</h3>
                        <p class="text-sm text-gray-500">${bus.busType}</p>
                        <div class="flex items-center flex-wrap gap-4 text-gray-600 mt-2">
                            <div class="flex items-center gap-2"><i data-lucide="clock" class="w-4 h-4"></i><span>${bus.departureTime}</span></div>
                            <i data-lucide="arrow-right" class="w-4 h-4 text-gray-400"></i>
                            <div class="flex items-center gap-2"><i data-lucide="clock" class="w-4 h-4"></i><span>${bus.arrivalTime}</span></div>
                            <span class="text-sm text-gray-500">(${bus.duration})</span>
                        </div>
                    </div>
                    <div class="md:col-span-1 text-center md:text-left">
                        <p class="text-2xl font-bold text-blue-600">₹${bus.price}</p>
                        <div class="flex justify-center md:justify-start items-center gap-1 text-yellow-500">
                            <i data-lucide="star" class="w-4 h-4 fill-current"></i><span>${bus.rating}</span>
                        </div>
                    </div>
                    <div class="md:col-span-1">
                        <button data-bus-id="${bus.id}" class="book-seat-btn w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700" data-i18n="book_seats_btn">Book Seats</button>
                    </div>
                </div>`;
            busesListContainer.appendChild(busCard);
        });
    } else {
        if (document.querySelector('#buses-list .spinner') === null && document.querySelector('#buses-list [data-lucide="server-crash"]') === null) {
            busesListContainer.innerHTML = `<div class="text-center py-16 bg-white rounded-lg shadow-lg"><i data-lucide="bus-front" class="mx-auto text-gray-400 w-16 h-16"></i><h3 class="mt-4 text-xl font-semibold text-gray-700" data-i18n="no_buses_match_filters"></h3></div>`;
        }
    }
    
    lucide.createIcons();
    updateTranslations();
}

function handleSelectBus(busId) {
    if (isLoggedIn()) {
        const selectedBusData = routeBuses.find(bus => bus.id === busId);
        sessionStorage.setItem('selectedBusData', JSON.stringify(selectedBusData));
        sessionStorage.setItem('selectedBusId', busId);
        window.location.href = 'booking.html';
    } else {
        showLoginPopup();
    }
}

function showLoginPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    modalBox.innerHTML = `
        <i data-lucide="log-in" class="w-12 h-12 mx-auto text-blue-500 mb-4"></i>
        <p class="text-lg font-semibold text-gray-800 mb-4" data-i18n="please_login_to_book"></p>
        <button id="popup-ok-btn" class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors" data-i18n="ok">OK</button>
    `;
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    lucide.createIcons();
    updateTranslations();

    const okButton = document.getElementById('popup-ok-btn');
    const closeModal = () => {
        document.body.removeChild(overlay);
    };
    okButton.addEventListener('click', () => {
        closeModal();
        window.location.href = 'login.html';
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });
}

function renderBusTypesFilter() {
    const busTypes = [...new Set(routeBuses.map(bus => bus.busType))];
    const container = document.getElementById('bus-type-filter');
    container.innerHTML = '';
    busTypes.forEach(type => {
        const div = document.createElement('div');
        div.className = 'flex items-center';
        div.innerHTML = `<input type="checkbox" id="type-${type.replace(/\s+/g, '')}" value="${type}" class="h-4 w-4 rounded"><label for="type-${type.replace(/\s+/g, '')}" class="ml-2">${type}</label>`;
        container.appendChild(div);
    });
}

function setupPriceFilter() {
    const maxPrice = routeBuses.length > 0 ? Math.max(...routeBuses.map(bus => bus.price)) : 3000;
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-value');
    if(priceRange) {
        priceRange.max = maxPrice;
        priceRange.value = maxPrice;
        priceValue.textContent = maxPrice;
        activeFilters.price = maxPrice;
    }
}