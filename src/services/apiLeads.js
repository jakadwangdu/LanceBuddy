// LanceBuddy Real-World Leads via Nominatim & Overpass API

const getTagQuery = (biz) => {
  const map = {
    'Cafe': '["amenity"="cafe"]',
    'Hotel': '["tourism"="hotel"]',
    'Travel Agency': '["shop"="travel_agency"]',
    'Software Company': '["office"="it"]',
    'Restaurant': '["amenity"="restaurant"]',
    'Gym': '["leisure"="fitness_centre"]',
    'Salon': '["shop"="beauty"]',
  };
  return map[biz] || `["name"~"${biz}",i]`;
};

export const fetchRealworldLeads = async (biz, loc) => {
  try {
    // 1. Get Lat/Lon of location
    const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1`, {
      headers: { 'User-Agent': 'LanceBuddy/1.0' }
    });
    if (!nomRes.ok) throw new Error('Failed to resolve location');
    const nomData = await nomRes.json();
    if (!nomData.length) throw new Error('Location not found');
    
    const { lat, lon } = nomData[0];
    
    // 2. Fetch POIs around location
    const tagQuery = getTagQuery(biz);
    const overpassQuery = `[out:json][timeout:25];(node${tagQuery}(around:15000,${lat},${lon});way${tagQuery}(around:15000,${lat},${lon});relation${tagQuery}(around:15000,${lat},${lon}););out center 30;`;
    
    const res = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(overpassQuery), {
      headers: { 'User-Agent': 'LanceBuddy/1.0', 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch leads');
    
    const data = await res.json();
    if (!data.elements || data.elements.length === 0) return [];
    
    // 3. Map into Lead Format
    return data.elements.map(el => {
      const tags = el.tags || {};
      const elName = tags.name || tags['name:en'] || `${biz} in ${loc}`;
      const phone = tags.phone || tags['contact:phone'] || '+91 Not Available';
      
      let sourceUrl = tags.website || tags['contact:website'];
      let platform = 'Website';
      
      if (!sourceUrl && tags['contact:instagram']) {
        sourceUrl = `https://instagram.com/${tags['contact:instagram']}`;
        platform = 'Instagram';
      } else if (!sourceUrl && tags['contact:facebook']) {
        sourceUrl = tags['contact:facebook'];
        platform = 'Facebook';
      } else if (!sourceUrl) {
        sourceUrl = `https://www.openstreetmap.org/${el.type}/${el.id}`;
        platform = 'OSM Database';
      }
      
      const elLat = el.lat || (el.center && el.center.lat) || lat;
      const elLon = el.lon || (el.center && el.center.lon) || lon;
      
      return {
        id: `real_${el.id}`,
        name: elName,
        phone: phone,
        source_platform: platform,
        source_url: sourceUrl,
        maps_url: `https://maps.google.com/?q=${elLat},${elLon}`,
        snippet: `Located at: ${tags['addr:street'] || tags['addr:full'] || loc}. ${tags.opening_hours ? 'Hours: '+tags.opening_hours : ''}`,
        priority: phone !== '+91 Not Available' ? 'hot' : 'cold',
        status: 'new',
        created_at: new Date().toISOString()
      };
    }).filter(l => l.name !== `${biz} in ${loc}`);
  } catch (err) {
    console.error('Real Leads Error:', err);
    return [];
  }
};
