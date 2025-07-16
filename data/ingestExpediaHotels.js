// ingestHotels.js (Interactive with User Input)
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import readline from 'readline'; // Import readline for user input

// Create a readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function loadConfig() {
  try {
    const configPath = './config.json';
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading config.json:', error);
    process.exit(1); // Exit if config cannot be loaded
  }
}

// --- NEW FUNCTION: Find or Create Location ---
/**
 * Ensures a location exists in the 'locations' table and returns its ID.
 * Creates the location if it doesn't exist.
 * Requires a unique constraint on (city, country) in the 'locations' table.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} city
 * @param {string} country
 * @returns {Promise<number>} The location ID.
 */
async function findOrCreateLocation(supabaseClient, city, country) {
  if (!city || !country) {
    console.warn(`Attempted to find/create location with missing city (${city}) or country (${country}).`);
    return null; // Return null if location data is incomplete
  }

  // Try to find the location first
  const { data: existingLocation, error: findError } = await supabaseClient
    .from('locations')
    .select('id')
    .eq('city', city)
    .eq('country', country)
    .single();

  if (findError && findError.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error(`Error finding location (${city}, ${country}):`, findError.message);
    throw findError;
  }

  if (existingLocation) {
    console.log(`Found existing location for ${city}, ${country}. ID: ${existingLocation.id}`);
    return existingLocation.id; // Location already exists, return its ID
  }

  // If not found, insert the new location
  console.log(`Creating new location for ${city}, ${country}...`);
  const { data: newLocation, error: insertError } = await supabaseClient
    .from('locations')
    .insert([{ city, country }])
    .select('id') // Request the ID of the newly inserted row
    .single();

  if (insertError) {
    console.error(`Error inserting new location (${city}, ${country}):`, insertError.message);
    throw insertError; // Re-throw to handle upstream
  }

  console.log(`Created new location for ${city}, ${country}. ID: ${newLocation.id}`);
  return newLocation.id; // Return the ID of the newly created location
}


// --- Booking COM API Functions (Unchanged) ---

async function getBookingComHotelDetails(hotelId, config) {
  const url = `https://${config.BOOKING_COM_RAPID_API_HOST}/api/v1/hotels/getDescriptionAndInfo`;
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': config.BOOKING_COM_RAPID_API_KEY,
      'X-RapidAPI-Host': config.BOOKING_COM_RAPID_API_HOST
    }
  };

  try {
    const queryParams = new URLSearchParams({
      hotel_id: hotelId,
      languagecode: 'en-us'
    }).toString();
    const fullUrl = `${url}?${queryParams}`;

    console.log(`Calling Booking.com API for details: ${fullUrl}`);
    const res = await fetch(fullUrl, options);
    const data = await res.json();

    if (!res.ok) {
      console.error(`Booking.com API Error for hotel ${hotelId} (details):`, data);
      throw new Error(data.message || `Failed to fetch Booking.com hotel details: HTTP Status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`Network or Parsing Error fetching details for hotel ${hotelId}:`, error);
    throw error;
  }
}

async function getBookingComHotelPhotos(hotelId, config) {
  const url = `https://${config.BOOKING_COM_RAPID_API_HOST}/api/v1/hotels/getHotelPhotos`;
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': config.BOOKING_COM_RAPID_API_KEY,
      'X-RapidAPI-Host': config.BOOKING_COM_RAPID_API_HOST
    }
  };

  try {
    const queryParams = new URLSearchParams({
      hotel_id: hotelId
    }).toString();
    const fullUrl = `${url}?${queryParams}`;

    console.log(`Calling Booking.com API for photos: ${fullUrl}`);
    const res = await fetch(fullUrl, options);
    const data = await res.json();

    if (!res.ok) {
      console.error(`Booking.com API Error for hotel ${hotelId} (photos):`, data);
      throw new Error(data.message || `Failed to fetch Booking.com hotel photos: HTTP Status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`Network or Parsing Error fetching photos for hotel ${hotelId}:`, error);
    throw error;
  }
}

async function getBookingComHotelReviews(hotelId, config) {
  const url = `https://${config.BOOKING_COM_RAPID_API_HOST}/api/v1/hotels/getHotelReviewScores`;
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': config.BOOKING_COM_RAPID_API_KEY,
      'X-RapidAPI-Host': config.BOOKING_COM_RAPID_API_HOST
    }
  };

  try {
    const queryParams = new URLSearchParams({
      hotel_id: hotelId,
      languagecode: 'en-us'
    }).toString();
    const fullUrl = `${url}?${queryParams}`;

    console.log(`Calling Booking.com API for reviews: ${fullUrl}`);
    const res = await fetch(fullUrl, options);
    const data = await res.json();

    if (!res.ok) {
      console.error(`Booking.com API Error for hotel ${hotelId} (reviews):`, data);
      throw new Error(data.message || `Failed to fetch Booking.com hotel reviews: HTTP Status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`Network or Parsing Error fetching reviews for hotel ${hotelId}:`, error);
    throw error;
  }
}

// --- Supabase Insertion & Update Functions (Unchanged except for adding to main) ---

async function upsertHotelToSupabase(supabaseClient, hotelData) {
  const { error } = await supabaseClient.from('items').upsert(hotelData, {
    onConflict: 'external_id'
  });

  if (error) {
    console.error(`❌ Failed to upsert hotel ${hotelData.name || hotelData.external_id}:`, error.message);
  } else {
    console.log(`✅ Upserted hotel: ${hotelData.name || hotelData.external_id}`);
  }
}

async function updateHotelName(supabaseClient, externalId, newName) {
  console.log(`Attempting to update hotel ID ${externalId} to new name: "${newName}"`);
  const { data, error } = await supabaseClient
    .from('items')
    .update({ name: newName })
    .eq('external_id', externalId);

  if (error) {
    console.error(`❌ Failed to update name for hotel ID ${externalId}:`, error.message);
  } else {
    console.log(`✅ Successfully updated name for hotel ID ${externalId} to "${newName}".`);
  }
}

// --- Helper for getting user input ---
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// --- Main Ingestion Logic ---

async function main() {
  const appConfig = await loadConfig();
  const supabase = createClient(appConfig.SUPABASE_URL, appConfig.SUPABASE_KEY);

  console.log("\n--- Travlog Mundo Hotel Management Script ---");
  console.log("What would you like to do?");
  console.log("1. Ingest/Refresh Hotel Data (Fetch from Booking.com API)");
  console.log("2. Update Hotel Name (Manual Renaming)");
  console.log("3. Exit");

  const choice = await askQuestion("Enter your choice (1, 2, or 3): ");

  switch (choice.trim()) {
    case '1':
      await handleIngestData(supabase, appConfig);
      break;
    case '2':
      await handleUpdateNames(supabase);
      break;
    case '3':
      console.log("Exiting script. Goodbye!");
      break;
    default:
      console.log("Invalid choice. Please run the script again and enter 1, 2, or 3.");
  }

  rl.close(); // Close the readline interface when done
}

async function handleIngestData(supabase, appConfig) {
  console.log("\n--- Ingesting/Refreshing Hotel Data ---");
  const inputIds = await askQuestion("Enter hotel IDs to ingest/refresh (comma-separated, e.g., 5955189,12345): ");
  const bookingComHotelIds = inputIds.split(',').map(id => id.trim()).filter(id => id); // Split, trim, filter empty

  if (bookingComHotelIds.length === 0) {
    console.log("No hotel IDs provided for ingestion. Skipping.");
    return;
  }

  for (const hotelId of bookingComHotelIds) {
    try {
      console.log(`\n--- Processing Hotel ID: ${hotelId} (Ingestion/Refresh) ---`);

      const [detailsResponse, photosResponse, reviewsResponse] = await Promise.all([
        getBookingComHotelDetails(hotelId, appConfig),
        getBookingComHotelPhotos(hotelId, appConfig),
        getBookingComHotelReviews(hotelId, appConfig)
      ]);

      const propertyDetailsArray = detailsResponse.data;
      const mainPropertyInfo = propertyDetailsArray ? propertyDetailsArray[0] : null;

      const fullDescription = propertyDetailsArray
        ? propertyDetailsArray.map(item => item.description).join('\n\n')
        : null;

      const photosData = photosResponse.data || [];
      const images = photosData.map(img => ({
        url: img.url_max || img.url || '',
        caption: img.description || img.caption || ''
      }));

      const reviewsData = reviewsResponse.data || reviewsResponse;
      const guestRating = reviewsData.overall_score || reviewsData.score || null;
      const reviewCount = reviewsData.number_of_reviews || reviewsData.count || null;

      // --- CRUCIAL: Extract City and Country from API response ---
      // Booking.com API often provides address details.
      // You'll need to inspect `mainPropertyInfo` or `detailsResponse` to find where city/country are located.
      // Common paths might be: `mainPropertyInfo.city`, `mainPropertyInfo.address.city`, `mainPropertyInfo.location.city` etc.
      // Based on typical Booking.com responses, let's assume `mainPropertyInfo.city` and `mainPropertyInfo.country_trans`
      // You might need to adjust these paths based on the actual structure of `detailsResponse.data[0]`
      const hotelCity = mainPropertyInfo.city || null; // Example path
      const hotelCountry = mainPropertyInfo.country_trans || null; // Example path for translated country name

      console.log("Full Raw Details Response (for debugging location extraction):", JSON.stringify(detailsResponse, null, 2));


      if (!mainPropertyInfo) {
        console.warn(`No main property data found for ID ${hotelId} from Booking.com details response. Skipping.`);
        continue;
      }

      // --- STEP 1: Find or Create Location ID ---
      let locationId = null;
      if (hotelCity && hotelCountry) {
        locationId = await findOrCreateLocation(supabase, hotelCity, hotelCountry);
      } else {
        console.warn(`Skipping location lookup for hotel ${hotelId} due to missing city or country data.`);
      }

      const hotelDataForSupabase = {
        external_id: mainPropertyInfo.hotel_id,
        service_type: 'hotel',
        provider: 'Booking.com',
        name: mainPropertyInfo.hotel_name || `Hotel ${mainPropertyInfo.hotel_id}`,
        description: fullDescription,
        image_url: images,
        affiliate_url: `${appConfig.YOUR_AFFILIATE_BASE_URL}hotel/${mainPropertyInfo.hotel_id}.html`,
        price_min: mainPropertyInfo.min_price || null,
        currency: mainPropertyInfo.currency || null,
        rating: guestRating,
        review_count: reviewCount,
        location_id: locationId, // <-- NOW DYNAMICALLY ASSIGNED
        meta: mainPropertyInfo.meta_data || {},
        latitude: mainPropertyInfo.latitude || null,
        longitude: mainPropertyInfo.longitude || null,
        updated_at: new Date().toISOString()
      };

      console.log("Data Prepared for Supabase:", JSON.stringify(hotelDataForSupabase, null, 2));

      await upsertHotelToSupabase(supabase, hotelDataForSupabase);

      await new Promise(resolve => setTimeout(resolve, 5000)); // Delay between hotel ingestions

    } catch (error) {
      console.error(`Fatal error during ingestion/refresh for hotel ID ${hotelId}:`, error);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Delay even on error
    }
  }
  console.log("\n--- Hotel Ingestion/Refresh Process Complete ---");
}

async function handleUpdateNames(supabase) {
  console.log("\n--- Starting Hotel Name Updates ---");

  let continueUpdating = true;
  while (continueUpdating) {
    const externalId = await askQuestion("Enter the external_id of the hotel to update (or type 'done' to finish): ");
    if (externalId.toLowerCase() === 'done') {
      continueUpdating = false;
      break;
    }
    if (!externalId) {
      console.log("No ID entered. Please enter a valid ID or 'done'.");
      continue;
    }

    const newName = await askQuestion(`Enter the new name for hotel ID ${externalId}: `);
    if (!newName) {
      console.log("No new name entered. Skipping this update.");
      continue;
    }

    await updateHotelName(supabase, externalId, newName);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between individual updates
  }

  console.log("--- Hotel Name Updates Complete ---");
}

main().catch(console.error);