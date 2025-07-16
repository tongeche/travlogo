(()=>{var p=(l=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(l,{get:(s,i)=>(typeof require<"u"?require:s)[i]}):l)(function(l){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+l+'" is not supported')});(()=>{var l=(s=>typeof p<"u"?p:typeof Proxy<"u"?new Proxy(s,{get:(i,o)=>(typeof p<"u"?p:i)[o]}):s)(function(s){if(typeof p<"u")return p.apply(this,arguments);throw Error('Dynamic require of "'+s+'" is not supported')});(()=>{var s=(i=>typeof l<"u"?l:typeof Proxy<"u"?new Proxy(i,{get:(o,c)=>(typeof l<"u"?l:o)[c]}):i)(function(i){if(typeof l<"u")return l.apply(this,arguments);throw Error('Dynamic require of "'+i+'" is not supported')});(()=>{var i=(o=>typeof s<"u"?s:typeof Proxy<"u"?new Proxy(o,{get:(c,g)=>(typeof s<"u"?s:c)[g]}):o)(function(o){if(typeof s<"u")return s.apply(this,arguments);throw Error('Dynamic require of "'+o+'" is not supported')});(()=>{var o=(c=>typeof i<"u"?i:typeof Proxy<"u"?new Proxy(c,{get:(g,h)=>(typeof i<"u"?i:g)[h]}):c)(function(c){if(typeof i<"u")return i.apply(this,arguments);throw Error('Dynamic require of "'+c+'" is not supported')});(()=>{var c=Object.create,g=Object.defineProperty,h=Object.getOwnPropertyDescriptor,x=Object.getOwnPropertyNames,b=Object.getPrototypeOf,v=Object.prototype.hasOwnProperty,f=(e=>typeof o<"u"?o:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof o<"u"?o:t)[r]}):e)(function(e){if(typeof o<"u")return o.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),w=(e,t,r,a)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of x(t))!v.call(e,n)&&n!==r&&g(e,n,{get:()=>t[n],enumerable:!(a=h(t,n))||a.enumerable});return e},_=(e,t,r)=>(r=e!=null?c(b(e)):{},w(t||!e||!e.__esModule?g(r,"default",{value:e,enumerable:!0}):r,e)),y=_(f("https://unpkg.com/alpinejs?module"),1),$=f("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");async function S(){let e=await fetch("/data/config.json");if(!e.ok)throw new Error("Could not load config.json");return await e.json()}var j=class{constructor(e,{outputSel:t,gridSel:r}){this.client=e,this.output=document.querySelector(t),this.grid=document.querySelector(r)}async load(){try{let{data:e,error:t}=await this.client.from("items").select(`
          id, name, description, image_url, affiliate_url,
          price_min, currency, rating, review_count,
          locations:location_id ( city, country )
        `).eq("service_type","hotel").limit(10);if(t)throw t;if(!e.length){this.output.textContent="No hotels found.";return}this.grid.innerHTML=e.map(r=>this._card(r)).join("")}catch(e){console.error("HotelsService.load error:",e),this.output.textContent=`Error: ${e.message}`}}_getStarRatingHtml(e){if(e==null||isNaN(e))return"";let t=e/2,r=Math.floor(t),a=t%1>=.5?1:0,n=5-r-a,d='<div class="flex items-center text-yellow-400">';for(let u=0;u<r;u++)d+='<i class="fas fa-star text-sm"></i>';a&&(d+='<i class="fas fa-star-half-alt text-sm"></i>');for(let u=0;u<n;u++)d+='<i class="far fa-star text-sm"></i>';return d+="</div>",d}_getReviewText(e){return e==null||isNaN(e)?"No rating":e>=9?"Wonderful":e>=8?"Very Good":e>=7?"Good":e>=6?"Pleasant":"Acceptable"}_card(e){let t=Array.isArray(e.image_url)&&e.image_url.length>0&&e.image_url[0].url?e.image_url[0].url:"https://via.placeholder.com/400x250?text=No+Image",r=e.price_min!==null&&e.price_min!==void 0?`desde ${e.price_min} ${e.currency||"\u20AC"}`:"",a=this._getStarRatingHtml(e.rating),n=this._getReviewText(e.rating),d=e.review_count!==null&&e.review_count!==void 0&&e.review_count>0?`(${e.review_count.toLocaleString()} reviews)`:"No reviews",u=e.locations?`${e.locations.city}, ${e.locations.country}`:"Location Unknown",m=e.rating&&e.rating>=9?`
      <div class="absolute top-3 left-3 bg-[#eb8934] text-white text-xs font-semibold px-2 py-1 rounded">
        Highly-rated luxurious stay
      </div>
    `:"",k=e.rating!==null&&e.rating!==void 0&&!isNaN(e.rating)?`
      <div class="absolute top-3 right-3 bg-white px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-md flex items-center justify-center">
        <p class="text-[#eb8934] text-sm font-bold leading-none">${e.rating.toFixed(1)}</p>
        <span class="ml-1 text-gray-600 text-xs">${n}</span>
      </div>
    `:"",P=`
        <button class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition z-10">
          <i class="far fa-heart"></i>
        </button>
    `;return`
      <div class="relative flex flex-col rounded-xl overflow-hidden shadow hover:shadow-lg transition group bg-white">
        <div class="relative overflow-hidden">
          <img
            src="${t}"
            alt="${e.name||"Hotel Image"}"
            class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          ${m}
          ${k}
          <button class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition z-10">
            <i class="far fa-heart"></i>
          </button>
        </div>

        <div class="p-4 flex-grow flex flex-col">
          <h3 class="text-xl font-bold text-gray-800 mb-1">${e.name||"Hotel Name"}</h3>
          <p class="text-gray-600 text-sm mb-2">${u}</p>
          ${e.description?`
            <p class="text-sm text-gray-500 mb-2 leading-tight">${e.description.substring(0,100)}${e.description.length>100?"...":""}</p>
          `:'<p class="text-sm text-gray-500 mb-2 leading-tight">No description available.</p>'}
          <div class="mt-auto pt-2 border-t border-gray-100">
         
         
             </div>

    <div class="mt-4 text-center"> ${e.price_min!==null&&e.price_min!==void 0?`
    <p class="text-lg font-bold text-gray-800 mb-2">${r}</p> `:""}
  <a
    href="${e.affiliate_url||"#"}"
    target="_blank"
    class="inline-flex bg-[#eb8934] text-white font-semibold px-4 py-2  hover:bg-orange-600 transition items-center" >
    Show prices
  
  </a>
</div>
        </div>
      </div>
    `}},q=class{constructor(e,{desktopSel:t,mobileSel:r,outputSel:a}){this.client=e,this.desktopGrid=document.querySelector(t),this.mobileCarousel=document.querySelector(r),this.output=document.querySelector(a),this.grouped={}}async init(){try{let{data:e,error:t}=await this.client.from("items").select(`
          id, name, description, image_url, affiliate_url,
          price_min, currency, rating, review_count, tags
        `).eq("service_type","tour").limit(100);if(t)throw t;if(!e.length){this.output.textContent="No tours found.";return}this._groupByTags(e)}catch(e){console.error("ToursService.init error:",e),this.output.textContent=`Error: ${e.message}`}}_groupByTags(e){e.forEach(t=>{t.parsed_image_url=this._parseImageUrl(t.image_url),(t.tags||[]).forEach(r=>{this.grouped[r]||(this.grouped[r]=[]),this.grouped[r].push(t)})})}_parseImageUrl(e){if(!e)return"https://via.placeholder.com/400x250";try{if(typeof e=="object"&&e!==null&&"url"in e)return e.url;if(typeof e=="string")try{let t=JSON.parse(e);if(typeof t=="string")return t}catch{return e}return e}catch(t){return console.warn("Failed to parse image_url JSONB:",e,t),"https://via.placeholder.com/400x250"}}render(e){let t=this.grouped[e]||[];this.desktopGrid.innerHTML=t.map(this._desktopCard).join(""),this.mobileCarousel.innerHTML=t.map(this._mobileCard).join("")}_desktopCard=e=>`
    <a href="${e.affiliate_url}" target="_blank"
       class="block bg-white rounded-xl shadow hover:shadow-lg overflow-hidden">
      <img src="${e.parsed_image_url||"https://via.placeholder.com/400x250"}"
           alt="${e.name}" class="w-full h-40 object-cover" loading="lazy">
      <div class="p-4">
        <h3 class="font-semibold text-gray-900 mb-1">${e.name}</h3>
        <p class="text-sm text-gray-600 mb-2">${e.description}</p>
        <div class="text-lg font-bold text-gray-900 mb-1">
          ${e.currency}${e.price_min}
        </div>
        <div class="text-sm text-gray-500">per adult</div>
      </div>
    </a>
  `;_mobileCard=e=>`
    <div class="snap-center flex-shrink-0 w-full max-w-xs bg-white p-4 rounded-lg shadow">
      <h3 class="font-semibold text-gray-800 mb-1">${e.name}</h3>
      <p class="text-sm text-gray-600 mb-2">${e.description}</p>
      <div class="font-bold text-gray-900 mb-2">${e.currency}${e.price_min}</div>
      <a href="${e.affiliate_url}"
         class="inline-block bg-[#eb8934] text-white px-3 py-1 rounded text-sm">
        Book now
      </a>
    </div>
  `},C=class{constructor(e,{outputSel:t,gridSel:r}){this.client=e,this.output=document.querySelector(t),this.grid=document.querySelector(r)}async load(){try{let{data:e,error:t}=await this.client.from("items").select("id, name, description, image_url, price_min, currency").eq("service_type","flight").order("price_min",{ascending:!0}).limit(3);if(t)throw t;if(!e.length){this.output.textContent="No flights found.";return}this.grid.innerHTML=e.map(r=>this._card(r)).join("")}catch(e){console.error("FlightsService.load error:",e),this.output.textContent=`Error: ${e.message}`}}_card(e){return`
      <div class="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition">
        <img
          src="${e.image_url}"
          alt="${e.name}"
          class="w-full h-40 object-cover rounded mb-3"
          loading="lazy"
        />
        <h3 class="text-lg font-semibold text-gray-900 mb-1">${e.name}</h3>
        <p class="text-sm text-gray-600 mb-2">${e.description}</p>
        <p class="text-[#eb8934] font-bold text-lg">
          ${e.currency}${parseFloat(e.price_min).toFixed(2)}
        </p>
      </div>
    `}},E=class{constructor(e,t){this.buttons=Array.from(document.querySelectorAll(e)),this.onTabChange=t,this._bind()}_bind(){this.buttons.forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tag;this._activate(e),this.onTabChange(t)})})}_activate(e){this.buttons.forEach(t=>{let r=t===e;t.classList.toggle("text-[#eb8934]",r),t.classList.toggle("border-[#eb8934]",r)})}},N=class{constructor(e,{outputSel:t,gridSel:r}){this.client=e,this.output=document.querySelector(t),this.grid=document.querySelector(r)}async load(){try{let{data:e,error:t}=await this.client.from("items").select(`
              id, name, description, image_url, affiliate_url,
              price_min, currency, provider, meta,
              locations:location_id ( city, country )
            `).eq("service_type","train").limit(6);if(t)throw t;if(!e.length){this.output.textContent="No train deals found at the moment.";return}this.grid.innerHTML=e.map(r=>this._card(r)).join(""),this.output.textContent=""}catch(e){console.error("TrainsService.load error:",e),this.output.textContent=`Error loading train deals: ${e.message}`}}_card(e){let t="https://via.placeholder.com/400x250?text=Train+Deal";Array.isArray(e.image_url)&&e.image_url.length>0&&e.image_url[0].url?t=e.image_url[0].url:typeof e.image_url=="string"&&(t=e.image_url);let r=e.price_min!==null&&e.price_min!==void 0?`from ${e.price_min} ${e.currency||"\u20AC"}`:"",a="Location Unknown";return e.locations&&(e.locations.city&&e.locations.country?a=`${e.locations.city}, ${e.locations.country}`:e.locations.city?a=e.locations.city:e.locations.country&&(a=e.locations.country)),`
          <div class="relative flex flex-col rounded-xl overflow-hidden shadow hover:shadow-lg transition group bg-white">
            <div class="relative overflow-hidden">
              <img
                src="${t}"
                alt="${e.name||"Train Deal Image"}"
                class="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              ${e.provider?`
                <div class="absolute top-3 left-3 bg-[#eb8934] text-white text-xs font-semibold px-2 py-1 rounded">
                  ${e.provider}
                </div>
              `:""}
              <button class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-red-500 transition z-10">
                <i class="far fa-heart"></i>
              </button>
            </div>
    
            <div class="p-4 flex-grow flex flex-col">
              <h3 class="text-xl font-bold text-gray-800 mb-1">${e.name||"Train Route"}</h3>
              <p class="text-gray-600 text-sm mb-2">${a}</p>
              ${e.description?`
                <p class="text-sm text-gray-500 mb-2 leading-tight">${e.description.substring(0,100)}${e.description.length>100?"...":""}</p>
              `:'<p class="text-sm text-gray-500 mb-2 leading-tight">No description available.</p>'}
              
              <div class="mt-auto pt-2 border-t border-gray-100">
                 </div>
    
              <div class="mt-4 text-center">
                ${e.price_min!==null&&e.price_min!==void 0?`
            
                `:""}
                <a
                  href="${e.affiliate_url||"#"}"
                  target="_blank"
                  class="inline-flex bg-[#eb8934] text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition items-center"
                >
                  Show deals
                  <i class="fas fa-chevron-right text-xs ml-2"></i>
                </a>
              </div>
            </div>
          </div>
        `}};window.Alpine=y.default,y.default.start(),document.addEventListener("DOMContentLoaded",async()=>{let{SUPABASE_URL:e,SUPABASE_KEY:t}=await S(),r=(0,$.createClient)(e,t),a=new j(r,{outputSel:"#hotels-output",gridSel:"#hotels-grid"}),n=new q(r,{desktopSel:"#tours-grid",mobileSel:"#tours-carousel",outputSel:"#tours-output"}),d=new C(r,{outputSel:"#flights-output",gridSel:"#flights-grid"}),u=new N(r,{outputSel:"#trains-output",gridSel:"#trains-grid"});await a.load(),await n.init(),n.render("other_stays"),await d.load(),await u.load(),new E(".tab-button",m=>n.render(m))})})()})()})()})()})();})();
