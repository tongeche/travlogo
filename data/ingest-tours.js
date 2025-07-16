// ingest-tours.js (Amadeus Integration)
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Required for Node.js environments

// --- Amadeus API Functions ---

/**
 * Fetches an Amadeus OAuth2 token.
 * @param {string} apiKey - Amadeus API Key.
 * @param {string} apiSecret - Amadeus API Secret.
 * @returns {Promise<string>} The access token.
 */
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
 * Fetches popular tours and activities for a given point of interest (city).
 * This uses the "Travel Recommendations" endpoint which often includes experiences.
 * For dedicated Tours & Activities, you might use 'v1/shopping/activities' or 'v1/shopping/activities/by-square'
 * but these might require specific commercial agreements. This one is generally more accessible for demo.
 *
 * NOTE: The 'v1/reference-data/locations/pois/{id}/activities' is the most direct for POI activities,
 * but requires a POI ID first. For general city activities, 'v1/shopping/activities' is better.
 *
 * Let's use `v1/shopping/activities/by-square` or `v1/shopping/activities` if `v1/travel/analytics/air-traffic/traveled` doesn't yield relevant 'tours'.
 *
 * For now, we'll use `v1/shopping/activities` which is commonly used for this purpose in self-service.
 * You would need to get the `geoCode` (latitude, longitude) for each city.
 *
 * Let's assume we'll use hardcoded coordinates for simplicity, or look up from a location service if available.
 *
 * @param {string} token - Amadeus access token.
 * @param {Object} location - Object with city name, latitude, and longitude.
 * @returns {Promise<Object>} API response containing activity offers.
 */
async function getToursForCity(token, location) {
  // Amadeus offers /v1/shopping/activities/by-square for an area, or /v1/shopping/activities for a specific geoCode
  // Let's use /v1/shopping/activities/by-square for a broader search around the city center.
  // The square needs two geoCodes: northWest and southEast corners.
  // For simplicity for a city, we'll approximate a small square around the given lat/lon.
  // A 0.1 degree latitude/longitude change is roughly 11km.
  const latOffset = 0.05; // ~5.5 km
  const lonOffset = 0.05; // ~5.5 km

  const north = location.latitude + latOffset;
  const west = location.longitude - lonOffset;
  const south = location.latitude - latOffset;
  const east = location.longitude + lonOffset;

  const url = `https://test.api.amadeus.com/v1/shopping/activities?latitude=${location.latitude}&longitude=${location.longitude}&radius=5`; // Radius in km

  console.log(`Fetching tours for ${location.city} (${location.latitude},${location.longitude})...`);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  if (!res.ok) {
    console.error(`Amadeus Tours Error for ${location.city}:`, data.errors || data);
    throw new Error(data.errors?.[0]?.detail || `Failed to fetch tours for ${location.city}`);
  }
  return data;
}

// --- Supabase Insertion Functions ---

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
    return null;
  }

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


/**
 * Inserts or updates tour data into the Supabase 'items' table.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - The Supabase client.
 * @param {Object} tourData - The tour data object from Amadeus.
 * @param {Object} cityInfo - Object containing city, country, and location_id.
 */
async function insertTour(supabase, tourData, cityInfo) {
  // Amadeus Activity data can be quite varied. We'll pick key fields.
  // The 'rating' and 'review_count' are often not directly available in this API.
  // `t.pictures` is an array of picture objects.
  // `t.price` contains total, amount, and currencyCode.

  const externalId = `tour-${tourData.id}`;
  const name = tourData.name || `Tour ID: ${tourData.id}`;
  const description = tourData.description || 'No description available.';
  const imageUrls = tourData.pictures?.map(p => ({ url: p.url, caption: p.caption || '' })) || [];
  const priceMin = tourData.price?.amount ? parseFloat(tourData.price.amount) : null;
  const currency = tourData.price?.currencyCode || null;
  const affiliateUrl = tourData.bookingLink || `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + cityInfo.city + ' tour')}`; // Fallback to Google search

  // Determine tags based on some keywords or a default. You'll need more sophisticated logic here.
  // For demo, let's assign a few generic tags, or you can check tourData.categories.
  let tags = ['things_to_do']; // Default tag
  if (name.toLowerCase().includes('unique') || description.toLowerCase().includes('unique')) {
    tags.push('unique_stays');
  }
  if (name.toLowerCase().includes('night') || description.toLowerCase().includes('night')) {
    tags.push('nightlife');
  }
  if (name.toLowerCase().includes('boat') || name.toLowerCase().includes('cruise')) {
    tags.push('boat_cruz');
  }
  tags = [...new Set(tags)]; // Remove duplicates


  const itemToInsert = {
    external_id: externalId,
    service_type: 'tour',
    provider: 'Amadeus', // Or the actual provider if Amadeus returns it
    name: name,
    description: description,
    image_url: imageUrls,
    affiliate_url: affiliateUrl,
    price_min: priceMin,
    currency: currency,
    rating: null, // Amadeus Activities API might not directly provide a simple rating score here
    review_count: null, // Same as above
    location_id: cityInfo.location_id,
    meta: {
      amadeus_id: tourData.id,
      categories: tourData.categories, // Keep original categories from Amadeus
      duration: tourData.duration, // if available
      tags: tags // Our determined tags for frontend filtering
    },
    latitude: tourData.geoCode?.latitude || null,
    longitude: tourData.geoCode?.longitude || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('items').upsert(itemToInsert, {
    onConflict: 'external_id'
  });

  if (error) {
    console.error(`❌ Failed to upsert tour "${name}" (${externalId}):`, error.message);
  } else {
    console.log(`✅ Upserted tour: "${name}" (${externalId})`);
  }
}

// --- Main Ingestion Logic ---

async function main() {
  const cfg = JSON.parse(await fs.readFile('./config.json', 'utf8')); // Assuming config.json is in the same directory

  const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
  const token = await getAmadeusToken(cfg.AMADEUS_API_KEY, cfg.AMADEUS_API_SECRET);

  const citiesToQuery = [
    { city: 'Lisbon', country: 'Portugal', latitude: 38.7223, longitude: -9.1393 },
    { city: 'Porto', country: 'Portugal', latitude: 41.1579, longitude: -8.6291 },
    { city: 'Rome', country: 'Italy', latitude: 41.9028, longitude: 12.4964 }
  ];

  for (const cityInfo of citiesToQuery) {
    console.log(`\n--- Processing tours for ${cityInfo.city} ---`);
    let locationId = null;
    try {
      locationId = await findOrCreateLocation(supabase, cityInfo.city, cityInfo.country);
      cityInfo.location_id = locationId; // Attach resolved ID to cityInfo
    } catch (error) {
      console.error(`Failed to get location_id for ${cityInfo.city}. Skipping tours for this city.`, error);
      continue;
    }

    try {
      const tourOffers = await getToursForCity(token, cityInfo);
      if (tourOffers.data && tourOffers.data.length > 0) {
        console.log(`Found ${tourOffers.data.length} tours for ${cityInfo.city}. Inserting up to 10...`);
        for (const tour of tourOffers.data.slice(0, 10)) { // Limit to 10 tours per city for demo
          await insertTour(supabase, tour, cityInfo);
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between inserts
        }
      } else {
        console.log(`No tour data found for ${cityInfo.city}.`);
      }
    } catch (error) {
      console.error(`Error fetching or inserting tours for ${cityInfo.city}:`, error.message);
    }
  }

  console.log("\n--- Amadeus Tours Ingestion Complete ---");
}

main().catch(console.error);