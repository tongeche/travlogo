// netlify/functions/searchHotels.js

const Amadeus = require('amadeus'); // Import the Amadeus Node.js SDK

// Initialize Amadeus client using environment variables
const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET
});

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Parse the request body coming from your frontend form
        // Ensure these match the names you'll send from your frontend
        const { destination, checkIn, checkOut, guests } = JSON.parse(event.body);

        console.log('Received hotel search parameters for Amadeus:', { destination, checkIn, checkOut, guests });

        // --- Perform the Amadeus Hotel Search API call ---
        const amadeusResponse = await amadeus.shopping.hotelOffers.get({
            cityCode: destination, // e.g., "LIS"
            checkInDate: checkIn, // e.g., "2025-07-20"
            checkOutDate: checkOut, // e.g., "2025-07-25"
            adults: guests,     // e.g., 2
            // Add any other specific parameters as needed based on your testing/requirements
            // For a good overview of offers, you might want:
            // view: 'FULL_ALL',
            // For a specific currency (optional, defaults to EUR often):
            // currency: 'EUR'
        });

        // --- Process Amadeus response ---
        // Amadeus responses can be complex. We'll extract relevant info.
        // Check Amadeus docs for the exact structure of `amadeusResponse.data`
        // It will likely contain an array of hotel offers.
        const hotelsData = amadeusResponse.data.map(offer => ({
            id: offer.hotel.hotelId,
            name: offer.hotel.name,
            chainCode: offer.hotel.chainCode,
            address: offer.hotel.address ? `${offer.hotel.address.cityName}, ${offer.hotel.address.countryCode}` : 'N/A', // Basic address
            price: offer.offers[0]?.price?.total || 'Price Unavailable', // Get total price from the first offer
            currency: offer.offers[0]?.price?.currency || 'N/A',
            // You can add more fields here like rating, photos, amenities if available in the response
            // e.g., rating: offer.hotel.rating,
            // photos: offer.hotel.media ? offer.hotel.media.filter(m => m.mediaType === 'PICTURE').map(m => m.uri) : [],
        }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hotels: hotelsData }),
        };

    } catch (error) {
        console.error('Error in searchHotels function:', error);
        // Log specific Amadeus error if available
        if (error.response && error.response.result) {
            console.error('Amadeus API Error:', error.response.result);
            return {
                statusCode: error.response.statusCode || 500, // Use Amadeus status code if available
                body: JSON.stringify({
                    error: 'Amadeus API Error: ' + (error.response.result.errors ? error.response.result.errors[0].detail : 'Unknown Amadeus Error'),
                    // You can also include more details for debugging:
                    // amadeusErrors: error.response.result.errors
                }),
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to fetch hotel data',
                details: error.message,
                stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
            }),
        };
    }
};