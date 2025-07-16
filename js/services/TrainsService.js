// js/services/TrainsService.js

/**
 * Service to fetch and render train deals from Supabase.
 */
export default class TrainsService {
    /**
     * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient - The Supabase client instance.
     * @param {Object} selectors - DOM selectors for rendering.
     * @param {string} selectors.outputSel - Selector for the "no data / error" output container.
     * @param {string} selectors.gridSel   - Selector for the grid where train cards get injected.
     */
    constructor(supabaseClient, { outputSel, gridSel }) {
      this.client = supabaseClient;
      this.output = document.querySelector(outputSel);
      this.grid = document.querySelector(gridSel);
    }
  
    /**
     * Fetches train items from Supabase and renders them into the grid.
     * @async
     */
    async load() {
      try {
        // Select relevant fields for train deals, filtering by 'service_type' = 'train'
        const { data, error } = await this.client
          .from('items') // Assuming 'items' is the unified table for all services
          .select(`
              id, name, description, image_url, affiliate_url,
              price_min, currency, provider, meta,
              locations:location_id ( city, country )
            `)
          .eq('service_type', 'train') // Filter specifically for trains
          .limit(6); // Limit the number of train deals displayed, adjust as needed
  
        if (error) throw error;
  
        if (!data.length) {
          this.output.textContent = 'No train deals found at the moment.';
          return;
        }
  
        // Clear existing content and inject new train cards
        this.grid.innerHTML = data.map(train => this._card(train)).join('');
        this.output.textContent = ''; // Clear any previous error/no data messages
      } catch (err) {
        console.error('TrainsService.load error:', err);
        this.output.textContent = `Error loading train deals: ${err.message}`;
      }
    }
  
    /**
     * Generates the HTML for a single train deal card.
     * This is a simplified version compared to hotels, as trains may not have ratings/reviews.
     * @param {Object} t - The train item data.
     * @returns {string} HTML string for one train card.
     */
    _card(t) {
      // Determine image URL: check if it's an array with url property, otherwise fallback
      let imageUrl = 'https://via.placeholder.com/400x250?text=Train+Deal';
      if (Array.isArray(t.image_url) && t.image_url.length > 0 && t.image_url[0].url) {
        imageUrl = t.image_url[0].url;
      } else if (typeof t.image_url === 'string') { // Fallback for direct string URL if any
        imageUrl = t.image_url;
      }
  
      // Price display logic
      const priceDisplay = t.price_min !== null && t.price_min !== undefined ?
        `from ${t.price_min} ${t.currency || '€'}` :
        '';
  
      // Location display
      let locationDisplay = 'Location Unknown';
      if (t.locations) {
        if (t.locations.city && t.locations.country) {
          locationDisplay = `${t.locations.city}, ${t.locations.country}`;
        } else if (t.locations.city) {
          locationDisplay = t.locations.city;
        } else if (t.locations.country) {
          locationDisplay = t.locations.country;
        }
      }
  
      return `
          <div class="relative flex flex-col rounded-xl overflow-hidden shadow hover:shadow-lg transition group bg-white">
            <div class="relative overflow-hidden">
              <img
                src="${imageUrl}"
                alt="${t.name || 'Train Deal Image'}"
                class="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              ${t.provider ? `
                <div class="absolute top-3 left-3 bg-[#eb8934] text-white text-xs font-semibold px-2 py-1 rounded">
                  ${t.provider}
                </div>
              ` : ''}
              <button class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition z-10">
                <i class="far fa-heart"></i>
              </button>
            </div>
    
            <div class="p-4 flex-grow flex flex-col">
              <h3 class="text-xl font-bold text-gray-800 mb-1">${t.name || 'Train Route'}</h3>
              <p class="text-gray-600 text-sm mb-2">${locationDisplay}</p>
              ${t.description ? `
                <p class="text-sm text-gray-500 mb-2 leading-tight">${t.description.substring(0, 100)}${t.description.length > 100 ? '...' : ''}</p>
              ` : '<p class="text-sm text-gray-500 mb-2 leading-tight">No description available.</p>'}
              
              <div class="mt-auto pt-2 border-t border-gray-100">
                 </div>
    
              <div class="mt-4 text-center">
                ${t.price_min !== null && t.price_min !== undefined ? `
            
                ` : ``}
                <a
                  href="${t.affiliate_url || '#'}"
                  target="_blank"
                  class="inline-flex bg-[#eb8934] text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition items-center"
                >
                  Show deals
                  <i class="fas fa-chevron-right text-xs ml-2"></i>
                </a>
              </div>
            </div>
          </div>
        `;
    }
  }