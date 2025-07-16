// netlify/functions/get-items.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

exports.handler = async function (event) {
  const service = event.queryStringParameters?.service;

  // 1) Fetch the items (just leave in location_id)
  let itemsQ = supabase
    .from('items')
    .select(`
      id,
      name,
      description,
      image_url,
      affiliate_url,
      price_min,
      currency,
      rating,
      review_count,
      tags,
      meta,
      location_id,
      service_type
    `);

  if (service) itemsQ = itemsQ.eq('service_type', service);
  const { data: items, error: itemsErr } = await itemsQ;
  if (itemsErr) {
    return { statusCode: 500, body: JSON.stringify({ error: itemsErr.message }) };
  }

  // 2) Collect all unique location_ids
  const locationIds = [...new Set(items.map(i => i.location_id).filter(Boolean))];

  // 3) Fetch those locations
  const { data: locs, error: locErr } = await supabase
    .from('locations')
    .select('id, city, region, country')
    .in('id', locationIds);
  if (locErr) {
    return { statusCode: 500, body: JSON.stringify({ error: locErr.message }) };
  }
  // Build a lookup map
  const locMap = Object.fromEntries(locs.map(l => [l.id, l]));

  // 4) Merge location info back into each item
  const result = items.map(i => {
    const loc = locMap[i.location_id];
    return {
      ...i,
      location: loc ? `${loc.city}, ${loc.country}` : ''
    };
  });

  return { statusCode: 200, body: JSON.stringify(result) };
};
