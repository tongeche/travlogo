import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

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
  if (!res.ok) throw new Error(data.error_description || 'Token fetch failed');
  return data.access_token;
}

async function getFlightOffers(token) {
  const res = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=LIS&destinationLocationCode=BCN&departureDate=2025-08-03&adults=1`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
}

async function insertFlights(supabase, flights) {
  for (const offer of flights.data.slice(0, 10)) {
    const seg = offer.itineraries[0].segments[0];
    const dep = seg.departure.iataCode;
    const arr = seg.arrival.iataCode;
    const price = parseFloat(offer.price.total);
    const airline = seg.carrierCode;
    const flightCode = `${airline}${seg.number}`;
    const duration = offer.itineraries[0].duration;
    const date = seg.departure.at.split('T')[0];

    const { error } = await supabase.from('items').insert({
      external_id: `flight-${dep.toLowerCase()}-${arr.toLowerCase()}-${flightCode}`,
      service_type: 'flight',
      provider: 'Amadeus',
      name: `${dep} to ${arr} - ${airline}`,
      description: `Flight ${flightCode} (${duration}) departing on ${date}`,
      image_url: 'https://via.placeholder.com/600x400?text=Flight',
      affiliate_url: 'https://dummy.affiliate.link/flight', // replace with real if available
      price_min: price,
      currency: offer.price.currency,
      rating: 7.5, // static or estimated
      review_count: 50, // or random for demo
      location_id: 1 // or dynamically resolve later
    });

    if (error) {
      console.error(`❌ Failed to insert flight ${flightCode}`, error.message);
    } else {
      console.log(`✅ Inserted flight ${flightCode}`);
    }
  }
}

async function main() {
  const cfg = JSON.parse(await fs.readFile('../data/config.json', 'utf8'));
 
  // const cfg = JSON.parse(await fs.readFile('./data/config.json', 'utf8'));
  const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
  const token = await getAmadeusToken(cfg.AMADEUS_API_KEY, cfg.AMADEUS_API_SECRET);
  const flights = await getFlightOffers(token);
  await insertFlights(supabase, flights);
}

main().catch(console.error);
