const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/stats - Aggregated website and database statistics
router.get('/', async (req, res) => {
  try {
    const donorsCountRow = await db.get('SELECT COUNT(*) as count FROM donors WHERE is_available = 1');
    const centersCountRow = await db.get('SELECT COUNT(*) as count FROM blood_centers');
    const unitsSumRow = await db.get('SELECT COALESCE(SUM(units_available), 0) as total_units FROM blood_inventory');
    const requestsCountRow = await db.get("SELECT COUNT(*) as count FROM blood_requests WHERE status = 'Open'");

    const inventoryByGroup = await db.query(`
      SELECT blood_group, SUM(units_available) as units
      FROM blood_inventory
      GROUP BY blood_group
      ORDER BY blood_group
    `);

    return res.json({
      success: true,
      stats: {
        activeDonors: donorsCountRow ? donorsCountRow.count : 0,
        bloodCenters: centersCountRow ? centersCountRow.count : 0,
        totalUnitsAvailable: unitsSumRow ? unitsSumRow.total_units : 0,
        openEmergencyRequests: requestsCountRow ? requestsCountRow.count : 0,
        inventoryByGroup
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ success: false, error: 'Server error retrieving statistics' });
  }
});

module.exports = router;

