import { createClient } from '@supabase/supabase-js';

import { fetchConfig }   from '../config.js';
import HotelsService     from '../services/HotelsService.js';
import ToursService      from '../services/ToursService.js';
import FlightsService    from '../services/FlightsService.js';
import TabsController    from '../controllers/TabsController.js';
import TrainsService     from '../services/TrainsService.js'; 

document.addEventListener('DOMContentLoaded', async () => {
 
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_KEY
  );

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