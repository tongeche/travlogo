// js/services/FlightsService.js

export default class FlightsService {
  /**
   * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
   * @param {Object} selectors
   * @param {string} selectors.outputSel - CSS selector for the “no data / error” output container
   * @param {string} selectors.gridSel   - CSS selector for the grid where cards get injected
   */
  constructor(supabaseClient, { outputSel, gridSel }) {
    this.client = supabaseClient;              // ← use the shared client
    this.output = document.querySelector(outputSel);
    this.grid   = document.querySelector(gridSel);
  }

  /** Fetches flight items and renders them into the grid */
  async load() {
    try {
      const { data, error } = await this.client
        .from('items')
        .select(`id, name, description, image_url, price_min, currency`)
        .eq('service_type', 'flight')
        .order('price_min', { ascending: true })
        .limit(3);

      if (error) throw error;

      if (!data.length) {
        this.output.textContent = 'No flights found.';
        return;
      }

      // Clear any previous content & inject new cards
      this.grid.innerHTML = data.map(item => this._card(item)).join('');
    } catch (err) {
      console.error('FlightsService.load error:', err);
      this.output.textContent = `Error: ${err.message}`;
    }
  }

  /** Returns the HTML for one flight card */
  _card(f) {
    return `
      <div class="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition">
        <img
          src="${f.image_url}"
          alt="${f.name}"
          class="w-full h-40 object-cover rounded mb-3"
          loading="lazy"
        />
        <h3 class="text-lg font-semibold text-gray-900 mb-1">${f.name}</h3>
        <p class="text-sm text-gray-600 mb-2">${f.description}</p>
        <p class="text-[#eb8934] font-bold text-lg">
          ${f.currency}${parseFloat(f.price_min).toFixed(2)}
        </p>
      </div>
    `;
  }
}
