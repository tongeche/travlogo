// ingest-cars.js (Amadeus Integration)
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function loadConfig() {
  try {
    const configPath = './config.json';
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    if (!config.AMADEUS_API_KEY || !config.AMADEUS_API_SECRET) {
      throw new Error("AMADEUS_API_KEY or AMADEUS_API_SECRET missing in config.json.");
    }
    return config;
  } catch (error) {
    console.error('Error loading config.json:', error);
    process.exit(1);
  }
}

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Reuse findOrCreateLocation as it's generic
async function findOrCreateLocation(supabaseClient, city, country) {
  if (!city || !country) {
    console.warn(`Attempted to find/create location with missing city (${city}) or country (${country}). Skipping location assignment.`);
    return null;
  }

  const { data: existingLocation, error: findError } = await supabaseClient
    .from('locations')
    .select('id')
    .eq('city', city)
    .eq('country', country)
    .single();

  if (findError && findError.code !== 'PGRST116') {
    console.error(`Error finding location (${city}, ${country}):`, findError.message);
    throw findError;
  }

  if (existingLocation) {
    console.log(`Found existing location for ${city}, ${country}. ID: ${existingLocation.id}`);
    return existingLocation.id;
  }

  console.log(`Creating new location for ${city}, ${country}...`);
  const { data: newLocation, error: insertError } = await supabaseClient
    .from('locations')
    .insert([{ city, country }])
    .select('id')
    .single();

  if (insertError) {
    console.error(`Error inserting new location (${city}, ${country}):`, insertError.message);
    throw insertError;
  }

  console.log(`Created new location for ${city}, ${country}. ID: ${newLocation.id}`);
  return newLocation.id;
}


// --- Amadeus API Functions ---

// Reuse getAmadeusToken from other Amadeus ingest scripts
async function getAmadeusToken(apiKey, apiSecret) {
  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret
    })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Amadeus Token Error:', data.error_description || data);
    throw new Error(data.error_description || 'Token fetch failed');
  }
  return data.access_token;
}

/**
 * Fetches car rental offers from Amadeus Transfer Search API.
 * This API is typically used for transfers (point-to-point) but can include car rentals.
 * It often requires specific location IDs (Amadeus IATA/city codes).
 *
 * NOTE: For broader car rental search, Amadeus might have a dedicated "Cars" API.
 * Check Amadeus documentation for "v1/shopping/cars" or similar.
 * For now, we'll try to use a common location search to get car transfer options.
 *
 * @param {string} token - Amadeus access token.
 * @param {Object} location - Object with city name, IATA code, latitude, longitude.
 * @returns {Promise<Object>} API response containing car rental/transfer offers.
 */
async function getAmadeusCarRentals(token, location) {
  // Amadeus Transfer Search requires origin/destination type and ID.
  // For a city-wide car rental search, we'd typically look for "city" transfers.
  // We need an IATA code for originLocationCode.
  if (!location.iataCode) {
      console.warn(`Skipping Amadeus car rental search for ${location.city}: Missing IATA code.`);
      return { data: [] };
  }

  const travelDate = new Date();
  travelDate.setDate(travelDate.getDate() + 7); // 7 days from now
  const formattedDate = travelDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const formattedTime = '10:00:00'; // Example time

  // This endpoint searches for transfers from an origin to a destination.
  // For car rentals within a city, you might simulate a short transfer or check for
  // specific car rental type options if the API allows.
  // The endpoint might be: `v1/shopping/transfers/search`
  // Parameters might include: `originId`, `originType`, `destinationId`, `destinationType`,
  // `date`, `time`, `vehicleType` (e.g., CAR_RENTAL).
  //
  // WARNING: Amadeus Self-Service Transfer Search (v1/shopping/transfer-offers)
  // is more focused on fixed transfers, not open-ended car rentals from a hub.
  // A dedicated "Cars" API would be ideal.
  // As per image_6f9b1f.png "Transfer Search" is available.
  // Let's assume you'd search for transfers from a main airport within the city.
  // This might not return traditional car rental listings but transfer services.
  // You might need to look for a different Amadeus API or adjust expectations.
  // For now, let's use a placeholder `v1/shopping/cars` which is a common endpoint for car search,
  // even if it's not explicitly in the "self-service" section for your plan.
  // If `v1/shopping/cars` doesn't work, then you'd need to fall back to `v1/shopping/transfer-offers`
  // and manage the data differently.

  const url = `https://test.api.amadeus.com/v1/shopping/cars?pickUpLocation=${location.iataCode}&pickUpDateTime=${formattedDate}T${formattedTime}&dropOffLocation=${location.iataCode}&dropOffDateTime=${formattedDate}T${formattedTime}`;
  // NOTE: 'v1/shopping/cars' endpoint may not be available on all Amadeus self-service tiers.
  // If it fails, check Amadeus docs for `v1/shopping/transfer-offers` and its parameters.

  console.log(`Fetching car rentals for ${location.city} (${location.iataCode})...`);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  if (!res.ok) {
    console.error(`Amadeus Car Rentals Error for ${location.city}:`, data.errors || data);
    throw new Error(data.errors?.[0]?.detail || `Failed to fetch car rentals for ${location.city}`);
  }
  return data;
}

// --- Supabase Insertion & Update Functions ---

async function upsertCarRentalToSupabase(supabaseClient, carData, locationInfo) {
  // Amadeus car data structure will differ from Booking.com.
  // Inspect `carData` from Amadeus response and adjust paths.
  // Assuming `carData` is an individual car offer object.

  const externalId = `amadeus-car-${carData.id || Math.random().toString(36).substring(2, 15)}`;
  const name = carData.model || carData.makeAndModel || 'Generic Car';
  const description = carData.description || `Car from ${carData.provider?.name || 'Amadeus'}`;
  const imageUrls = carData.pictures?.map(p => ({ url: p.url, caption: p.type || '' })) || [
    { url: '/public/images/places/default_car.jpg', caption: 'Default Car Image' }
  ]; // Fallback image. Amadeus often has a 'pictures' array.

  const affiliateUrl = `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + locationInfo.city + ' car rental')}`;
  const priceMin = carData.price?.amount ? parseFloat(carData.price.amount) : null;
  const currency = carData.price?.currency || null;
  const provider = carData.provider?.name || 'Amadeus Cars';

  const itemToInsert = {
    external_id: externalId,
    service_type: 'car_rental',
    provider: provider,
    name: name,
    description: description,
    image_url: imageUrls.length > 0 ? imageUrls : [{ url: '/public/images/places/default_car.jpg', caption: 'Default Car Image' }],
    affiliate_url: affiliateUrl,
    price_min: priceMin,
    currency: currency,
    rating: null, // Amadeus car data might not have simple rating
    review_count: null, // Amadeus car data might not have simple review count
    location_id: locationInfo.location_id,
    latitude: carData.pickUpLocation?.geoCode?.latitude || null, // If geo available
    longitude: carData.pickUpLocation?.geoCode?.longitude || null, // If geo available
    meta: {
      amadeus_car_id: carData.id,
      category: carData.category,
      type: carData.type, // e.g., ECONOMY, LUXURY
      // Add other relevant Amadeus car metadata
    },
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseClient.from('items').upsert(itemToInsert, {
    onConflict: 'external_id'
  });

  if (error) {
    console.error(`❌ Failed to upsert car rental "${name}" (${externalId}):`, error.message);
  } else {
    console.log(`✅ Upserted car rental: "${name}" (${externalId})`);
  }
}

// --- Main Script Execution ---

async function main() {
  const appConfig = await loadConfig();
  const supabase = createClient(appConfig.SUPABASE_URL, appConfig.SUPABASE_KEY);
  const token = await getAmadeusToken(appConfig.AMADEUS_API_KEY, appConfig.AMADEUS_API_SECRET);

  console.log("\n--- Travlog Mundo Car Rental Data Ingestion Script (Amadeus) ---");

  const citiesToQuery = [
    { city: 'Lisbon', country: 'Portugal', iataCode: 'LIS', latitude: 38.7223, longitude: -9.1393 },
    { city: 'Porto', country: 'Portugal', iataCode: 'OPO', latitude: 41.1579, longitude: -8.6291 },
    { city: 'Madrid', country: 'Spain', iataCode: 'MAD', latitude: 40.4168, longitude: -3.7038 },
    { city: 'Barcelona', country: 'Spain', iataCode: 'BCN', latitude: 41.3851, longitude: 2.1734 }
  ];

  const maxCarsPerCity = 8;

  for (const cityInfo of citiesToQuery) {
    console.log(`\n--- Processing car rentals for ${cityInfo.city}, ${cityInfo.country} ---`);
    let locationId = null;
    try {
      locationId = await findOrCreateLocation(supabase, cityInfo.city, cityInfo.country);
      cityInfo.location_id = locationId;
    } catch (error) {
      console.error(`Failed to get location_id for ${cityInfo.city}. Skipping car rentals for this city.`, error);
      continue;
    }

    try {
      const carOffersResponse = await getAmadeusCarRentals(token, cityInfo);
      if (carOffersResponse.data && carOffersResponse.data.length > 0) {
        console.log(`Found ${carOffersResponse.data.length} car rentals for ${cityInfo.city}. Inserting up to ${maxCarsPerCity}...`);
        for (const car of carOffersResponse.data.slice(0, maxCarsPerCity)) {
          await upsertCarRentalToSupabase(supabase, car, cityInfo);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        console.log(`No car rental data found for ${cityInfo.city}.`);
      }
    } catch (error) {
      console.error(`Error fetching or inserting car rentals for ${cityInfo.city}:`, error.message);
    }
  }

  console.log("\n--- Amadeus Car Rental Ingestion Process Complete ---");
  rl.close();
}

main().catch(console.error);