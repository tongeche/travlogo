// js/services/ToursService.js

export default class ToursService {
  /**
   * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
   * @param {Object} selectors
   * @param {string} selectors.desktopSel  - CSS selector for the desktop grid container
   * @param {string} selectors.mobileSel   - CSS selector for the mobile carousel container
   * @param {string} selectors.outputSel   - CSS selector for the “no data / error” output container
   */
  constructor(supabaseClient, { desktopSel, mobileSel, outputSel }) {
    this.client         = supabaseClient;               // ← use the shared client
    this.desktopGrid    = document.querySelector(desktopSel);
    this.mobileCarousel = document.querySelector(mobileSel);
    this.output         = document.querySelector(outputSel);
    this.grouped        = {};
  }

  /** Fetches all tours and groups them by tag */
  async init() {

    try {
      const { data, error } = await this.client
        .from('items')
        .select(`
          id, name, description, image_url, affiliate_url,
          price_min, currency, rating, review_count, tags
        `)
        .eq('service_type', 'tour')
        .limit(100);



      if (error) throw error;
      if (!data.length) {
        this.output.textContent = 'No tours found.';
        return;
      }
      this._groupByTags(data);
    } catch (err) {
      console.error('ToursService.init error:', err);
      this.output.textContent = `Error: ${err.message}`;
    }
  }

  /** Internal: group the fetched tours by each tag */
  _groupByTags(tours) {
    tours.forEach(tour => {
      // Ensure image_url is parsed before grouping/rendering
      tour.parsed_image_url = this._parseImageUrl(tour.image_url); // Add a new property

      (tour.tags || []).forEach(tag => {
        if (!this.grouped[tag]) this.grouped[tag] = [];
        this.grouped[tag].push(tour);
      });
    });
  }

  /**
   * Helper to parse the JSONB image_url into a usable string.
   * Handles both '"URL"' and '{"url": "URL"}' formats.
   * @param {any} imageUrlData The raw data from the image_url JSONB column.
   * @returns {string} The direct URL string or a placeholder.
   */
  _parseImageUrl(imageUrlData) {
    if (!imageUrlData) {
      return 'https://via.placeholder.com/400x250'; // Default placeholder
    }
    try {
      // Case 1: Stored as a JSON object, e.g., {"url": "https://..."}
      if (typeof imageUrlData === 'object' && imageUrlData !== null && 'url' in imageUrlData) {
        return imageUrlData.url;
      }
      // Case 2: Stored as a JSON string, e.g., '"https://..."'
      // Supabase client usually parses JSONB into JS objects/values.
      // If it comes as a string representation of a JSON string, try parsing it.
      if (typeof imageUrlData === 'string') {
        // Attempt to parse if it looks like a JSON string literal
        try {
            const parsed = JSON.parse(imageUrlData);
            if (typeof parsed === 'string') {
                return parsed;
            }
        } catch (e) {
            // It was just a plain string or not valid JSON
            return imageUrlData;
        }
      }
      // Fallback if it's already a plain string (from old data or direct text insert)
      return imageUrlData;

    } catch (e) {
      console.warn('Failed to parse image_url JSONB:', imageUrlData, e);
      return 'https://via.placeholder.com/400x250'; // Fallback placeholder on error
    }
  }


  /**
   * Renders the given tag’s tours into desktop and mobile containers
   * @param {string} tag
   */
  render(tag) {
   
    const items = this.grouped[tag] || [];


    // desktop grid
    this.desktopGrid.innerHTML = items.map(this._desktopCard).join('');
    // mobile carousel
    this.mobileCarousel.innerHTML = items.map(this._mobileCard).join('');
  }

  /** Returns HTML for a single desktop tour card */
  _desktopCard = t => `
    <a href="${t.affiliate_url}" target="_blank"
       class="block bg-white rounded-xl shadow hover:shadow-lg overflow-hidden">
      <img src="${t.parsed_image_url || 'https://via.placeholder.com/400x250'}"
           alt="${t.name}" class="w-full h-40 object-cover" loading="lazy">
      <div class="p-4">
        <h3 class="font-semibold text-gray-900 mb-1">${t.name}</h3>
        <p class="text-sm text-gray-600 mb-2">${t.description}</p>
        <div class="text-lg font-bold text-gray-900 mb-1">
          ${t.currency}${t.price_min}
        </div>
        <div class="text-sm text-gray-500">per adult</div>
      </div>
    </a>
  `

  /** Returns HTML for a single mobile swipe card */
  _mobileCard = t => `
    <div class="snap-center flex-shrink-0 w-full max-w-xs bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold text-gray-800 mb-1">${t.name}</h3>
      <p class="text-sm text-gray-600 mb-2">${t.description}</p>
      <div class="font-bold text-gray-900 mb-2">${t.currency}${t.price_min}</div>
      <a href="${t.affiliate_url}"
         class="inline-block bg-[#eb8934] text-white px-3 py-1 rounded text-sm">
        Book now
      </a>
    </div>
  `
}