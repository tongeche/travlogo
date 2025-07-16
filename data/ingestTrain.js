// ingestTrains.js
// This script allows for manual or sample data ingestion of train deals into Supabase.
// It includes logic to manage locations, similar to ingestHotels.js.

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import readline from 'readline';

// Create a readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Loads Supabase configuration from config.json.
 * @returns {Promise<Object>} The configuration object.
 */
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

/**
 * Prompts the user for a question and returns their answer.
 * @param {string} query - The question to ask.
 * @returns {Promise<string>} The user's input.
 */
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Ensures a location exists in the 'locations' table and returns its ID.
 * Creates the location if it doesn't exist.
 * Requires a unique constraint on (city, country) in the 'locations' table.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} city
 * @param {string} country
 * @returns {Promise<number|null>} The location ID or null if creation/finding failed due to missing data.
 */
async function findOrCreateLocation(supabaseClient, city, country) {
  if (!city || !country) {
    console.warn(`Attempted to find/create location with missing city (${city}) or country (${country}). Skipping location assignment.`);
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

/**
 * Upserts (inserts or updates) a train item into the Supabase 'items' table.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient - The Supabase client.
 * @param {Object} trainData - The data object for the train item.
 */
async function upsertTrainToSupabase(supabaseClient, trainData) {
  const { error } = await supabaseClient.from('items').upsert(trainData, {
    onConflict: 'external_id' // Assumes 'external_id' is unique for train deals
  });

  if (error) {
    console.error(`❌ Failed to upsert train ${trainData.name || trainData.external_id}:`, error.message);
  } else {
    console.log(`✅ Upserted train: ${trainData.name || trainData.external_id}`);
  }
}

/**
 * Handles the ingestion of a single train deal from user input.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 */
async function ingestSingleTrainDeal(supabaseClient) {
  console.log("\n--- Manual Train Deal Entry ---");
  const external_id = await askQuestion("Enter unique External ID (e.g., TRN-001): ");
  const name = await askQuestion("Enter Train Route Name (e.g., Paris to London): ");
  const description = await askQuestion("Enter Description: ");
  const imageUrl = await askQuestion("Enter Image URL (e.g., /public/images/trains/my-train.jpg): ");
  const affiliateUrl = await askQuestion("Enter Affiliate URL: ");
  const priceMin = parseFloat(await askQuestion("Enter Minimum Price (e.g., 59.99): "));
  const currency = await askQuestion("Enter Currency (e.g., EUR, USD): ");
  const provider = await askQuestion("Enter Provider (e.g., Eurostar, Amtrak): ");
  const city = await askQuestion("Enter City (e.g., Paris): ");
  const country = await askQuestion("Enter Country (e.g., France): ");

  let locationId = null;
  if (city && country) {
    try {
      locationId = await findOrCreateLocation(supabaseClient, city, country);
    } catch (error) {
      console.error(`Could not find or create location for ${city}, ${country}:`, error.message);
    }
  }

  const trainData = {
    external_id: external_id || `TRN-${Date.now()}`,
    service_type: 'train',
    provider: provider || 'Unknown Provider',
    name: name || 'Unnamed Train Deal',
    description: description || 'No description provided.',
    image_url: imageUrl ? [{ url: imageUrl, caption: name + ' image' }] : [],
    affiliate_url: affiliateUrl || '#',
    price_min: isNaN(priceMin) ? null : priceMin,
    currency: currency || null,
    location_id: locationId,
    meta: {}, // Additional metadata can be added here if needed
    updated_at: new Date().toISOString()
  };

  console.log("\n--- Prepared Train Data ---");
  console.log(JSON.stringify(trainData, null, 2));
  const confirm = await askQuestion("Confirm ingestion of this data? (yes/no): ");
  if (confirm.trim().toLowerCase() === 'yes') {
    await upsertTrainToSupabase(supabaseClient, trainData);
  } else {
    console.log("Ingestion cancelled.");
  }
}


/**
 * Handles the ingestion of pre-defined sample train data.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 */
async function ingestSampleTrainData(supabaseClient) {
  console.log("\n--- Ingesting Sample Train Data ---");

  // --- Hardcoded Sample Train Data ---
  // You can extend this array with more train deals.
  const sampleTrainDeals = [
    {
      external_id: 'TRN-PAR-LON-001',
      service_type: 'train',
      provider: 'Eurostar',
      name: 'Paris to London Express',
      description: 'High-speed train connecting the heart of Paris to London in just over 2 hours. Enjoy comfortable seating and stunning views.',
      image_url: [{ url: '/public/images/places/train-paris-london.jpg', caption: 'Eurostar train pulling into station' }],
      affiliate_url: 'https://www.exampletrainbooking.com/paris-london',
      price_min: 59.99,
      currency: 'EUR',
      // Placeholder: City/Country will be used to find/create location_id
      city: 'Paris',
      country: 'France',
      meta: {
        origin: 'Paris',
        destination: 'London',
        travel_time_hours: 2.5,
        class_options: ['Standard', 'Standard Premier', 'Business Premier']
      },
      updated_at: new Date().toISOString()
    },
    {
      external_id: 'TRN-LIS-POR-002',
      service_type: 'train',
      provider: 'CP - Comboios de Portugal',
      name: 'Lisbon to Porto Alfa Pendular',
      description: 'Experience Portugal\'s scenic routes on the modern Alfa Pendular train. Fast and comfortable journey between two major cities.',
      image_url: [{ url: '/public/images/places/train-lisbon-porto.jpg', caption: 'Alfa Pendular train' }],
      affiliate_url: 'https://www.exampletrainbooking.com/lisbon-porto',
      price_min: 25.00,
      currency: 'EUR',
      city: 'Lisbon',
      country: 'Portugal',
      meta: {
        origin: 'Lisbon',
        destination: 'Porto',
        travel_time_hours: 3,
        service_type: 'Alfa Pendular'
      },
      updated_at: new Date().toISOString()
    },
    {
      external_id: 'TRN-NY-CHI-003',
      service_type: 'train',
      provider: 'Amtrak',
      name: 'New York to Chicago - Lake Shore Limited',
      description: 'A classic overnight journey through the American landscape. Offers sleeper cars and dining options.',
      image_url: [{ url: '/public/images/places/train-ny-chicago.jpg', caption: 'Amtrak train passing through countryside' }],
      affiliate_url: 'https://www.exampletrainbooking.com/ny-chicago',
      price_min: 80.00,
      currency: 'USD',
      city: 'New York',
      country: 'United States',
      meta: {
        origin: 'New York',
        destination: 'Chicago',
        travel_time_hours: 19,
        overnight_service: true
      },
      updated_at: new Date().toISOString()
    }
  ];

  for (const trainData of sampleTrainDeals) {
    try {
      console.log(`\n--- Processing Sample Train Deal: ${trainData.name} ---`);
      // Find or Create Location ID before upserting the train
      let locationId = null;
      if (trainData.city && trainData.country) {
        locationId = await findOrCreateLocation(supabaseClient, trainData.city, trainData.country);
      } else {
        console.warn(`Skipping location lookup for train ${trainData.name} due to missing city or country data in sample.`);
      }

      // Prepare data for Supabase, ensuring location_id is set
      const trainDataForSupabase = {
        ...trainData, // Spread existing data
        location_id: locationId, // Assign the found/created location ID
        // Remove city/country directly from the main object if they were only for location lookup
        city: undefined, // Explicitly remove
        country: undefined // Explicitly remove
      };

      console.log("Data Prepared for Supabase:", JSON.stringify(trainDataForSupabase, null, 2));
      await upsertTrainToSupabase(supabaseClient, trainDataForSupabase);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between ingests
    } catch (error) {
      console.error(`Fatal error during ingestion for train deal ${trainData.name}:`, error);
    }
  }
  console.log("\n--- Sample Train Data Ingestion Complete ---");
}

/**
 * Main function to run the ingestion script with user choices.
 */
async function main() {
  const appConfig = await loadConfig();
  const supabase = createClient(appConfig.SUPABASE_URL, appConfig.SUPABASE_KEY);

  console.log("\n--- Travlog Mundo Train Data Management Script ---");
  console.log("What would you like to do?");
  console.log("1. Ingest a single train deal (manual input)");
  console.log("2. Ingest sample train data (pre-defined)");
  console.log("3. Exit");

  const choice = await askQuestion("Enter your choice (1, 2, or 3): ");

  switch (choice.trim()) {
    case '1':
      await ingestSingleTrainDeal(supabase);
      break;
    case '2':
      await ingestSampleTrainData(supabase);
      break;
    case '3':
      console.log("Exiting script. Goodbye!");
      break;
    default:
      console.log("Invalid choice. Please run the script again and enter 1, 2, or 3.");
  }

  rl.close(); // Close the readline interface when done
}

main().catch(console.error);