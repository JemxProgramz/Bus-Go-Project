// js/home.js

document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today; // Prevent selecting past dates in browsers that support it

    const searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', handleSearch);

    const swapBtn = document.getElementById('swap-locations');
    swapBtn.addEventListener('click', handleSwap);

    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const fromSuggestions = document.getElementById('from-suggestions');
    const toSuggestions = document.getElementById('to-suggestions');

    fromInput.addEventListener('input', () => showSuggestions(fromInput, fromSuggestions));
    toInput.addEventListener('input', () => showSuggestions(toInput, toSuggestions));

    document.addEventListener('click', (e) => {
        if (!fromInput.contains(e.target)) fromSuggestions.innerHTML = '';
        if (!toInput.contains(e.target)) toSuggestions.innerHTML = '';
    });
});

function handleSearch(e) {
    e.preventDefault();
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const dateInput = document.getElementById('date');
    const selectedDate = dateInput.value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate < today) {
        showPastDatePopup();
        dateInput.value = today; // Reset to today's date
        return;
    }
    
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
        alert(translations[currentLanguage].same_location_text);
        return;
    }

    sessionStorage.setItem('searchParams', JSON.stringify({ from, to, date: selectedDate }));
    window.location.href = 'buses.html';
}

function handleSwap() {
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const temp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = temp;
}

function showSuggestions(inputElement, suggestionsContainer) {
    const value = inputElement.value.toLowerCase();
    suggestionsContainer.innerHTML = '';

    if (!value) return;

    const matchingCities = CITIES.filter(city => 
        city.toLowerCase().startsWith(value)
    );

    matchingCities.forEach(city => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'suggestion-item';
        suggestionDiv.textContent = city;
        
        suggestionDiv.addEventListener('click', () => {
            inputElement.value = city;
            suggestionsContainer.innerHTML = '';
        });
        
        suggestionsContainer.appendChild(suggestionDiv);
    });
}

function showPastDatePopup() {
    const popupContainer = document.getElementById('popup-container');
    if (!popupContainer) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    modalBox.innerHTML = `
        <i data-lucide="alert-triangle" class="w-12 h-12 mx-auto text-yellow-500 mb-4"></i>
        <p class="text-lg font-semibold text-gray-800 mb-4">You have selected a past date. Please select a valid date.</p>
        <button id="popup-ok-btn" class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">OK</button>
    `;
    
    overlay.appendChild(modalBox);
    popupContainer.appendChild(overlay);
    lucide.createIcons();
    
    const closeModal = () => {
        popupContainer.innerHTML = '';
    };

    document.getElementById('popup-ok-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });
}