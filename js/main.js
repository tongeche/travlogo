(()=>{var v=Object.create;var g=Object.defineProperty;var _=Object.getOwnPropertyDescriptor;var w=Object.getOwnPropertyNames;var $=Object.getPrototypeOf,S=Object.prototype.hasOwnProperty;var f=(i=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(i,{get:(t,e)=>(typeof require<"u"?require:t)[e]}):i)(function(i){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+i+'" is not supported')});var C=(i,t,e,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of w(t))!S.call(i,o)&&o!==e&&g(i,o,{get:()=>t[o],enumerable:!(r=_(t,o))||r.enumerable});return i};var N=(i,t,e)=>(e=i!=null?v($(i)):{},C(t||!i||!i.__esModule?g(e,"default",{value:i,enumerable:!0}):e,i));var m=N(f("alpinejs"),1),x=f("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");async function h(){let i=await fetch("/data/config.json");if(!i.ok)throw new Error("Could not load config.json");return await i.json()}var l=class{constructor(t,{outputSel:e,gridSel:r}){this.client=t,this.output=document.querySelector(e),this.grid=document.querySelector(r)}async load(){try{let{data:t,error:e}=await this.client.from("items").select(`
          id, name, description, image_url, affiliate_url,
          price_min, currency, rating, review_count,
          locations:location_id ( city, country )
        `).eq("service_type","hotel").limit(10);if(e)throw e;if(!t.length){this.output.textContent="No hotels found.";return}this.grid.innerHTML=t.map(r=>this._card(r)).join("")}catch(t){console.error("HotelsService.load error:",t),this.output.textContent=`Error: ${t.message}`}}_getStarRatingHtml(t){if(t==null||isNaN(t))return"";let e=t/2,r=Math.floor(e),o=e%1>=.5?1:0,n=5-r-o,a='<div class="flex items-center text-yellow-400">';for(let s=0;s<r;s++)a+='<i class="fas fa-star text-sm"></i>';o&&(a+='<i class="fas fa-star-half-alt text-sm"></i>');for(let s=0;s<n;s++)a+='<i class="far fa-star text-sm"></i>';return a+="</div>",a}_getReviewText(t){return t==null||isNaN(t)?"No rating":t>=9?"Wonderful":t>=8?"Very Good":t>=7?"Good":t>=6?"Pleasant":"Acceptable"}_card(t){let e=Array.isArray(t.image_url)&&t.image_url.length>0&&t.image_url[0].url?t.image_url[0].url:"https://via.placeholder.com/400x250?text=No+Image",r=t.price_min!==null&&t.price_min!==void 0?`desde ${t.price_min} ${t.currency||"\u20AC"}`:"",o=this._getStarRatingHtml(t.rating),n=this._getReviewText(t.rating),a=t.review_count!==null&&t.review_count!==void 0&&t.review_count>0?`(${t.review_count.toLocaleString()} reviews)`:"No reviews",s=t.locations?`${t.locations.city}, ${t.locations.country}`:"Location Unknown",y=t.rating&&t.rating>=9?`
      <div class="absolute top-3 left-3 bg-[#eb8934] text-white text-xs font-semibold px-2 py-1 rounded">
        Highly-rated luxurious stay
      </div>
    `:"",b=t.rating!==null&&t.rating!==void 0&&!isNaN(t.rating)?`
      <div class="absolute top-3 right-3 bg-white px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-md flex items-center justify-center">
        <p class="text-[#eb8934] text-sm font-bold leading-none">${t.rating.toFixed(1)}</p>
        <span class="ml-1 text-gray-600 text-xs">${n}</span>
      </div>
    `:"",T=`
        <button class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition z-10">
          <i class="far fa-heart"></i>
        </button>
    `;return`
      <div class="relative flex flex-col rounded-xl overflow-hidden shadow hover:shadow-lg transition group bg-white">
        <div class="relative overflow-hidden">
          <img
            src="${e}"
            alt="${t.name||"Hotel Image"}"
            class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          ${y}
          ${b}
          <button class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition z-10">
            <i class="far fa-heart"></i>
          </button>
        </div>

        <div class="p-4 flex-grow flex flex-col">
          <h3 class="text-xl font-bold text-gray-800 mb-1">${t.name||"Hotel Name"}</h3>
          <p class="text-gray-600 text-sm mb-2">${s}</p>
          ${t.description?`
            <p class="text-sm text-gray-500 mb-2 leading-tight">${t.description.substring(0,100)}${t.description.length>100?"...":""}</p>
          `:'<p class="text-sm text-gray-500 mb-2 leading-tight">No description available.</p>'}
          <div class="mt-auto pt-2 border-t border-gray-100">
         
         
             </div>

    <div class="mt-4 text-center"> ${t.price_min!==null&&t.price_min!==void 0?`
    <p class="text-lg font-bold text-gray-800 mb-2">${r}</p> `:""}
  <a
    href="${t.affiliate_url||"#"}"
    target="_blank"
    class="inline-flex bg-[#eb8934] text-white font-semibold px-4 py-2  hover:bg-orange-600 transition items-center" >
    Show prices
  
  </a>
</div>
        </div>
      </div>
    `}};var c=class{constructor(t,{desktopSel:e,mobileSel:r,outputSel:o}){this.client=t,this.desktopGrid=document.querySelector(e),this.mobileCarousel=document.querySelector(r),this.output=document.querySelector(o),this.grouped={}}async init(){try{let{data:t,error:e}=await this.client.from("items").select(`
          id, name, description, image_url, affiliate_url,
          price_min, currency, rating, review_count, tags
        `).eq("service_type","tour").limit(100);if(e)throw e;if(!t.length){this.output.textContent="No tours found.";return}this._groupByTags(t)}catch(t){console.error("ToursService.init error:",t),this.output.textContent=`Error: ${t.message}`}}_groupByTags(t){t.forEach(e=>{e.parsed_image_url=this._parseImageUrl(e.image_url),(e.tags||[]).forEach(r=>{this.grouped[r]||(this.grouped[r]=[]),this.grouped[r].push(e)})})}_parseImageUrl(t){if(!t)return"https://via.placeholder.com/400x250";try{if(typeof t=="object"&&t!==null&&"url"in t)return t.url;if(typeof t=="string")try{let e=JSON.parse(t);if(typeof e=="string")return e}catch{return t}return t}catch(e){return console.warn("Failed to parse image_url JSONB:",t,e),"https://via.placeholder.com/400x250"}}render(t){let e=this.grouped[t]||[];this.desktopGrid.innerHTML=e.map(this._desktopCard).join(""),this.mobileCarousel.innerHTML=e.map(this._mobileCard).join("")}_desktopCard=t=>`
    <a href="${t.affiliate_url}" target="_blank"
       class="block bg-white rounded-xl shadow hover:shadow-lg overflow-hidden">
      <img src="${t.parsed_image_url||"https://via.placeholder.com/400x250"}"
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
  `;_mobileCard=t=>`
    <div class="snap-center flex-shrink-0 w-full max-w-xs bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold text-gray-800 mb-1">${t.name}</h3>
      <p class="text-sm text-gray-600 mb-2">${t.description}</p>
      <div class="font-bold text-gray-900 mb-2">${t.currency}${t.price_min}</div>
      <a href="${t.affiliate_url}"
         class="inline-block bg-[#eb8934] text-white px-3 py-1 rounded text-sm">
        Book now
      </a>
    </div>
  `};var d=class{constructor(t,{outputSel:e,gridSel:r}){this.client=t,this.output=document.querySelector(e),this.grid=document.querySelector(r)}async load(){try{let{data:t,error:e}=await this.client.from("items").select("id, name, description, image_url, price_min, currency").eq("service_type","flight").order("price_min",{ascending:!0}).limit(3);if(e)throw e;if(!t.length){this.output.textContent="No flights found.";return}this.grid.innerHTML=t.map(r=>this._card(r)).join("")}catch(t){console.error("FlightsService.load error:",t),this.output.textContent=`Error: ${t.message}`}}_card(t){return`
      <div class="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition">
        <img
          src="${t.image_url}"
          alt="${t.name}"
          class="w-full h-40 object-cover rounded mb-3"
          loading="lazy"
        />
        <h3 class="text-lg font-semibold text-gray-900 mb-1">${t.name}</h3>
        <p class="text-sm text-gray-600 mb-2">${t.description}</p>
        <p class="text-[#eb8934] font-bold text-lg">
          ${t.currency}${parseFloat(t.price_min).toFixed(2)}
        </p>
      </div>
    `}};var u=class{constructor(t,e){this.buttons=Array.from(document.querySelectorAll(t)),this.onTabChange=e,this._bind()}_bind(){this.buttons.forEach(t=>{t.addEventListener("click",()=>{let e=t.dataset.tag;this._activate(t),this.onTabChange(e)})})}_activate(t){this.buttons.forEach(e=>{let r=e===t;e.classList.toggle("text-[#eb8934]",r),e.classList.toggle("border-[#eb8934]",r)})}};var p=class{constructor(t,{outputSel:e,gridSel:r}){this.client=t,this.output=document.querySelector(e),this.grid=document.querySelector(r)}async load(){try{let{data:t,error:e}=await this.client.from("items").select(`
              id, name, description, image_url, affiliate_url,
              price_min, currency, provider, meta,
              locations:location_id ( city, country )
            `).eq("service_type","train").limit(6);if(e)throw e;if(!t.length){this.output.textContent="No train deals found at the moment.";return}this.grid.innerHTML=t.map(r=>this._card(r)).join(""),this.output.textContent=""}catch(t){console.error("TrainsService.load error:",t),this.output.textContent=`Error loading train deals: ${t.message}`}}_card(t){let e="https://via.placeholder.com/400x250?text=Train+Deal";Array.isArray(t.image_url)&&t.image_url.length>0&&t.image_url[0].url?e=t.image_url[0].url:typeof t.image_url=="string"&&(e=t.image_url);let r=t.price_min!==null&&t.price_min!==void 0?`from ${t.price_min} ${t.currency||"\u20AC"}`:"",o="Location Unknown";return t.locations&&(t.locations.city&&t.locations.country?o=`${t.locations.city}, ${t.locations.country}`:t.locations.city?o=t.locations.city:t.locations.country&&(o=t.locations.country)),`
          <div class="relative flex flex-col rounded-xl overflow-hidden shadow hover:shadow-lg transition group bg-white">
            <div class="relative overflow-hidden">
              <img
                src="${e}"
                alt="${t.name||"Train Deal Image"}"
                class="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              ${t.provider?`
                <div class="absolute top-3 left-3 bg-[#eb8934] text-white text-xs font-semibold px-2 py-1 rounded">
                  ${t.provider}
                </div>
              `:""}
              <button class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition z-10">
                <i class="far fa-heart"></i>
              </button>
            </div>
    
            <div class="p-4 flex-grow flex flex-col">
              <h3 class="text-xl font-bold text-gray-800 mb-1">${t.name||"Train Route"}</h3>
              <p class="text-gray-600 text-sm mb-2">${o}</p>
              ${t.description?`
                <p class="text-sm text-gray-500 mb-2 leading-tight">${t.description.substring(0,100)}${t.description.length>100?"...":""}</p>
              `:'<p class="text-sm text-gray-500 mb-2 leading-tight">No description available.</p>'}
              
              <div class="mt-auto pt-2 border-t border-gray-100">
                 </div>
    
              <div class="mt-4 text-center">
                ${t.price_min!==null&&t.price_min!==void 0?`
            
                `:""}
                <a
                  href="${t.affiliate_url||"#"}"
                  target="_blank"
                  class="inline-flex bg-[#eb8934] text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition items-center"
                >
                  Show deals
                  <i class="fas fa-chevron-right text-xs ml-2"></i>
                </a>
              </div>
            </div>
          </div>
        `}};window.Alpine=m.default;m.default.start();document.addEventListener("DOMContentLoaded",async()=>{let{SUPABASE_URL:i,SUPABASE_KEY:t}=await h(),e=(0,x.createClient)(i,t),r=new l(e,{outputSel:"#hotels-output",gridSel:"#hotels-grid"}),o=new c(e,{desktopSel:"#tours-grid",mobileSel:"#tours-carousel",outputSel:"#tours-output"}),n=new d(e,{outputSel:"#flights-output",gridSel:"#flights-grid"}),a=new p(e,{outputSel:"#trains-output",gridSel:"#trains-grid"});await r.load(),await o.init(),o.render("other_stays"),await n.load(),await a.load(),new u(".tab-button",s=>o.render(s))});})();
