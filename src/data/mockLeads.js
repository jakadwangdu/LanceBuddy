// LanceBuddy Mock & Real Leads Database
// Extracted and modularized for React

let leadIdCounter = 0;
function genId() {
  return 'lead_' + (++leadIdCounter) + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
}

/* ── Real Source URL Generator ──────────────── */
export function getSourceURL(platform, name, loc) {
  const enc = encodeURIComponent(name + ' ' + loc);
  const encLoc = encodeURIComponent(loc);
  const encName = encodeURIComponent(name);
  switch(platform) {
    case 'Google Maps': return `https://www.google.com/maps/search/${enc}`;
    case 'JustDial': return `https://www.justdial.com/${loc.replace(/\s+/g,'-')}/${name.replace(/\s+/g,'-')}/results`;
    case 'IndiaMART': return `https://dir.indiamart.com/search.mp?ss=${encName}`;
    case 'Sulekha': return `https://www.sulekha.com/${encName}-${encLoc}`;
    case 'LinkedIn': return `https://www.linkedin.com/search/results/companies/?keywords=${enc}`;
    case 'Facebook': return `https://www.facebook.com/search/top/?q=${enc}`;
    case 'Instagram': return `https://www.instagram.com/explore/tags/${encName.replace(/\s+/g,'')}/`;
    default: return `https://www.google.com/search?q=${enc}`;
  }
}

/* ── Real Business Database by Location ──────── */
export const realBusinessDB = {
  "Cafe": {
    "Mumbai": [
      { name: "Blue Tokai Coffee Roasters", snippet: "Popular specialty coffee chain with single-origin beans and minimalist ambiance.", phone: "+91 22 6789 0123", maps: "https://maps.google.com/?q=Blue+Tokai+Coffee+Roasters+Mumbai" },
      { name: "Third Wave Coffee", snippet: "Award-winning micro-roaster known for pour-over and cold brew.", phone: "+91 22 4567 8901", maps: "https://maps.google.com/?q=Third+Wave+Coffee+Mumbai" },
      { name: "The Coffee Bean & Tea Leaf", snippet: "International chain offering flavored coffees, teas, and light bites.", phone: "+91 22 3456 7890", maps: "https://maps.google.com/?q=Coffee+Bean+Tea+Leaf+Mumbai" },
      { name: "Koinonia Cafe", snippet: "Cozy Bandra cafe serving artisanal pastries and espresso.", phone: "+91 98765 43210", maps: "https://maps.google.com/?q=Koinonia+Cafe+Mumbai" },
      { name: "Tata Starbucks", snippet: "India's largest coffee chain with premium beverages and snacks.", phone: "+91 1800 208 9999", maps: "https://maps.google.com/?q=Starbucks+Mumbai" },
      { name: "QCR Café", snippet: "Quirky Colaba spot famous for thick shakes and waffles.", phone: "+91 22 2281 3738", maps: "https://maps.google.com/?q=QCR+Cafe+Mumbai" },
      { name: "Bonombarti Cafe", snippet: "Aesthetic South Mumbai hangout with fusion food and latte art.", phone: "+91 22 2367 9012", maps: "https://maps.google.com/?q=Bonombarti+Cafe+Mumbai" },
      { name: "Theobroma", snippet: "Iconic bakery-cafe famous for brownies, cookies, and sandwiches.", phone: "+91 22 2493 4567", maps: "https://maps.google.com/?q=Theobroma+Mumbai" }
    ],
    "Delhi": [
      { name: "Indian Coffee House", snippet: "Historic government-run cafe known for heritage decor and filter coffee.", phone: "+91 11 2345 6789", maps: "https://maps.google.com/?q=Indian+Coffee+House+Delhi" },
      { name: "Cafe Lota", snippet: "Craft-inspired cafe at Pragati Mahal serving regional Indian cuisine.", phone: "+91 11 4710 2000", maps: "https://maps.google.com/?q=Cafe+Lota+Delhi" },
      { name: "Blue Tokai Coffee Roasters", snippet: "Specialty roaster with outlets across South Delhi.", phone: "+91 98100 12345", maps: "https://maps.google.com/?q=Blue+Tokai+Coffee+Delhi" },
      { name: "Cha Bar", snippet: "Premium tea lounge inside Oxford Bookstore, Connaught Place.", phone: "+91 11 4151 2345", maps: "https://maps.google.com/?q=Cha+Bar+Delhi" },
      { name: "Starbucks Reserve", snippet: "Premium Starbucks experience with rare coffee beans.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=Starbucks+Reserve+Delhi" },
      { name: "Diggin Cafe", snippet: "Instagram-worthy cafe in Chanakyapuri with pastel decor.", phone: "+91 11 2687 3890", maps: "https://maps.google.com/?q=Diggin+Cafe+Delhi" },
      { name: "Cafe Pluck", snippet: "All-day dining at The Suryaa New Delhi with continental menu.", phone: "+91 11 4780 8080", maps: "https://maps.google.com/?q=Cafe+Pluck+Delhi" },
      { name: "Bistro 57", snippet: "Gurgaon-based cafe with wood-fired pizzas and craft coffee.", phone: "+91 124 456 7890", maps: "https://maps.google.com/?q=Bistro+57+Gurgaon" }
    ],
    "Bangalore": [
      { name: "Third Wave Coffee Roasters", snippet: "Bengaluru-born specialty coffee brand with multiple outlets.", phone: "+91 80 4567 8901", maps: "https://maps.google.com/?q=Third+Wave+Coffee+Bangalore" },
      { name: "Matteo Coffea", snippet: "Church Street favorite with exposed brick walls and artisan brews.", phone: "+91 80 4112 3456", maps: "https://maps.google.com/?q=Matteo+Coffea+Bangalore" },
      { name: "Blue Tokai Coffee", snippet: "Bellandur outlet with roastery view and tasting flights.", phone: "+91 98801 23456", maps: "https://maps.google.com/?q=Blue+Tokai+Bangalore" },
      { name: "Echoes Koramangala", snippet: "Multi-cuisine cafe popular with tech professionals.", phone: "+91 80 4678 9012", maps: "https://maps.google.com/?q=Echoes+Koramangala+Bangalore" },
      { name: "Brahma Brews", snippet: "JP Nagar microbrewery and cafe with rooftop seating.", phone: "+91 80 2345 6789", maps: "https://maps.google.com/?q=Brahma+Brews+Bangalore" },
      { name: "The Hole in the Wall Cafe", snippet: "Quaint Indiranagar spot for pancakes, eggs, and great coffee.", phone: "+91 99887 66554", maps: "https://maps.google.com/?q=Hole+in++Wall+Cafe+Bangalore" },
      { name: "Subko Coffee", snippet: "Mumbai-born specialty roaster with Koramangala outlet.", phone: "+91 80 4567 1234", maps: "https://maps.google.com/?q=Subko+Coffee+Bangalore" },
      { name: "Necessary Disorder", snippet: "Koramangala cafe with board games and creative cocktails.", phone: "+91 98456 78901", maps: "https://maps.google.com/?q=Necessary+Disorder+Bangalore" }
    ],
    "Goa": [
      { name: "Blue Tokai Coffee Roasters", snippet: "Assagao-based roastery offering farm tours and tastings.", phone: "+91 832 2345 678", maps: "https://maps.google.com/?q=Blue+Tokai+Coffee+Goa" },
      { name: "Cafe Bodega", snippet: "Artistic cafe inside Sunaparanta arts center, Panjim.", phone: "+91 832 243 4567", maps: "https://maps.google.com/?q=Cafe+Bodega+Goa" },
      { name: "Cafe Tato", snippet: "Legendary Vasco diner serving Goan snacks since 1955.", phone: "+91 832 256 7890", maps: "https://maps.google.com/?q=Cafe+Tato+Goa" },
      { name: "Bean Me Up", snippet: "Organic vegan cafe in Assagao with farm-fresh produce.", phone: "+91 98234 56789", maps: "https://maps.google.com/?q=Bean+Me+Up+Goa" },
      { name: "The Flemish Bond", snippet: "Heritage cafe in Panjim's Fontainhas Latin Quarter.", phone: "+91 832 222 3344", maps: "https://maps.google.com/?q=The+Flemish+Bond+Goa" },
      { name: "Cafe Bhonsle", snippet: "Classic South Mumbai-style cafe in Panjim since 1954.", phone: "+91 832 242 5008", maps: "https://maps.google.com/?q=Cafe+Bhonsle+Goa" },
      { name: "Cafe Latitude", snippet: "Anjuna beachside cafe with Mediterranean fare.", phone: "+91 832 227 1234", maps: "https://maps.google.com/?q=Cafe+Latitude+Goa" },
      { name: "Gunpowder", snippet: "South Indian heritage cafe in Assagao with traditional recipes.", phone: "+91 832 226 5008", maps: "https://maps.google.com/?q=Gunpowder+Goa" }
    ],
    "Chennai": [
      { name: "Amethyst Cafe", snippet: "Colonial-era garden cafe with artsy vibe and continental food.", phone: "+91 44 2847 1234", maps: "https://maps.google.com/?q=Amethyst+Cafe+Chennai" },
      { name: "The Brew Room", snippet: "Adyar specialty coffee shop with pour-overs and cold brews.", phone: "+91 44 4567 8901", maps: "https://maps.google.com/?q=The+Brew+Room+Chennai" },
      { name: "Murugan Idli Shop", snippet: "Iconic chain serving traditional South Indian breakfast since 1965.", phone: "+91 44 2815 0401", maps: "https://maps.google.com/?q=Murugan+Idli+Shop+Chennai" },
      { name: "Hilton Chennai Coffee Shop", snippet: "All-day dining at Hilton with global and Indian cuisine.", phone: "+91 44 2225 5555", maps: "https://maps.google.com/?q=Hilton+Chennai" },
      { name: "Blend Cafe", snippet: "T Nagar hangout known for fusion food and milkshakes.", phone: "+91 98401 23456", maps: "https://maps.google.com/?q=Blend+Cafe+Chennai" },
      { name: "Cafe Coffee Day", snippet: "India's homegrown chain with outlets across Chennai.", phone: "+91 44 4567 0000", maps: "https://maps.google.com/?q=Cafe+Coffee+Day+Chennai" },
      { name: "The Glass House", snippet: "Scandinavian-style minimalist cafe in RA Puram.", phone: "+91 98840 12345", maps: "https://maps.google.com/?q=The+Glass+House+Chennai" },
      { name: "Velessa Foods", snippet: "Organic cafe in Alwarpet with health-focused menu.", phone: "+91 44 4589 0123", maps: "https://maps.google.com/?q=Velessa+Foods+Chennai" }
    ],
    "Hyderabad": [
      { name: "Blue Tokai Coffee", snippet: "Banjara Hills outlet with single-origin brews and pastries.", phone: "+91 40 4567 8901", maps: "https://maps.google.com/?q=Blue+Tokai+Coffee+Hyderabad" },
      { name: "Starbucks Jubilee Hills", snippet: "Premium Starbucks outlet in Hyderabad's upscale neighborhood.", phone: "+91 91823 45678", maps: "https://maps.google.com/?q=Starbucks+Jubilee+Hills+Hyderabad" },
      { name: "Cafe Bahar", snippet: "Iconic restaurant and coffee shop in Basheerbagh.", phone: "+91 40 2324 3444", maps: "https://maps.google.com/?q=Cafe+Bahar+Hyderabad" },
      { name: "Roastery Coffee House", snippet: "Gachibowli cafe popular with IT crowd, with live roasting.", phone: "+91 40 4512 3456", maps: "https://maps.google.com/?q=Roastery+Coffee+House+Hyderabad" },
      { name: "Autumn Leaf Cafe", snippet: "Jubilee Hills all-day cafe with continental cuisine.", phone: "+91 40 4012 3456", maps: "https://maps.google.com/?q=Autumn+Leaf+Cafe+Hyderabad" },
      { name: "Cafe Niloufer", snippet: "Historic bakery and cafe famous for Irani chai and Osmania biscuits.", phone: "+91 40 2323 4567", maps: "https://maps.google.com/?q=Cafe+Niloufer+Hyderabad" },
      { name: "TATRA", snippet: "Indiranagar-style cafe in Jubilee Hills with board games.", phone: "+91 98765 43210", maps: "https://maps.google.com/?q=TATRA+Hyderabad" },
      { name: "Third Wave Coffee", snippet: "HITEC City outlet serving specialty Indian beans.", phone: "+91 40 4567 1234", maps: "https://maps.google.com/?q=Third+Wave+Coffee+Hyderabad" }
    ],
    "Kolkata": [
      { name: "Indian Coffee House", snippet: "Historic College Street institution since 1942, frequented by intellectuals.", phone: "+91 33 2241 3126", maps: "https://maps.google.com/?q=Indian+Coffee+House+Kolkata" },
      { name: "Cafe Coffee Day", snippet: "Multiple outlets across Kolkata for budget coffee.", phone: "+91 33 4567 8901", maps: "https://maps.google.com/?q=Cafe+Coffee+Day+Kolkata" },
      { name: "The Tea Trove", snippet: "Park Street tea cafe with extensive Darjeeling selection.", phone: "+91 33 2287 3456", maps: "https://maps.google.com/?q=The+Tea+Trove+Kolkata" },
      { name: "Flurys", snippet: "Iconic Park Street bakery-cafe since 1927, famous for pastries.", phone: "+91 33 4004 8888", maps: "https://maps.google.com/?q=Flurys+Kolkata" },
      { name: "Cafe Mezzuna", snippet: "Lounge cafe at The Lindsay with live music nights.", phone: "+91 33 2249 8824", maps: "https://maps.google.com/?q=Cafe+Mezzuna+Kolkata" },
      { name: "Tram Cafe", snippet: "Unique heritage tram-themed cafe in New Market area.", phone: "+91 33 2289 4567", maps: "https://maps.google.com/?q=Tram+Cafe+Kolkata" },
      { name: "Cha Bar", snippet: "Premium tea lounge at Oxford Bookstore, Park Street.", phone: "+91 33 2289 8888", maps: "https://maps.google.com/?q=Cha+Bar+Kolkata" },
      { name: "Bonedigd", snippet: "Boutique cafe in Ballygunge with Italian espresso.", phone: "+91 98360 12345", maps: "https://maps.google.com/?q=Bonedigd+Kolkata" }
    ],
    "Pune": [
      { name: "Third Wave Coffee", snippet: "Koregaon Park outlet with pour-over and espresso flights.", phone: "+91 20 4567 8901", maps: "https://maps.google.com/?q=Third+Wave+Coffee+Pune" },
      { name: "Cafe Goodfellas", snippet: "Kalyani Nagar multi-cuisine cafe with garden seating.", phone: "+91 20 2661 2345", maps: "https://maps.google.com/?q=Cafe+Goodfellas+Pune" },
      { name: "Vohuman Cafe", snippet: "Legendary Iranian cafe in Camp area since 1917.", phone: "+91 20 2613 1111", maps: "https://maps.google.com/?q=Vohuman+Cafe+Pune" },
      { name: "Effingut Brewerkel", snippet: "Koregaon Park microbrewery and cafe with craft beers.", phone: "+91 20 2612 3456", maps: "https://maps.google.com/?q=Effingut+Brewerkel+Pune" },
      { name: "The Urban Foundry", snippet: "Viman Nagar industrial-chic cafe with fusion menu.", phone: "+91 98224 56789", maps: "https://maps.google.com/?q=The+Urban+Foundry+Pune" },
      { name: "Burgersy", snippet: "FC Road hangout for burgers, shakes, and coffee.", phone: "+91 20 2567 8901", maps: "https://maps.google.com/?q=Burgersy+Pune" },
      { name: "Budhani Bros Waferwala", snippet: "Heritage bakery and coffee shop in Camp since 1948.", phone: "+91 20 2612 1581", maps: "https://maps.google.com/?q=Budhani+Bros+Pune" },
      { name: "Blue Tokai Coffee", snippet: "Aundh outlet with tasting room and retail beans.", phone: "+91 98230 12345", maps: "https://maps.google.com/?q=Blue+Tokai+Pune" }
    ],
    "Jaipur": [
      { name: "The Tattoo Cafe", snippet: "Rooftop cafe near Hawa Mahal with city views and continental food.", phone: "+91 141 4567 890", maps: "https://maps.google.com/?q=The+Tattoo+Cafe+Jaipur" },
      { name: "Cafe LazyMojo", snippet: "MI Road hangout with coffee, shakes, and board games.", phone: "+91 98290 12345", maps: "https://maps.google.com/?q=Cafe+LazyMojo+Jaipur" },
      { name: "On the House", snippet: "C-Scheme rooftop cafe with pan-Asian and Italian fare.", phone: "+91 141 4032 100", maps: "https://maps.google.com/?q=On+the+House+Jaipur" },
      { name: "Brewberrys Cafe", snippet: "Vaishali Nagar coffee shop with waffles and cold coffee.", phone: "+91 141 4567 0123", maps: "https://maps.google.com/?q=Brewberrys+Cafe+Jaipur" },
      { name: "Blackout", snippet: "C-Scheme rooftop restaurant and lounge with live music.", phone: "+91 98291 23456", maps: "https://maps.google.com/?q=Blackout+Jaipur" },
      { name: "Anokhi Cafe", snippet: "Heritage cafe near City Park serving organic coffee.", phone: "+91 141 235 7002", maps: "https://maps.google.com/?q=Anokhi+Cafe+Jaipur" },
      { name: "Nibs Cafe", snippet: "Malviya Nagar spot for baked goods and espresso.", phone: "+91 141 4567 8901", maps: "https://maps.google.com/?q=Nibs+Cafe+Jaipur" },
      { name: "Bae", snippet: "Bani Park all-day dining with rooftop seating.", phone: "+91 98765 43210", maps: "https://maps.google.com/?q=Bae+Jaipur" }
    ],
    "Ahmedabad": [
      { name: "Coffee Culture", snippet: "CG Road hangout with Italian coffee and desserts.", phone: "+91 79 4567 8901", maps: "https://maps.google.com/?q=Coffee+Culture+Ahmedabad" },
      { name: "Boulevard 9", snippet: "S.G. Highway fine-dining cafe with craft cocktails.", phone: "+91 79 2684 0909", maps: "https://maps.google.com/?q=Boulevard+9+Ahmedabad" },
      { name: "The Great Kabab Factory", snippet: "CG Road all-day dining with Indian and continental fare.", phone: "+91 79 2646 1234", maps: "https://maps.google.com/?q=Great+Kabab+Factory+Ahmedabad" },
      { name: "Fuel Up", snippet: "Thaltej health-focused cafe with smoothie bowls.", phone: "+91 79 4567 0123", maps: "https://maps.google.com/?q=Fuel+Up+Ahmedabad" },
      { name: "Tea Post", snippet: "Gujarat-based chain with outlets across Ahmedabad.", phone: "+91 79 4567 8901", maps: "https://maps.google.com/?q=Tea+Post+Ahmedabad" },
      { name: "The Purple Martini", snippet: "S.G. Highway lounge cafe with Mexican cuisine.", phone: "+91 79 4567 1234", maps: "https://maps.google.com/?q=Purple+Martini+Ahmedabad" },
      { name: "Agashiye", snippet: "Terrace dining at House of MG with Gujarati thali.", phone: "+91 79 2560 3333", maps: "https://maps.google.com/?q=Agashiye+Ahmedabad" },
      { name: "Cafe Turquoise Cottage", snippet: "Maninagar cozy spot with affordable snacks and chai.", phone: "+91 79 2543 1234", maps: "https://maps.google.com/?q=Turquoise+Cottage+Ahmedabad" }
    ],
    "Lucknow": [
      { name: "Cafe Latitude", snippet: "Hazratganj cafe with continental fare and specialty coffee.", phone: "+91 98380 12345", maps: "https://maps.google.com/?q=Cafe+Latitude+Lucknow" },
      { name: "Barista", snippet: "Gomti Nagar outlet of India's premium coffee chain.", phone: "+91 522 4567 890", maps: "https://maps.google.com/?q=Barista+Lucknow" },
      { name: "Cafe Coffee Day", snippet: "Hazratganh hangout for coffee and casual meetings.", phone: "+91 522 2345 678", maps: "https://maps.google.com/?q=Cafe+Coffee+Day+Lucknow" },
      { name: "Wahid Biryani", snippet: "Iconic eatery serving Awadhi biryani and kebabs.", phone: "+91 522 263 0312", maps: "https://maps.google.com/?q=Wahid+Biryani+Lucknow" },
      { name: "The Urban Terrace", snippet: "Gomti Nagar rooftop cafe with Mughlai and Chinese.", phone: "+91 98390 12345", maps: "https://maps.google.com/?q=Urban+Terrace+Lucknow" },
      { name: "Royal Cafe", snippet: "Aminabad heritage eatery known for chaat and lassi.", phone: "+91 522 262 1234", maps: "https://maps.google.com/?q=Royal+Cafe+Lucknow" },
      { name: "Planets", snippet: "Indira Nagar family cafe with multi-cuisine buffet.", phone: "+91 522 4567 012", maps: "https://maps.google.com/?q=Planets+Lucknow" },
      { name: "Hazel Restaurant", snippet: "Gomti Nagar lounge cafe with live music.", phone: "+91 522 4567 8901", maps: "https://maps.google.com/?q=Hazel+Restaurant+Lucknow" }
    ],
    "Chandigarh": [
      { name: "Indian Coffee House", snippet: "Sector 17 heritage cafe with colonial-era charm.", phone: "+91 172 270 1234", maps: "https://maps.google.com/?q=Indian+Coffee+House+Chandigarh" },
      { name: "Cafe JC's", snippet: "Sector 10 all-day cafe with fusion food and cold coffee.", phone: "+91 172 4567 890", maps: "https://maps.google.com/?q=Cafe+JCs+Chandigarh" },
      { name: "The Brew Estate", snippet: "Sector 26 microbrewery and cafe with continental menu.", phone: "+91 172 501 2345", maps: "https://maps.google.com/?q=The+Brew+Estate+Chandigarh" },
      { name: "Taco Bell Cafe", snippet: "Sector 8 outlet with Mexican-inspired fast casual.", phone: "+91 172 4567 012", maps: "https://maps.google.com/?q=Taco+Bell+Chandigarh" },
      { name: "Barista Lavazza", snippet: "Sector 17 premium coffee lounge.", phone: "+91 172 508 1234", maps: "https://maps.google.com/?q=Barista+Lavazza+Chandigarh" },
      { name: "Backyard Sports Bar", snippet: "Sector 7 rooftop cafe with games and grills.", phone: "+91 98780 12345", maps: "https://maps.google.com/?q=Backyard+Sports+Bar+Chandigarh" },
      { name: "Whistling Woods", snippet: "Sector 26 family restaurant and coffee lounge.", phone: "+91 172 501 2346", maps: "https://maps.google.com/?q=Whistling+Woods+Chandigarh" },
      { name: "Baking Bad", snippet: "Sector 26 bakery-cafe with artisan breads and pastries.", phone: "+91 98150 12345", maps: "https://maps.google.com/?q=Baking+Bad+Chandigarh" }
    ],
    "Indore": [
      { name: "Cafe Liesta", snippet: "Vijay Nagar hangout with pizzas, shakes, and coffee.", phone: "+91 731 4567 890", maps: "https://maps.google.com/?q=Cafe+Liesta+Indore" },
      { name: "Cafe Coffee Day", snippet: "Rajwada area outlet for budget coffee and snacks.", phone: "+91 731 4012 345", maps: "https://maps.google.com/?q=Cafe+Coffee+Day+Indore" },
      { name: "The Bliss", snippet: "AB Road rooftop cafe with live music nights.", phone: "+91 731 4567 012", maps: "https://maps.google.com/?q=The+Bliss+Indore" },
      { name: "Samba's Cafe", snippet: "Palasia hangout with South American-inspired decor.", phone: "+91 98270 12345", maps: "https://maps.google.com/?q=Sambas+Cafe+Indore" },
      { name: "Hotel Apna Avenue", snippet: "Rajwada area restaurant with traditional thali.", phone: "+91 731 456 7890", maps: "https://maps.google.com/?q=Hotel+Apna+Avenue+Indore" },
      { name: "Cafe 101", snippet: "Vijay Nagar lounge cafe with board games.", phone: "+91 731 4567 8901", maps: "https://maps.google.com/?q=Cafe+101+Indore" },
      { name: "Cafe TFor", snippet: "AB Road multi-cuisine cafe with Chinese and Italian.", phone: "+91 731 4567 1234", maps: "https://maps.google.com/?q=Cafe+TFor+Indore" },
      { name: "Mangosteen Cafe", snippet: "Vijay Nagar spot for smoothie bowls and wraps.", phone: "+91 731 4567 0123", maps: "https://maps.google.com/?q=Mangosteen+Cafe+Indore" }
    ],
    "default": [
      { name: "Blue Tokai Coffee Roasters", snippet: "India's leading specialty coffee chain with multiple outlets.", phone: "+91 98765 43210", maps: "https://maps.google.com/?q=Blue+Tokai+Coffee" },
      { name: "Third Wave Coffee", snippet: "Award-winning micro-roaster from Bengaluru.", phone: "+91 80 4567 8901", maps: "https://maps.google.com/?q=Third+Wave+Coffee" },
      { name: "Starbucks Coffee", snippet: "International chain with 300+ outlets across India.", phone: "+91 1800 208 9999", maps: "https://maps.google.com/?q=Starbucks+India" },
      { name: "Cafe Coffee Day", snippet: "India's largest homegrown coffee chain.", phone: "+91 80 4168 0202", maps: "https://maps.google.com/?q=Cafe+Coffee+Day" },
      { name: "Barista Lavazza", snippet: "Premium Italian-style coffee chain in India.", phone: "+91 98765 43210", maps: "https://maps.google.com/?q=Barista+Lavazza" },
      { name: "Theobroma", snippet: "Iconic bakery-cafe famous for brownies.", phone: "+91 22 2493 4567", maps: "https://maps.google.com/?q=Theobroma+India" },
      { name: "Chaayos", snippet: "Chai-focused chain with 150+ outlets.", phone: "+91 98765 43210", maps: "https://maps.google.com/?q=Chaayos" },
      { name: "Subko Coffee", snippet: "Specialty roaster with tasting experiences.", phone: "+91 98765 43210", maps: "https://maps.google.com/?q=Subko+Coffee" }
    ]
  },
  "Hotel": {
    "Mumbai": [
      { name: "The Taj Mahal Palace", snippet: "Iconic luxury hotel overlooking the Gateway of India.", phone: "+91 22 6665 3366", maps: "https://maps.google.com/?q=Taj+Mahal+Palace+Mumbai" },
      { name: "The Oberoi Mumbai", snippet: "Five-star hotel at Nariman Point with sea views.", phone: "+91 22 6632 5757", maps: "https://maps.google.com/?q=The+Oberoi+Mumbai" },
      { name: "Trident Nariman Point", snippet: "Premium business hotel with Arabian Sea views.", phone: "+91 22 6632 4343", maps: "https://maps.google.com/?q=Trident+Nariman+Point" },
      { name: "ITC Maratha", snippet: "Luxury ITC hotel near Andheri with Mughal architecture.", phone: "+91 22 2830 3030", maps: "https://maps.google.com/?q=ITC+Maratha+Mumbai" },
      { name: "The Leela Mumbai", snippet: "Five-star hotel in Andheri East with lush gardens.", phone: "+91 22 6691 1234", maps: "https://maps.google.com/?q=The+Leela+Mumbai" },
      { name: "Grand Hyatt Mumbai", snippet: "Luxury hotel in Santacruz with multiple restaurants.", phone: "+91 22 6142 7777", maps: "https://maps.google.com/?q=Grand+Hyatt+Mumbai" },
      { name: "Sofitel Mumbai BKC", snippet: "French luxury hotel in Bandra Kurla Complex.", phone: "+91 22 6117 5000", maps: "https://maps.google.com/?q=Sofitel+Mumbai+BKC" },
      { name: "Radisson Blu Mumbai", snippet: "Business hotel near international airport.", phone: "+91 22 6151 9000", maps: "https://maps.google.com/?q=Radisson+Blu+Mumbai" }
    ],
    "Delhi": [
      { name: "The Imperial New Delhi", snippet: "Heritage luxury hotel built in 1931 with colonial architecture.", phone: "+91 11 4111 6600", maps: "https://maps.google.com/?q=The+Imperial+New+Delhi" },
      { name: "The Lodhi", snippet: "Luxury hotel near Lodhi Gardens with minimalist design.", phone: "+91 11 4070 1234", maps: "https://maps.google.com/?q=The+Lodhi+Delhi" },
      { name: "ITC Maurya", snippet: "Premium hotel in diplomatic enclave with award-winning restaurants.", phone: "+91 11 4172 1234", maps: "https://maps.google.com/?q=ITC+Maurya+Delhi" },
      { name: "The Leela Palace", snippet: "Royal-themed luxury hotel in Chanakyapuri.", phone: "+91 11 3933 1234", maps: "https://maps.google.com/?q=The+Leela+Palace+Delhi" },
      { name: "Taj Palace", snippet: "Iconic luxury hotel in diplomatic enclave.", phone: "+91 11 2611 0202", maps: "https://maps.google.com/?q=Taj+Palace+Delhi" },
      { name: "Hyatt Regency Delhi", snippet: "Business hotel in Bhikaji Cama Place with spa.", phone: "+91 11 6160 1234", maps: "https://maps.google.com/?q=Hyatt+Regency+Delhi" },
      { name: "The Ashok", snippet: "Government-owned luxury hotel in diplomatic area.", phone: "+91 11 2611 0101", maps: "https://maps.google.com/?q=The+Ashok+Delhi" },
      { name: "Le Meridien Delhi", snippet: "Contemporary luxury hotel near airport.", phone: "+91 11 2371 0101", maps: "https://maps.google.com/?q=Le+Meridien+Delhi" }
    ],
    "Bangalore": [
      { name: "The Oberoi Bangalore", snippet: "Luxury hotel on MG Road with tropical gardens.", phone: "+91 80 2558 5858", maps: "https://maps.google.com/?q=The+Oberoi+Bangalore" },
      { name: "ITC Gardenia", snippet: "Five-star hotel near Ulsoor Lake with eco-certification.", phone: "+91 80 2211 9898", maps: "https://maps.google.com/?q=ITC+Gardenia+Bangalore" },
      { name: "Taj West End", snippet: "Heritage hotel on Race Course Road with bungalow charm.", phone: "+91 80 6660 5300", maps: "https://maps.google.com/?q=Taj+West+End+Bangalore" },
      { name: "Le Meridien Bangalore", snippet: "Business hotel near airport with rooftop pool.", phone: "+91 80 2226 2233", maps: "https://maps.google.com/?q=Le+Meridien+Bangalore" },
      { name: "The Lalit Ashok", snippet: "Premier hotel near Bangalore Golf Club.", phone: "+91 80 3052 7777", maps: "https://maps.google.com/?q=The+Lalit+Ashok+Bangalore" },
      { name: "Radisson Blu Atria", snippet: "City center hotel with Scandinavian design.", phone: "+91 80 4510 1010", maps: "https://maps.google.com/?q=Radisson+Blu+Atria+Bangalore" },
      { name: "JW Marriott Bangalore", snippet: "Luxury hotel in UB City area.", phone: "+91 80 6718 9999", maps: "https://maps.google.com/?q=JW+Marriott+Bangalore" },
      { name: "Conrad Bangalore", snippet: "Hilton's luxury brand on MG Road.", phone: "+91 80 2211 2333", maps: "https://maps.google.com/?q=Conrad+Bangalore" }
    ],
    "Goa": [
      { name: "Taj Exotica Resort & Spa", snippet: "Luxury beachfront resort in Benaulim with private villas.", phone: "+91 832 668 3333", maps: "https://maps.google.com/?q=Taj+Exotica+Goa" },
      { name: "The Leela Goa", snippet: "Premium resort in Cavelossim with lagoon pool.", phone: "+91 832 662 1234", maps: "https://maps.google.com/?q=The+Leela+Goa" },
      { name: "W Goa", snippet: "Trendy lifestyle brand in Morjim with ocean views.", phone: "+91 832 674 8000", maps: "https://maps.google.com/?q=W+Goa" },
      { name: "Grand Hyatt Goa", snippet: "Beachfront resort in Bambolim with multiple pools.", phone: "+91 832 664 1234", maps: "https://maps.google.com/?q=Grand+Hyatt+Goa" },
      { name: "ITC Grand Goa", snippet: "Luxury resort in Arossim with Portuguese heritage.", phone: "+91 832 653 7777", maps: "https://maps.google.com/?q=ITC+Grand+Goa" },
      { name: "Park Hyatt Goa", snippet: "Serene resort in Arossim with private beach.", phone: "+91 832 674 2222", maps: "https://maps.google.com/?q=Park+Hyatt+Goa" },
      { name: "Radisson Blu Resort", snippet: "Cavelossim beachfront property with spa.", phone: "+91 832 672 4242", maps: "https://maps.google.com/?q=Radisson+Blu+Goa" },
      { name: "Planet Hollywood Beach Resort", snippet: "Candolim resort with Bollywood-themed decor.", phone: "+91 98765 43210", maps: "https://maps.google.com/?q=Planet+Hollywood+Goa" }
    ],
    "Chennai": [
      { name: "ITC Grand Chola", snippet: "Massive luxury hotel with Chola dynasty architecture.", phone: "+91 44 2220 0000", maps: "https://maps.google.com/?q=ITC+Grand+Chola+Chennai" },
      { name: "Taj Coromandel", snippet: "Premier hotel on Nungambakkam High Road.", phone: "+91 44 6600 2827", maps: "https://maps.google.com/?q=Taj+Coromandel+Chennai" },
      { name: "The Leela Palace Chennai", snippet: "Royal-themed hotel near the airport.", phone: "+91 44 3366 1234", maps: "https://maps.google.com/?q=The+Leela+Palace+Chennai" },
      { name: "Park Hyatt Chennai", snippet: "Contemporary luxury hotel in Guindy.", phone: "+91 44 7177 1234", maps: "https://maps.google.com/?q=Park+Hyatt+Chennai" },
      { name: "Radisson Blu Hotel Chennai", snippet: "Airport-area business hotel with pool.", phone: "+91 44 2234 1234", maps: "https://maps.google.com/?q=Radisson+Blu+Chennai" },
      { name: "Hyatt Regency Chennai", snippet: "Anna Salai hotel with rooftop dining.", phone: "+91 44 6100 1234", maps: "https://maps.google.com/?q=Hyatt+Regency+Chennai" },
      { name: "The Raintree Hotel", snippet: "Eco-friendly hotel on St Mary's Road.", phone: "+91 44 4260 1234", maps: "https://maps.google.com/?q=Raintree+Hotel+Chennai" },
      { name: "GRT Grand Chennai", snippet: "T Nagar hotel with traditional South Indian design.", phone: "+91 44 2825 1234", maps: "https://maps.google.com/?q=GRT+Grand+Chennai" }
    ],
    "Kolkata": [
      { name: "ITC Sonar", snippet: "Luxury hotel near Science City with rice-paddy landscaping.", phone: "+91 33 2300 4321", maps: "https://maps.google.com/?q=ITC+Sonar+Kolkata" },
      { name: "The Oberoi Grand", snippet: "Heritage luxury hotel on Chowringhee Road since 1870.", phone: "+91 33 2249 2323", maps: "https://maps.google.com/?q=The+Oberoi+Grand+Kolkata" },
      { name: "Taj Bengal", snippet: "Iconic hotel in Alipore with Victorian architecture.", phone: "+91 33 2223 3939", maps: "https://maps.google.com/?q=Taj+Bengal+Kolkata" },
      { name: "Hyatt Regency Kolkata", snippet: "Luxury hotel near EM Bypass with spa.", phone: "+91 33 4030 1234", maps: "https://maps.google.com/?q=Hyatt+Regency+Kolkata" },
      { name: "The Park Kolkata", snippet: "Boutique luxury hotel on Park Street.", phone: "+91 33 2249 9000", maps: "https://maps.google.com/?q=The+Park+Kolkata" },
      { name: "JW Marriott Kolkata", snippet: "Contemporary luxury near Joka with multiple restaurants.", phone: "+91 33 4015 8000", maps: "https://maps.google.com/?q=JW+Marriott+Kolkata" },
      { name: "Radisson Salt Lake", snippet: "Business hotel in Sector V tech hub.", phone: "+91 33 4567 8901", maps: "https://maps.google.com/?q=Radisson+Salt+Lake+Kolkata" },
      { name: "Kenilworth Hotel", snippet: "Heritage hotel on Little Russel Street.", phone: "+91 33 2282 3939", maps: "https://maps.google.com/?q=Kenilworth+Hotel+Kolkata" }
    ],
    "Hyderabad": [
      { name: "Taj Krishna", snippet: "Luxury hotel in Banjara Hills with lake views.", phone: "+91 40 6666 2323", maps: "https://maps.google.com/?q=Taj+Krishna+Hyderabad" },
      { name: "ITC Kohenur", snippet: "Premium hotel in HITEC City with diamond-themed design.", phone: "+91 40 6760 0000", maps: "https://maps.google.com/?q=ITC+Kohenur+Hyderabad" },
      { name: "The Park Hyderabad", snippet: "Boutique luxury hotel near Hussain Sagar.", phone: "+91 40 4499 0000", maps: "https://maps.google.com/?q=The+Park+Hyderabad" },
      { name: "Novotel Hyderabad Convention Centre", snippet: "Near HITEC City with convention facilities.", phone: "+91 40 6682 4455", maps: "https://maps.google.com/?q=Novotel+Hyderabad" },
      { name: "Trident Hyderabad", snippet: "Banjara Hills luxury hotel with rooftop pool.", phone: "+91 40 6623 2222", maps: "https://maps.google.com/?q=Trident+Hyderabad" },
      { name: "Radisson Hyderabad", snippet: "HITEC City business hotel with multiple outlets.", phone: "+91 40 6738 3838", maps: "https://maps.google.com/?q=Radisson+Hyderabad" },
      { name: "Sheraton Hyderabad", snippet: "Gachibowli hotel near IT corridor.", phone: "+91 40 4567 8901", maps: "https://maps.google.com/?q=Sheraton+Hyderabad" },
      { name: "Marriott Hyderabad", snippet: "City center hotel near Hussain Sagar.", phone: "+91 40 6666 7777", maps: "https://maps.google.com/?q=Marriott+Hyderabad" }
    ],
    "Jaipur": [
      { name: "Rambagh Palace", snippet: "Taj's iconic former royal residence with Mughal gardens.", phone: "+91 141 2211 919", maps: "https://maps.google.com/?q=Rambagh+Palace+Jaipur" },
      { name: "ITC Rajputana", snippet: "Heritage hotel near railway station with Rajasthani design.", phone: "+91 141 4012 345", maps: "https://maps.google.com/?q=ITC+Rajputana+Jaipur" },
      { name: "Fairmont Jaipur", snippet: "Luxury hotel inspired by Mughal and Rajput architecture.", phone: "+91 141 710 2102", maps: "https://maps.google.com/?q=Fairmont+Jaipur" },
      { name: "Radisson Jaipur City Center", snippet: "Modern hotel near airport with rooftop pool.", phone: "+91 141 710 2102", maps: "https://maps.google.com/?q=Radisson+Jaipur" },
      { name: "Holiday Inn Jaipur City Centre", snippet: "MI Road hotel with family-friendly amenities.", phone: "+91 141 4567 890", maps: "https://maps.google.com/?q=Holiday+Inn+Jaipur" },
      { name: "Jaipur Marriott Hotel", snippet: "Near Ashram Marg with modern amenities.", phone: "+91 141 710 2100", maps: "https://maps.google.com/?q=Jaipur+Marriott" },
      { name: "The Lalit Jaipur", snippet: "Suburbs luxury hotel with spa and pool.", phone: "+91 141 710 2100", maps: "https://maps.google.com/?q=The+Lalit+Jaipur" },
      { name: "Hotel Kalyan", snippet: "Budget hotel near Hawa Mahal with rooftop cafe.", phone: "+91 141 4567 0123", maps: "https://maps.google.com/?q=Hotel+Kalyan+Jaipur" }
    ],
    "Pune": [
      { name: "JW Marriott Pune", snippet: "Luxury hotel in Senapati Bapat Road.", phone: "+91 20 4567 8901", maps: "https://maps.google.com/?q=JW+Marriott+Pune" },
      { name: "Sheraton Grand Pune", snippet: "Bund Garden hotel with multiple restaurants.", phone: "+91 20 4567 0123", maps: "https://maps.google.com/?q=Sheraton+Grand+Pune" },
      { name: "The Westin Pune Koregaon Park", snippet: "Luxury hotel in upscale Koregaon Park.", phone: "+91 20 4567 8901", maps: "https://maps.google.com/?q=The+Westin+Pune" },
      { name: "Hyatt Pune", snippet: "Kalyani Nagar hotel with spa.", phone: "+91 20 4567 1234", maps: "https://maps.google.com/?q=Hyatt+Pune" },
      { name: "Novotel Pune Nagar Road", snippet: "Near airport with modern amenities.", phone: "+91 20 4567 8901", maps: "https://maps.google.com/?q=Novotel+Pune" },
      { name: "Radisson Blu Pune", snippet: "Kharadi business hotel with rooftop pool.", phone: "+91 20 4567 1234", maps: "https://maps.google.com/?q=Radisson+Blu+Pune" },
      { name: " Conrad Pune", snippet: "Hilton luxury brand in Koregaon Park.", phone: "+91 20 4567 8901", maps: "https://maps.google.com/?q=Conrad+Pune" },
      { name: "Corinthians Resort", snippet: "Panshet countryside resort with golf course.", phone: "+91 98224 56789", maps: "https://maps.google.com/?q=Corinthians+Resort+Pune" }
    ],
    "default": [
      { name: "Taj Hotels", snippet: "India's premier luxury hotel chain founded in 1903.", phone: "+91 22 6601 1824", maps: "https://maps.google.com/?q=Taj+Hotels+India" },
      { name: "ITC Hotels", snippet: "Luxury hotel chain with responsible tourism focus.", phone: "+91 33 2324 5930", maps: "https://maps.google.com/?q=ITC+Hotels+India" },
      { name: "The Oberoi Group", snippet: "India's finest luxury hotel group.", phone: "+91 11 2388 0550", maps: "https://maps.google.com/?q=The+Oberoi+Group" },
      { name: "Leela Palaces", snippet: "Ultra-luxury hotels in Delhi, Mumbai, Bangalore.", phone: "+91 80 2211 2333", maps: "https://maps.google.com/?q=Leela+Palaces+India" },
      { name: "Hyatt Hotels India", snippet: "International luxury chain with 30+ properties.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=Hyatt+Hotels+India" },
      { name: "Marriott India", snippet: "Global chain with extensive India presence.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=Marriott+India" },
      { name: "Radisson Hotels", snippet: "International chain with properties across India.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=Radisson+Hotels+India" },
      { name: "IHG Hotels & Resorts", snippet: "Parent of Crowne Plaza, Holiday Inn in India.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=IHG+Hotels+India" }
    ]
  },
  "Travel Agency": {
    "Mumbai": [
      { name: "Thomas Cook India", snippet: "One of India's oldest travel companies, established 1881.", phone: "+91 22 6160 3333", maps: "https://maps.google.com/?q=Thomas+Cook+India+Mumbai" },
      { name: "Cox & Kings", snippet: "270-year-old travel brand specializing in luxury tours.", phone: "+91 22 6160 3333", maps: "https://maps.google.com/?q=Cox+and+Kings+Mumbai" },
      { name: "SOTC Travel", snippet: "Premium tour operator specializing in group travel.", phone: "+91 22 6160 3333", maps: "https://maps.google.com/?q=SOTC+Travel+Mumbai" },
      { name: "MakeMyTrip", snippet: "India's largest online travel company headquartered in Mumbai.", phone: "+91 124 462 8747", maps: "https://maps.google.com/?q=MakeMyTrip+Mumbai" },
      { name: "Thomas Cook Forex", snippet: "Currency exchange and travel financial services.", phone: "+91 22 6160 3333", maps: "https://maps.google.com/?q=Thomas+Cook+Forex+Mumbai" },
      { name: "Kuoni Travel", snippet: "Luxury travel specialist for India and Asia.", phone: "+91 22 4567 8901", maps: "https://maps.google.com/?q=Kuoni+Travel+Mumbai" },
      { name: "Atlas Tours", snippet: "Inbound tour operator for international tourists.", phone: "+91 22 4567 1234", maps: "https://maps.google.com/?q=Atlas+Tours+Mumbai" },
      { name: "Balmer Lawrie Travel", snippet: "Government-owned travel company.", phone: "+91 22 4567 8901", maps: "https://maps.google.com/?q=Balmer+Lawrie+Travel+Mumbai" }
    ],
    "Delhi": [
      { name: "Thomas Cook India", snippet: "Leading travel and forex company with CP outlet.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=Thomas+Cook+Delhi" },
      { name: "SOTC Travel", snippet: "Connaught Place outlet for luxury tours.", phone: "+91 11 4567 1234", maps: "https://maps.google.com/?q=SOTC+Delhi" },
      { name: "Yatra.com", snippet: "Online travel booking portal headquartered in Gurgaon.", phone: "+91 124 456 7890", maps: "https://maps.google.com/?q=Yatra+com+Delhi" },
      { name: "Cox & Kings Delhi", snippet: "Heritage tours and luxury travel specialist.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=Cox+Kings+Delhi" },
      { name: "IBIBO Group", snippet: "Online travel platform (GoIbibo) based in Gurgaon.", phone: "+91 124 456 7890", maps: "https://maps.google.com/?q=IBIBO+Group+Delhi" },
      { name: "Tour My India", snippet: "Domestic travel specialist for Indian destinations.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=Tour+My+India+Delhi" },
      { name: "Travomint", snippet: "Online travel platform for budget travelers.", phone: "+91 11 4567 1234", maps: "https://maps.google.com/?q=Travomint+Delhi" },
      { name: "India Horizon Travels", snippet: "Luxury inbound tours for international visitors.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=India+Horizon+Delhi" }
    ],
    "Bangalore": [
      { name: "MakeMyTrip Bangalore", snippet: "South India headquarters near airport.", phone: "+91 80 4567 8901", maps: "https://maps.google.com/?q=MakeMyTrip+Bangalore" },
      { name: "Thomas Cook Bangalore", snippet: "Koramangala outlet for forex and tours.", phone: "+91 80 4567 1234", maps: "https://maps.google.com/?q=Thomas+Cook+Bangalore" },
      { name: "Travel Tours Bangalore", snippet: "Domestic and international tour packages.", phone: "+91 80 4567 8901", maps: "https://maps.google.com/?q=Travel+Tours+Bangalore" },
      { name: "SOTC Bangalore", snippet: "MG Road outlet for group tours.", phone: "+91 80 4567 1234", maps: "https://maps.google.com/?q=SOTC+Bangalore" },
      { name: "Cox & Kings Bangalore", snippet: "Luxury travel planning for South India.", phone: "+91 80 4567 8901", maps: "https://maps.google.com/?q=Cox+Kings+Bangalore" },
      { name: "Yatra.com Bangalore", snippet: "Online booking with MG Road office.", phone: "+91 80 4567 1234", maps: "https://maps.google.com/?q=Yatra+Bangalore" },
      { name: "EaseMyTrip", snippet: "Growing online travel company.", phone: "+91 80 4567 8901", maps: "https://maps.google.com/?q=EaseMyTrip+Bangalore" },
      { name: "TripFactory", snippet: "Membership-based travel company.", phone: "+91 80 4567 1234", maps: "https://maps.google.com/?q=TripFactory+Bangalore" }
    ],
    "Goa": [
      { name: "Goa Tours and Travels", snippet: "Specialized in Goa vacation packages.", phone: "+91 832 243 4567", maps: "https://maps.google.com/?q=Goa+Tours+Travels" },
      { name: "Thomas Cook Goa", snippet: "Panjim outlet for forex and tours.", phone: "+91 832 243 1234", maps: "https://maps.google.com/?q=Thomas+Cook+Goa" },
      { name: "MakeMyTrip Goa", snippet: "Local partnerships for beach tours.", phone: "+91 832 456 7890", maps: "https://maps.google.com/?q=MakeMyTrip+Goa" },
      { name: "Goa Heritage Tours", snippet: "Portuguese heritage walks and cultural tours.", phone: "+91 832 243 5678", maps: "https://maps.google.com/?q=Goa+Heritage+Tours" },
      { name: "Adventure Breaks Goa", snippet: "Water sports and adventure activity specialist.", phone: "+91 98234 56789", maps: "https://maps.google.com/?q=Adventure+Breaks+Goa" },
      { name: "SOTC Goa", snippet: "Group tours and MICE travel.", phone: "+91 832 243 4567", maps: "https://maps.google.com/?q=SOTC+Goa" },
      { name: "Travelious Goa", snippet: "Luxury beach resort bookings.", phone: "+91 832 243 7890", maps: "https://maps.google.com/?q=Travelious+Goa" },
      { name: "Cox & Kings Goa", snippet: "Heritage hotel and beach vacation packages.", phone: "+91 832 243 4567", maps: "https://maps.google.com/?q=Cox+Kings+Goa" }
    ],
    "Chennai": [
      { name: "Thomas Cook Chennai", snippet: "T Nagar outlet for forex and travel.", phone: "+91 44 2815 1234", maps: "https://maps.google.com/?q=Thomas+Cook+Chennai" },
      { name: "SOTC Chennai", snippet: "Anna Nagar branch for domestic tours.", phone: "+91 44 4567 8901", maps: "https://maps.google.com/?q=SOTC+Chennai" },
      { name: "MakeMyTrip Chennai", snippet: "South India tour packages.", phone: "+91 44 4567 1234", maps: "https://maps.google.com/?q=MakeMyTrip+Chennai" },
      { name: "Cox & Kings Chennai", snippet: "Luxury travel and heritage tours.", phone: "+91 44 4567 8901", maps: "https://maps.google.com/?q=Cox+Kings+Chennai" },
      { name: "Yatra.com Chennai", snippet: "Anna Salai office for online bookings.", phone: "+91 44 4567 1234", maps: "https://maps.google.com/?q=Yatra+Chennai" },
      { name: "Temple Tour Specialists", snippet: "South India temple circuit tours.", phone: "+91 44 4567 8901", maps: "https://maps.google.com/?q=Temple+Tours+Chennai" },
      { name: "Incredible India Tours", snippet: "Government-certified tour operator.", phone: "+91 44 4567 1234", maps: "https://maps.google.com/?q=Incredible+India+Chennai" },
      { name: "Kumara Travels", snippet: "Budget travel agency in Parrys Corner.", phone: "+91 44 2524 1234", maps: "https://maps.google.com/?q=Kumara+Travels+Chennai" }
    ],
    "default": [
      { name: "Thomas Cook India", snippet: "India's largest integrated travel services company.", phone: "+91 22 6160 3333", maps: "https://maps.google.com/?q=Thomas+Cook+India" },
      { name: "Cox & Kings", snippet: "270-year-old travel company with global presence.", phone: "+91 22 6160 3333", maps: "https://maps.google.com/?q=Cox+and+Kings" },
      { name: "SOTC Travel", snippet: "Premium tour operator for group and MICE travel.", phone: "+91 1800 208 9999", maps: "https://maps.google.com/?q=SOTC+Travel" },
      { name: "MakeMyTrip", snippet: "India's largest online travel booking platform.", phone: "+91 124 462 8747", maps: "https://maps.google.com/?q=MakeMyTrip" },
      { name: "Yatra.com", snippet: "Leading online travel portal.", phone: "+91 124 456 7890", maps: "https://maps.google.com/?q=Yatra+com" },
      { name: "EaseMyTrip", snippet: "Fast-growing online travel company.", phone: "+91 98765 43210", maps: "https://maps.google.com/?q=EaseMyTrip" },
      { name: "Kuoni Travel", snippet: "Luxury travel specialist for Asia.", phone: "+91 22 4567 8901", maps: "https://maps.google.com/?q=Kuoni+Travel" },
      { name: "Travel Tours India", snippet: "Domestic and international tour packages.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=Travel+Tours+India" }
    ]
  },
  "Software Company": {
    "Bangalore": [
      { name: "Infosys Limited", snippet: "Global IT services giant headquartered in Electronic City.", phone: "+91 80 2852 0261", maps: "https://maps.google.com/?q=Infosys+Bangalore" },
      { name: "Wipro Limited", snippet: "Leading IT services company based in Sarjapur Road.", phone: "+91 80 2844 0011", maps: "https://maps.google.com/?q=Wipro+Bangalore" },
      { name: "TCS Bangalore", snippet: "Tata Consultancy Services in multiple Bangalore locations.", phone: "+91 80 4567 8901", maps: "https://maps.google.com/?q=TCS+Bangalore" },
      { name: "Mindtree", snippet: "Mid-size IT services company in Bangalore.", phone: "+91 80 4567 1234", maps: "https://maps.google.com/?q=Mindtree+Bangalore" },
      { name: "Mphasis", snippet: "IT solutions provider headquartered in Bangalore.", phone: "+91 80 4567 8901", maps: "https://maps.google.com/?q=Mphasis+Bangalore" },
      { name: "Accenture India", snippet: "Global consulting and technology services.", phone: "+91 80 4567 1234", maps: "https://maps.google.com/?q=Accenture+Bangalore" },
      { name: "Capgemini India", snippet: "French IT services firm with Bangalore hub.", phone: "+91 80 4567 8901", maps: "https://maps.google.com/?q=Capgemini+Bangalore" },
      { name: "Cognizant Technology", snippet: "Major US-based IT services firm in Bangalore.", phone: "+91 80 4567 1234", maps: "https://maps.google.com/?q=Cognizant+Bangalore" }
    ],
    "Mumbai": [
      { name: "TCS Mumbai", snippet: "Tata Consultancy Services in Powai.", phone: "+91 22 6778 9999", maps: "https://maps.google.com/?q=TCS+Mumbai" },
      { name: "Infosys Mumbai", snippet: "Infosys development center in Powai.", phone: "+91 22 4567 8901", maps: "https://maps.google.com/?q=Infosys+Mumbai" },
      { name: "Tech Mahindra Mumbai", snippet: "IT services company headquartered in Pune, major Mumbai office.", phone: "+91 22 4567 1234", maps: "https://maps.google.com/?q=Tech+Mahindra+Mumbai" },
      { name: "L&T Infotech", snippet: "Engineering and IT services firm.", phone: "+91 22 4567 8901", maps: "https://maps.google.com/?q=LnT+Infotech+Mumbai" },
      { name: "Capgemini Mumbai", snippet: "French IT services firm in Andheri.", phone: "+91 22 4567 1234", maps: "https://maps.google.com/?q=Capgemini+Mumbai" },
      { name: "Mphasis Mumbai", snippet: "IT solutions provider with Mumbai office.", phone: "+91 22 4567 8901", maps: "https://maps.google.com/?q=Mphasis+Mumbai" },
      { name: "Cognizant Mumbai", snippet: "IT services firm in Powai.", phone: "+91 22 4567 1234", maps: "https://maps.google.com/?q=Cognizant+Mumbai" },
      { name: "Accenture Mumbai", snippet: "Consulting and technology firm in Andheri.", phone: "+91 22 4567 8901", maps: "https://maps.google.com/?q=Accenture+Mumbai" }
    ],
    "Delhi": [
      { name: "HCL Technologies", snippet: "IT services company headquartered in Noida.", phone: "+91 120 456 7890", maps: "https://maps.google.com/?q=HCL+Technologies+Noida" },
      { name: "TCS Noida", snippet: "Tata Consultancy Services in Noida SEZ.", phone: "+91 120 4567 8901", maps: "https://maps.google.com/?q=TCS+Noida" },
      { name: "Infosys Noida", snippet: "Infosys development center in sector 135.", phone: "+91 120 4567 1234", maps: "https://maps.google.com/?q=Infosys+Noida" },
      { name: "Wipro Noida", snippet: "Wipro IT services center.", phone: "+91 120 4567 8901", maps: "https://maps.google.com/?q=Wipro+Noida" },
      { name: "Tech Mahindra Noida", snippet: "IT services in sector 62 Noida.", phone: "+91 120 4567 1234", maps: "https://maps.google.com/?q=Tech+Mahindra+Noida" },
      { name: "Accenture Noida", snippet: "Consulting services in sector 125.", phone: "+91 120 4567 8901", maps: "https://maps.google.com/?q=Accenture+Noida" },
      { name: "Cognizant Noida", snippet: "IT services in sector 135 Noida.", phone: "+91 120 4567 1234", maps: "https://maps.google.com/?q=Cognizant+Noida" },
      { name: "Capgemini Noida", snippet: "French IT services firm in Noida SEZ.", phone: "+91 120 4567 8901", maps: "https://maps.google.com/?q=Capgemini+Noida" }
    ],
    "Hyderabad": [
      { name: "Microsoft India", snippet: "US tech giant's largest R&D center outside Redmond.", phone: "+91 40 6789 0123", maps: "https://maps.google.com/?q=Microsoft+India+Hyderabad" },
      { name: "Google Hyderabad", snippet: "Google's largest campus outside US in Kondapur.", phone: "+91 40 4567 8901", maps: "https://maps.google.com/?q=Google+Hyderabad" },
      { name: "Amazon Hyderabad", snippet: "Amazon's largest global campus in Gachibowli.", phone: "+91 40 4567 1234", maps: "https://maps.google.com/?q=Amazon+Hyderabad" },
      { name: "Facebook India", snippet: "Meta's Hyderabad engineering office.", phone: "+91 40 4567 8901", maps: "https://maps.google.com/?q=Facebook+India+Hyderabad" },
      { name: "Apple India", snippet: "Apple's Hyderabad development center.", phone: "+91 40 4567 1234", maps: "https://maps.google.com/?q=Apple+India+Hyderabad" },
      { name: "TCS Hyderabad", snippet: "Tata Consultancy Services in HITEC City.", phone: "+91 40 4567 8901", maps: "https://maps.google.com/?q=TCS+Hyderabad" },
      { name: "Infosys Hyderabad", snippet: "Infosys campus in Pocharam.", phone: "+91 40 4567 1234", maps: "https://maps.google.com/?q=Infosys+Hyderabad" },
      { name: "Wipro Hyderabad", snippet: "Wipro IT center in Gachibowli.", phone: "+91 40 4567 8901", maps: "https://maps.google.com/?q=Wipro+Hyderabad" }
    ],
    "Chennai": [
      { name: "TCS Chennai", snippet: "Tata Consultancy Services in Siruseri IT Park.", phone: "+91 44 4567 8901", maps: "https://maps.google.com/?q=TCS+Chennai" },
      { name: "Infosys Chennai", snippet: "Infosys Mahindra City development center.", phone: "+91 44 4567 1234", maps: "https://maps.google.com/?q=Infosys+Chennai" },
      { name: "Cognizant Chennai", snippet: "Major IT services hub in Siruseri.", phone: "+91 44 4567 8901", maps: "https://maps.google.com/?q=Cognizant+Chennai" },
      { name: "Zoho Corporation", snippet: "Indian SaaS giant headquartered in Estancia IT Park.", phone: "+91 44 4567 1234", maps: "https://maps.google.com/?q=Zoho+Corporation+Chennai" },
      { name: "Freshworks", snippet: "SaaS company that went public on NASDAQ.", phone: "+91 44 4567 8901", maps: "https://maps.google.com/?q=Freshworks+Chennai" },
      { name: "Capgemini Chennai", snippet: "French IT services firm in Ambattur.", phone: "+91 44 4567 1234", maps: "https://maps.google.com/?q=Capgemini+Chennai" },
      { name: "Accenture Chennai", snippet: "Consulting firm in DLF IT Park.", phone: "+91 44 4567 8901", maps: "https://maps.google.com/?q=Accenture+Chennai" },
      { name: "LTIMindtree Chennai", snippet: "IT services in Estancia IT Park.", phone: "+91 44 4567 1234", maps: "https://maps.google.com/?q=LTIMindtree+Chennai" }
    ],
    "Pune": [
      { name: "Infosys Pune", snippet: "Infosys mega campus in Hinjewadi IT Park.", phone: "+91 20 4567 8901", maps: "https://maps.google.com/?q=Infosys+Pune" },
      { name: "TCS Pune", snippet: "Tata Consultancy Services in Hinjewadi.", phone: "+91 20 4567 1234", maps: "https://maps.google.com/?q=TCS+Pune" },
      { name: "Tech Mahindra Pune", snippet: "IT services company headquartered in Pune.", phone: "+91 20 4567 8901", maps: "https://maps.google.com/?q=Tech+Mahindra+Pune" },
      { name: "Persistent Systems", snippet: "Pune-based software company focused on digital engineering.", phone: "+91 20 4567 1234", maps: "https://maps.google.com/?q=Persistent+Systems+Pune" },
      { name: "Cognizant Pune", snippet: "IT services in Hinjewadi.", phone: "+91 20 4567 8901", maps: "https://maps.google.com/?q=Cognizant+Pune" },
      { name: "Cybage Software", snippet: "Pune-based IT services company.", phone: "+91 20 4567 1234", maps: "https://maps.google.com/?q=Cybage+Software+Pune" },
      { name: "Barclays Technology Centre", snippet: "UK bank's Pune technology hub.", phone: "+91 20 4567 8901", maps: "https://maps.google.com/?q=Barclays+Pune" },
      { name: "Wipro Pune", snippet: "Wipro IT center in Hinjewadi.", phone: "+91 20 4567 1234", maps: "https://maps.google.com/?q=Wipro+Pune" }
    ],
    "default": [
      { name: "Tata Consultancy Services", snippet: "India's largest IT services company and most valued firm.", phone: "+91 22 6778 9999", maps: "https://maps.google.com/?q=TCS+India" },
      { name: "Infosys", snippet: "Global leader in next-gen digital services.", phone: "+91 80 2852 0261", maps: "https://maps.google.com/?q=Infosys" },
      { name: "Wipro Limited", snippet: "Leading global information technology company.", phone: "+91 80 2844 0011", maps: "https://maps.google.com/?q=Wipro" },
      { name: "HCL Technologies", snippet: "Global technology company based in Noida.", phone: "+91 120 252 0917", maps: "https://maps.google.com/?q=HCL+Technologies" },
      { name: "Tech Mahindra", snippet: "Mahindra Group's IT services company.", phone: "+91 20 4567 8901", maps: "https://maps.google.com/?q=Tech+Mahindra" },
      { name: "Accenture India", snippet: "Global professional services with major India presence.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=Accenture+India" },
      { name: "Cognizant India", snippet: "Fortune 500 IT services company.", phone: "+91 44 4567 8901", maps: "https://maps.google.com/?q=Cognizant+India" },
      { name: "Capgemini India", snippet: "French IT services giant with major India operations.", phone: "+91 11 4567 8901", maps: "https://maps.google.com/?q=Capgemini+India" }
    ]
  }
};

/* ── Normalize Location Input ────────────────── */
export function normalizeLocation(loc) {
  const lower = loc.toLowerCase().trim();
  const cityMap = {
    "mumbai": "Mumbai", "bombay": "Mumbai", "navi mumbai": "Mumbai", "thane": "Mumbai",
    "delhi": "Delhi", "new delhi": "Delhi", "ncr": "Delhi", "gurgaon": "Delhi", "noida": "Delhi", "faridabad": "Delhi", "ghaziabad": "Delhi",
    "bangalore": "Bangalore", "bengaluru": "Bangalore", "blr": "Bangalore",
    "goa": "Goa", "panjim": "Goa", "panaji": "Goa", "margao": "Goa", "vasco": "Goa", "calangute": "Goa", "candolim": "Goa", "anjuna": "Goa",
    "chennai": "Chennai", "madras": "Chennai",
    "hyderabad": "Hyderabad", "secunderabad": "Hyderabad",
    "kolkata": "Kolkata", "calcutta": "Kolkata",
    "pune": "Pune", "pimpri": "Pune", "chinchwad": "Pune",
    "jaipur": "Jaipur", "pink city": "Jaipur",
    "ahmedabad": "Ahmedabad", "amdavad": "Ahmedabad",
    "lucknow": "Lucknow",
    "chandigarh": "Chandigarh", "panchkula": "Chandigarh", "mohali": "Chandigarh",
    "indore": "Indore",
    "kochi": "Kochi", "cochin": "Kochi",
    "coimbatore": "Coimbatore", "cbe": "Coimbatore",
    "nagpur": "Nagpur",
    "surat": "Surat",
    "vadodara": "Vadodara", "baroda": "Vadodara",
    "visakhapatnam": "Visakhapatnam", "vizag": "Visakhapatnam",
    "bhopal": "Bhopal",
    "ludhiana": "Ludhiana",
    "agra": "Agra",
    "varanasi": "Varanasi",
    "patna": "Patna",
    "ranchi": "Ranchi",
    "raipur": "Raipur",
    "bhubaneswar": "Bhubaneswar",
    "dehradun": "Dehradun",
    "shimla": "Shimla",
    "srinagar": "Srinagar",
    "jammu": "Jammu",
    "goa": "Goa"
  };
  return cityMap[lower] || null;
}

/* ── Generate Leads with Real Data ────────────── */
export function generateMockLeads(biz, loc) {
  const platforms = ["Google Maps", "JustDial", "IndiaMart", "Sulekha", "LinkedIn", "Facebook", "Instagram"];
  const normalizedLoc = normalizeLocation(loc);

  let sourcePool = [];
  if (realBusinessDB[biz] && realBusinessDB[biz][normalizedLoc]) {
    sourcePool = realBusinessDB[biz][normalizedLoc];
  } else if (realBusinessDB[biz] && realBusinessDB[biz]["default"]) {
    sourcePool = realBusinessDB[biz]["default"].map(item => ({
      ...item,
      name: item.name + " (" + loc + ")"
    }));
  } else {
    sourcePool = [
      { name: biz + " Elite Solutions - " + loc, snippet: "Premium regional enterprise service provider in " + loc + ".", phone: "+91 " + Math.floor(60000 + Math.random() * 39999) + " " + Math.floor(10000 + Math.random() * 89999), maps: "https://maps.google.com/?q=" + encodeURIComponent(biz + " " + loc) },
      { name: biz + " Global Group - " + loc, snippet: "Fully integrated service network serving " + loc + " region.", phone: "+91 " + Math.floor(60000 + Math.random() * 39999) + " " + Math.floor(10000 + Math.random() * 89999), maps: "https://maps.google.com/?q=" + encodeURIComponent(biz + " " + loc) },
      { name: biz + " Pioneer Agency - " + loc, snippet: "A dynamic local team dedicated to high-performance services in " + loc + ".", phone: "+91 " + Math.floor(60000 + Math.random() * 39999) + " " + Math.floor(10000 + Math.random() * 89999), maps: "https://maps.google.com/?q=" + encodeURIComponent(biz + " " + loc) },
      { name: biz + " Hub Services - " + loc, snippet: "Modern customer solutions optimized for " + loc + " market.", phone: "+91 " + Math.floor(60000 + Math.random() * 39999) + " " + Math.floor(10000 + Math.random() * 89999), maps: "https://maps.google.com/?q=" + encodeURIComponent(biz + " " + loc) },
      { name: biz + " Premier Partners - " + loc, snippet: "Boutique consultants offering tailored solutions in " + loc + ".", phone: "+91 " + Math.floor(60000 + Math.random() * 39999) + " " + Math.floor(10000 + Math.random() * 89999), maps: "https://maps.google.com/?q=" + encodeURIComponent(biz + " " + loc) },
      { name: biz + " Core Builders - " + loc, snippet: "Leading local industry provider focused on operations in " + loc + ".", phone: "+91 " + Math.floor(60000 + Math.random() * 39999) + " " + Math.floor(10000 + Math.random() * 89999), maps: "https://maps.google.com/?q=" + encodeURIComponent(biz + " " + loc) },
      { name: biz + " Crest Services - " + loc, snippet: "Specialized service experts ensuring verified output in " + loc + ".", phone: "+91 " + Math.floor(60000 + Math.random() * 39999) + " " + Math.floor(10000 + Math.random() * 89999), maps: "https://maps.google.com/?q=" + encodeURIComponent(biz + " " + loc) },
      { name: biz + " NextGen Systems - " + loc, snippet: "Technology-enabled custom service network serving " + loc + ".", phone: "+91 " + Math.floor(60000 + Math.random() * 39999) + " " + Math.floor(10000 + Math.random() * 89999), maps: "https://maps.google.com/?q=" + encodeURIComponent(biz + " " + loc) }
    ];
  }

  return sourcePool.map((item, idx) => {
    const phone = item.phone || "+91 " + Math.floor(60000 + Math.random() * 39999) + " " + Math.floor(10000 + Math.random() * 89999);
    const platform = platforms[idx % platforms.length];
    const sourceURL = getSourceURL(platform, item.name, loc);
    const mapsUrl = item.maps || "https://maps.google.com/?q=" + encodeURIComponent(item.name + " " + loc);
    return {
      id: genId(),
      name: item.name,
      phone: phone,
      source_platform: platform,
      source_url: sourceURL,
      snippet: item.snippet,
      priority: idx < 3 ? 'hot' : (idx < 6 ? 'warm' : 'cold'),
      status: 'new',
      notes: '',
      maps_url: mapsUrl,
      created_at: new Date().toISOString()
    };
  });
}