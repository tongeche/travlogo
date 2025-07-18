// services/HotelSearchFormService.js

class HotelSearchFormService {
    constructor(formId, resultsContainerId) {
        this.form = document.getElementById(formId);
        this.resultsContainer = document.getElementById(resultsContainerId);

        if (!this.form) {
            console.error(`Form with ID "${formId}" not found.`);
            return;
        }
        if (!this.resultsContainer) {
            console.error(`Results container with ID "${resultsContainerId}" not found.`);
            return;
        }

        this.initEventListeners();
    }

    initEventListeners() {
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    // Helper to parse dates like "16 Jul – 19 Jul" into YYYY-MM-DD
    parseDates(dateRangeString) {
        const parts = dateRangeString.split(' – ').map(s => s.trim()); // Trim whitespace around "–"
        if (parts.length !== 2) return null;

        const parseSingleDate = (dateStr) => {
            // This is a simplified parser. For production, consider a robust date library
            // like date-fns or moment.js, especially for handling different years/locales.
            const monthMap = {
                'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
                'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
            };
            const [dayStr, monthAbbr] = dateStr.split(' ');
            const monthNum = monthMap[monthAbbr.toLowerCase()];
            const day = parseInt(dayStr, 10);
            const currentYear = new Date().getFullYear(); // Assume current year for simplicity

            if (!monthNum || isNaN(day)) return null;

            // Pad day with leading zero if needed
            const formattedDay = day < 10 ? `0${day}` : `${day}`;

            return `${currentYear}-${monthNum}-${formattedDay}`;
        };

        const checkIn = parseSingleDate(parts[0]);
        const checkOut = parseSingleDate(parts[1]);

        if (!checkIn || !checkOut) return null;
        return { checkIn, checkOut };
    }

    // Helper to map destination name to Amadeus cityCode
    // This is a simplified example. For a real application, you'd have
    // an autocomplete API (like Amadeus Location Autocomplete) or a more extensive lookup.
    getCityCode(destinationName) {
        const cityCodeMap = {
            'lisbon': 'LIS',
            'london': 'LON',
            'new york': 'NYC',
            'madrid': 'MAD',
            // Add more as needed based on Amadeus documentation
        };
        return cityCodeMap[destinationName.toLowerCase()] || null;
    }

    // Helper to parse guests input
    parseGuests(guestsString) {
        const match = guestsString.match(/(\d+)\s+traveler/i);
        return match ? parseInt(match[1], 10) : NaN;
    }

    async handleFormSubmit(event) {
        event.preventDefault(); // Prevent default form submission

        // Get values from the form inputs using their IDs
        const destinationInput = this.form.querySelector('#destinationInput');
        const datesInput = this.form.querySelector('#datesInput');
        const guestsInput = this.form.querySelector('#guestsInput');

        const destinationRaw = destinationInput.value.trim();
        const datesRaw = datesInput.value.trim();
        const guestsRaw = guestsInput.value.trim();

        // 1. Validate and Format Inputs
        const destination = this.getCityCode(destinationRaw);
        const parsedDates = this.parseDates(datesRaw);
        const guests = this.parseGuests(guestsRaw);

        if (!destination || !parsedDates || isNaN(guests) || guests <= 0) {
            this.displayMessage('<p style="color: red;">Please enter valid search criteria. Example: "Lisbon (LIS)", "16 Jul – 19 Jul", "2 travelers • 1 room"</p>');
            return;
        }

        // Show loading state
        this.displayMessage('<p>Searching for hotels...</p>', true);

        try {
            // 2. Make Fetch Request to Netlify Function
            const response = await fetch('/.netlify/functions/searchHotels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destination: destination,
                    checkIn: parsedDates.checkIn,
                    checkOut: parsedDates.checkOut,
                    guests: guests,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle errors from the Netlify Function
                console.error('Error from Netlify Function:', data.error, data.details);
                this.displayMessage(`<p style="color: red;">Error: ${data.error || 'Something went wrong on the server.'}</p>`);
                return;
            }

            // 3. Display Results
            this.renderHotels(data.hotels);

        } catch (error) {
            console.error('Network or parsing error:', error);
            this.displayMessage(`<p style="color: red;">An unexpected error occurred: ${error.message}</p>`);
        }
    }

    displayMessage(messageHtml, showContainer = false) {
        this.resultsContainer.innerHTML = messageHtml;
        if (showContainer) {
            this.resultsContainer.classList.remove('hidden');
        } else {
            // If just updating message, ensure visibility if it was hidden
            if (this.resultsContainer.classList.contains('hidden')) {
                this.resultsContainer.classList.remove('hidden');
            }
        }
    }

    renderHotels(hotels) {
        if (hotels && hotels.length > 0) {
            let hotelsHtml = '<h2>Available Hotels:</h2>';
            hotelsHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">';
            hotels.forEach(hotel => {
                hotelsHtml += `
                    <div style="border: 1px solid #ccc; padding: 15px; border-radius: 8px;">
                        <h3>${hotel.name}</h3>
                        <p><strong>Address:</strong> ${hotel.address}</p>
                        <p><strong>Price:</strong> ${hotel.price} ${hotel.currency}</p>
                        ${hotel.rating ? `<p><strong>Rating:</strong> ${hotel.rating} stars</p>` : ''}
                        </div>
                `;
            });
            hotelsHtml += '</div>';
            this.displayMessage(hotelsHtml, true); // Ensure container is visible
        } else {
            this.displayMessage('<p>No hotels found for your search criteria.</p>', true);
        }
    }
}

export default HotelSearchFormService;