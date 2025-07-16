// js/main.js
// ──────────────────────────────────────────────────────────────────────────────
// 1) Alpine.js via native ESM import
import Alpine from 'https://unpkg.com/alpinejs?module';
window.Alpine = Alpine;
Alpine.start();

// 2) Supabase client via native ESM import
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 3) Your own modules
import { fetchConfig }   from './config.js';
import HotelsService     from './services/HotelsService.js';
import ToursService      from './services/ToursService.js';
import FlightsService    from './services/FlightsService.js';
import TabsController    from './controllers/TabsController.js';
import TrainsService     from './services/TrainsService.js'; // This is correct

document.addEventListener('DOMContentLoaded', async () => {
  // 4) Load your Supabase credentials
  const { SUPABASE_URL, SUPABASE_KEY } = await fetchConfig();

  // 5) Create *one* Supabase client instance
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 6) Instantiate your services, passing in the shared client
  const hotels  = new HotelsService(supabase, {
    outputSel: '#hotels-output',
    gridSel:   '#hotels-grid'
  });
  const tours   = new ToursService(supabase, {
    desktopSel: '#tours-grid',
    mobileSel:  '#tours-carousel',
    outputSel:  '#tours-output'
  });
  const flights = new FlightsService(supabase, {
    outputSel: '#flights-output',
    gridSel:   '#flights-grid'
  });
  // ADD THIS BLOCK FOR TRAINS SERVICE
  const trains  = new TrainsService(supabase, {
    outputSel: '#trains-output',
    gridSel:   '#trains-grid'
  });


  // 7) Load & render data
  await hotels.load();
  await tours.init();
  tours.render('other_stays');  // default tab
  await flights.load();
  // ADD THIS LINE TO LOAD TRAIN DATA
  await trains.load();

  // 8) Hook up your tab buttons to switch the ToursService data
  new TabsController('.tab-button', tag => tours.render(tag));
});