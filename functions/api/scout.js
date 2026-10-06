/**
 * Cloudflare Worker / Pages Function: Real-World Lead Scout
 * Endpoint: GET or POST /api/scout
 * 
 * Server-side proxy for Nominatim + Overpass API.
 * Eliminates browser CORS preflight restrictions and 406 Not Acceptable errors.
 */

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
];

const USER_AGENT = 'LanceBuddy/2.0 (Lead scouting platform; contact: jakadwangdu@outlook.com)';

const getTagQuery = (biz) => {
  const map = {
    'Dental clinic': '["amenity"="dentist"]',
    'Dental Clinic': '["amenity"="dentist"]',
    'Interior designer': '["office"="interior_design"]',
    'Interior Designer': '["office"="interior_design"]',
    'Cafe': '["amenity"="cafe"]',
    'Hotel': '["tourism"="hotel"]',
    'Travel Agency': '["shop"="travel_agency"]',
    'Travel agency': '["shop"="travel_agency"]',
    'Software Company': '["office"="it"]',
    'Software company': '["office"="it"]',
    'Restaurant': '["amenity"="restaurant"]',
    'Gym': '["leisure"="fitness_centre"]',
    'Salon': '["shop"="beauty"]',
    'Bakery': '["shop"="bakery"]',
    'Pharmacy': '["amenity"="pharmacy"]',
    'Hospital': '["amenity"="hospital"]',
    'School': '["amenity"="school"]',
    'Real Estate': '["office"="estate_agent"]',
    'Photography': '["shop"="photo"]',
    'Lawyer': '["office"="lawyer"]',
  };
  return map[biz] || `["name"~"${biz.replace(/"/g, '')}",i]`;
};

async function queryOverpassWithFallback(query) {
  const body = new URLSearchParams({ data: query }).toString();

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
        body,
      });

      if (!res.ok) continue;
      const data = await res.json();
      if (data && Array.isArray(data.elements)) {
        return data;
      }
    } catch {
      // try next endpoint
    }
  }
  return null;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function handleScoutRequest(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    let biz = '';
    let loc = '';

    if (request.method === 'GET') {
      const url = new URL(request.url);
      biz = url.searchParams.get('biz') || '';
      loc = url.searchParams.get('loc') || '';
    } else if (request.method === 'POST') {
      try {
        const body = await request.json();
        biz = body.biz || '';
        loc = body.loc || '';
      } catch {}
    }

    biz = (biz || 'Cafe').trim();
    loc = (loc || 'Mumbai').trim();

    // 1. Geocode location via Nominatim
    let lat = null;
    let lon = null;
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'en',
          },
        }
      );
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (nomData && nomData.length > 0) {
          lat = nomData[0].lat;
          lon = nomData[0].lon;
        }
      }
    } catch {}

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ success: false, leads: [], message: `Could not find coordinates for "${loc}".` }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 2. Query Overpass API server-side
    const tagQuery = getTagQuery(biz);
    const overpassQuery = `[out:json][timeout:20];(node${tagQuery}(around:15000,${lat},${lon});way${tagQuery}(around:15000,${lat},${lon});relation${tagQuery}(around:15000,${lat},${lon}););out center 30;`;

    const data = await queryOverpassWithFallback(overpassQuery);
    if (!data || !data.elements || data.elements.length === 0) {
      return new Response(
        JSON.stringify({ success: true, leads: [], message: 'No POIs found in target area.' }),
        { status: 200, headers: corsHeaders }
      );
    }

    const leads = data.elements
      .map((el) => {
        const tags = el.tags || {};
        const elName = tags.name || tags['name:en'];
        if (!elName) return null;

        const phone =
          tags.phone ||
          tags['contact:phone'] ||
          tags['contact:mobile'] ||
          tags.mobile ||
          null;

        let sourceUrl = tags.website || tags['contact:website'];
        let platform = 'Website';

        if (!sourceUrl && tags['contact:instagram']) {
          sourceUrl = `https://instagram.com/${tags['contact:instagram'].replace('@', '')}`;
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

        const addressParts = [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:suburb'] || tags['addr:district'],
          tags['addr:city'],
        ].filter(Boolean).join(', ');

        const snippet = addressParts
          ? `${addressParts}${tags.opening_hours ? ' · Hours: ' + tags.opening_hours : ''}`
          : `${loc}${tags.opening_hours ? ' · Hours: ' + tags.opening_hours : ''}`;

        return {
          id: `real_${el.id}`,
          name: elName,
          phone: phone || '+91 Not Available',
          source_platform: platform,
          source_url: sourceUrl,
          maps_url: `https://maps.google.com/?q=${elLat},${elLon}`,
          snippet,
          priority: phone ? 'hot' : sourceUrl && platform !== 'OSM Database' ? 'warm' : 'cold',
          status: 'new',
          has_website: Boolean(tags.website || tags['contact:website']),
          created_at: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    return new Response(
      JSON.stringify({ success: true, leads }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, leads: [], error: err.message }),
      { status: 200, headers: corsHeaders }
    );
  }
}

export async function onRequestPost(context) {
  return handleScoutRequest(context.request);
}

export async function onRequestGet(context) {
  return handleScoutRequest(context.request);
}
