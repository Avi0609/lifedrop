const express = require('express');
const router = express.Router();
const db = require('../db');

// Blood Compatibility Table for Red Blood Cells
// Key: Recipient blood group -> Compatible donor blood groups
const COMPATIBILITY_MAP = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
};

// City Alias / Synonym Map to resolve location variations
const CITY_CLUSTER_MAP = {
  // Bengaluru
  'bangalore': ['Bengaluru', 'Bangalore'],
  'bengaluru': ['Bengaluru', 'Bangalore'],
  'blr': ['Bengaluru', 'Bangalore'],
  
  // Mumbai & MMR
  'mumbai': ['Mumbai', 'Navi Mumbai', 'Thane'],
  'bombay': ['Mumbai', 'Navi Mumbai', 'Thane'],
  'navi mumbai': ['Mumbai', 'Navi Mumbai', 'Thane'],
  'thane': ['Mumbai', 'Navi Mumbai', 'Thane'],
  
  // Delhi NCR
  'delhi': ['Delhi', 'New Delhi', 'Noida', 'Gurgaon', 'Gurugram', 'Faridabad', 'Ghaziabad'],
  'new delhi': ['Delhi', 'New Delhi', 'Noida', 'Gurgaon', 'Gurugram', 'Faridabad', 'Ghaziabad'],
  'ncr': ['Delhi', 'New Delhi', 'Noida', 'Gurgaon', 'Gurugram'],
  'delhi ncr': ['Delhi', 'New Delhi', 'Noida', 'Gurgaon', 'Gurugram'],
  'gurgaon': ['Delhi', 'Gurgaon', 'Gurugram'],
  'gurugram': ['Delhi', 'Gurgaon', 'Gurugram'],
  'noida': ['Delhi', 'Noida'],
  
  // Hyderabad & Secunderabad
  'hyderabad': ['Hyderabad', 'Secunderabad'],
  'secunderabad': ['Hyderabad', 'Secunderabad'],
  'hyd': ['Hyderabad', 'Secunderabad'],
  
  // Pune & PCMC
  'pune': ['Pune', 'Pimpri', 'Chinchwad', 'PCMC'],
  'poona': ['Pune', 'Pimpri', 'Chinchwad'],
  'pimpri': ['Pune', 'Pimpri', 'Chinchwad'],
  'chinchwad': ['Pune', 'Pimpri', 'Chinchwad'],
  
  // Chennai
  'chennai': ['Chennai', 'Madras'],
  'madras': ['Chennai', 'Madras'],
  
  // Kolkata
  'kolkata': ['Kolkata', 'Calcutta'],
  'calcutta': ['Kolkata', 'Calcutta']
};

// Helper: Resolve input city into a list of search tokens / matching cities
function resolveCityTerms(inputCity) {
  if (!inputCity) return [];
  const clean = inputCity.trim().toLowerCase();
  
  // Check exact cluster match
  if (CITY_CLUSTER_MAP[clean]) {
    return Array.from(new Set([inputCity.trim(), ...CITY_CLUSTER_MAP[clean]]));
  }
  
  // Check if input contains any cluster key as substring (e.g. "delhi ncr", "south bangalore")
  for (const [key, cluster] of Object.entries(CITY_CLUSTER_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return Array.from(new Set([inputCity.trim(), ...cluster]));
    }
  }
  
  return [inputCity.trim()];
}

// GET /api/search/locations - Get all distinct cities and states available in database
router.get('/locations', async (req, res) => {
  try {
    const centerCities = await db.query(`
      SELECT DISTINCT city, state, COUNT(id) as centers_count
      FROM blood_centers
      GROUP BY city
      ORDER BY city ASC
    `);

    const popularCities = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi', 'Chennai', 'Kolkata'];

    return res.json({
      success: true,
      popularCities,
      locations: centerCities
    });
  } catch (err) {
    console.error('Error fetching locations:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve location list' });
  }
});

// GET /api/search - Find blood centers with inventory and matching donors
router.get('/', async (req, res) => {
  try {
    const { bloodGroup, component, city, includeCompatible } = req.query;

    if (!bloodGroup || !component || !city) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: bloodGroup, component, and city are all required.'
      });
    }

    const cleanBloodGroup = bloodGroup.trim();
    const cleanComponent = component.trim();
    const rawCity = city.trim();

    // 1. Resolve city variants and aliases (e.g. Bangalore -> [Bangalore, Bengaluru])
    const cityTerms = resolveCityTerms(rawCity);

    // 2. Determine target blood groups (exact match or include biological compatibility)
    const targetGroups = (includeCompatible === 'true' && COMPATIBILITY_MAP[cleanBloodGroup])
      ? COMPATIBILITY_MAP[cleanBloodGroup]
      : [cleanBloodGroup];

    const groupPlaceholders = targetGroups.map(() => '?').join(', ');

    // 3. Build dynamic SQL conditions for city terms
    const cityClauses = cityTerms.map(() => '(LOWER(c.city) LIKE ? OR LOWER(c.address) LIKE ? OR LOWER(c.state) LIKE ?)').join(' OR ');
    const cityParams = [];
    cityTerms.forEach(term => {
      const p = `%${term.toLowerCase()}%`;
      cityParams.push(p, p, p);
    });

    // Query 1: Search Exact/Cluster City Blood Centers and Inventory
    const centerSql = `
      SELECT 
        c.id AS center_id,
        c.name AS center_name,
        c.city,
        c.state,
        c.pincode,
        c.address,
        c.phone,
        c.email,
        c.operating_hours,
        i.blood_group,
        i.component,
        i.units_available,
        i.last_updated
      FROM blood_centers c
      JOIN blood_inventory i ON c.id = i.center_id
      WHERE (${cityClauses})
        AND i.component = ?
        AND i.blood_group IN (${groupPlaceholders})
        AND i.units_available > 0
      ORDER BY 
        CASE WHEN i.blood_group = ? THEN 0 ELSE 1 END,
        i.units_available DESC
    `;

    const centerParams = [...cityParams, cleanComponent, ...targetGroups, cleanBloodGroup];
    let centerResults = await db.query(centerSql, centerParams);

    // Query 2: Search Available Donors in matching city terms
    const donorCityClauses = cityTerms.map(() => '(LOWER(city) LIKE ? OR LOWER(address) LIKE ? OR LOWER(state) LIKE ?)').join(' OR ');
    const donorCityParams = [];
    cityTerms.forEach(term => {
      const p = `%${term.toLowerCase()}%`;
      donorCityParams.push(p, p, p);
    });

    const donorSql = `
      SELECT id, name, phone, blood_group, city, state, address
      FROM donors
      WHERE (${donorCityClauses})
        AND blood_group IN (${groupPlaceholders})
        AND is_available = 1
      ORDER BY 
        CASE WHEN blood_group = ? THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 10
    `;
    const donorParams = [...donorCityParams, ...targetGroups, cleanBloodGroup];
    const matchingDonors = await db.query(donorSql, donorParams);

    // Query 3: Smart Regional Fallback if NO centers found in target city!
    let nearbyCenters = [];
    let isFallback = false;

    if (centerResults.length === 0) {
      // Find other blood centers across the country or nearby with available stock of this blood group
      const fallbackSql = `
        SELECT 
          c.id AS center_id,
          c.name AS center_name,
          c.city,
          c.state,
          c.pincode,
          c.address,
          c.phone,
          c.email,
          c.operating_hours,
          i.blood_group,
          i.component,
          i.units_available
        FROM blood_centers c
        JOIN blood_inventory i ON c.id = i.center_id
        WHERE i.component = ?
          AND i.blood_group IN (${groupPlaceholders})
          AND i.units_available > 0
        ORDER BY 
          CASE WHEN i.blood_group = ? THEN 0 ELSE 1 END,
          i.units_available DESC
        LIMIT 6
      `;
      nearbyCenters = await db.query(fallbackSql, [cleanComponent, ...targetGroups, cleanBloodGroup]);
      if (nearbyCenters.length > 0) {
        isFallback = true;
      }
    }

    return res.json({
      success: true,
      query: {
        bloodGroup: cleanBloodGroup,
        component: cleanComponent,
        city: rawCity,
        resolvedSearchTerms: cityTerms,
        compatibleGroupsSearched: targetGroups
      },
      isFallback,
      resultsCount: centerResults.length,
      donorsCount: matchingDonors.length,
      centers: centerResults,
      donors: matchingDonors,
      nearbyCenters: isFallback ? nearbyCenters : []
    });
  } catch (err) {
    console.error('Error during blood search:', err);
    return res.status(500).json({ success: false, error: 'Server error processing blood search' });
  }
});

module.exports = router;
