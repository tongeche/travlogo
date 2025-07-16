// js/services/HotelsService.js

export default class HotelsService {
  /**
   * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
   * @param {Object} selectors
   * @param {string} selectors.outputSel - selector for the “no data / error” output container
   * @param {string} selectors.gridSel   - selector for the grid where hotel cards get injected
   */
  constructor(supabaseClient, { outputSel, gridSel }) {
    this.client = supabaseClient;
    this.output = document.querySelector(outputSel);
    this.grid   = document.querySelector(gridSel);
  }

  /** Fetches hotel items and renders them into the grid */
  async load() {
    try {
      const { data, error } = await this.client
        .from('items')
        .select(`
          id, name, description, image_url, affiliate_url,
          price_min, currency, rating, review_count,
          locations:location_id ( city, country )
        `)
        .eq('service_type', 'hotel')
        .limit(10);

      if (error) throw error;

      if (!data.length) {
        this.output.textContent = 'No hotels found.';
        return;
      }

      // Clear and inject new hotel cards
      this.grid.innerHTML = data.map(hotel => this._card(hotel)).join('');
    } catch (err) {
      console.error('HotelsService.load error:', err);
      this.output.textContent = `Error: ${err.message}`;
    }
  }

  /**
   * Generates star rating HTML based on a numeric rating.
   * Assumes a 1-10 scale for 'rating' which is mapped to 1-5 visual stars.
   * @param {number} rating - The hotel's rating (e.g., 8.5, 9.2).
   * @returns {string} HTML string for stars.
   */
  _getStarRatingHtml(rating) {
    if (rating === null || rating === undefined || isNaN(rating)) {
      return ''; // No rating, no stars
    }

    // Map 1-10 rating to 1-5 star scale
    const starValue = rating / 2;
    const fullStars = Math.floor(starValue);
    const halfStar = (starValue % 1) >= 0.5 ? 1 : 0; // Check for half star
    const emptyStars = 5 - fullStars - halfStar;

    let starsHtml = '<div class="flex items-center text-yellow-400">';
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="fas fa-star text-sm"></i>';
    }
    if (halfStar) {
      starsHtml += '<i class="fas fa-star-half-alt text-sm"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="far fa-star text-sm"></i>'; // Outline star for empty
    }
    starsHtml += '</div>';
    return starsHtml;
  }

  /**
   * Determines a descriptive review text based on the numeric rating.
   * @param {number} rating - The hotel's rating (1-10).
   * @returns {string} A descriptive text (e.g., "Wonderful", "Very Good").
   */
  _getReviewText(rating) {
    if (rating === null || rating === undefined || isNaN(rating)) {
      return 'No rating';
    }
    if (rating >= 9) return 'Wonderful';
    if (rating >= 8) return 'Very Good';
    if (rating >= 7) return 'Good';
    if (rating >= 6) return 'Pleasant';
    return 'Acceptable'; // Or other lower rating descriptions
  }


  /** Returns the HTML for one hotel card */
  _card(h) {
    // Fallback placeholder image URL
    const imageUrl = Array.isArray(h.image_url) && h.image_url.length > 0 && h.image_url[0].url
                     ? h.image_url[0].url
                     : 'https://via.placeholder.com/400x250?text=No+Image';

    // Price display logic
    const priceDisplay = h.price_min !== null && h.price_min !== undefined
    ? `desde ${h.price_min} ${h.currency || '€'}`
    : '';

    // Star rating HTML
    const starsHtml = this._getStarRatingHtml(h.rating);

    // Review text and count display
    const reviewText = this._getReviewText(h.rating);
    const reviewCountDisplay = h.review_count !== null && h.review_count !== undefined && h.review_count > 0
      ? `(${h.review_count.toLocaleString()} reviews)`
      : 'No reviews'; // Changed to "No reviews" if count is 0 or null/undefined

    // Location display
    const locationDisplay = h.locations ? `${h.locations.city}, ${h.locations.country}` : 'Location Unknown';

    // The "Highly-rated luxurious stay" badge logic (aligned with image_b8d961.png)
    const highlyRatedBadge = h.rating && h.rating >= 9.0 ? `
      <div class="absolute top-3 left-3 bg-[#eb8934] text-white text-xs font-semibold px-2 py-1 rounded">
        Highly-rated luxurious stay
      </div>
    ` : ''; // Changed background to brand orange, rounded corners slightly

    // Top right rating badge (aligned with image_b8d961.png)
    const topRightRatingBadge = h.rating !== null && h.rating !== undefined && !isNaN(h.rating) ? `
      <div class="absolute top-3 right-3 bg-white px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-md flex items-center justify-center">
        <p class="text-[#eb8934] text-sm font-bold leading-none">${h.rating.toFixed(1)}</p>
        <span class="ml-1 text-gray-600 text-xs">${reviewText}</span>
      </div>
    ` : ''; // Used brand orange for score, adapted styling for badge on top right

    // Heart icon for favorites
    const heartIcon = `
        <button class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition z-10">
          <i class="far fa-heart"></i>
        </button>
    `; // Ensured z-index for icon to be above other badges

    return `
      <div class="relative flex flex-col rounded-xl overflow-hidden shadow hover:shadow-lg transition group bg-white">
        <div class="relative overflow-hidden">
          <img
            src="${imageUrl}"
            alt="${h.name || 'Hotel Image'}"
            class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          ${highlyRatedBadge}
          ${topRightRatingBadge}
          <button class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition z-10">
            <i class="far fa-heart"></i>
          </button>
        </div>

        <div class="p-4 flex-grow flex flex-col">
          <h3 class="text-xl font-bold text-gray-800 mb-1">${h.name || 'Hotel Name'}</h3>
          <p class="text-gray-600 text-sm mb-2">${locationDisplay}</p>
          ${h.description ? `
            <p class="text-sm text-gray-500 mb-2 leading-tight">${h.description.substring(0, 100)}${h.description.length > 100 ? '...' : ''}</p>
          ` : '<p class="text-sm text-gray-500 mb-2 leading-tight">No description available.</p>'}
          <div class="mt-auto pt-2 border-t border-gray-100">
         
         
             </div>

    <div class="mt-4 text-center"> ${h.price_min !== null && h.price_min !== undefined ? `
    <p class="text-lg font-bold text-gray-800 mb-2">${priceDisplay}</p> ` : ``}
  <a
    href="${h.affiliate_url || '#'}"
    target="_blank"
    class="inline-flex bg-[#eb8934] text-white font-semibold px-4 py-2  hover:bg-orange-600 transition items-center" >
    Show prices
  
  </a>
</div>
        </div>
      </div>
    `;
  }
}