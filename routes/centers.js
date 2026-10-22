const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/centers - List all blood centers
router.get('/', async (req, res) => {
  try {
    const { city } = req.query;
    let sql = 'SELECT * FROM blood_centers WHERE 1=1';
    const params = [];

    if (city) {
      sql += ' AND LOWER(city) LIKE ?';
      params.push(`%${city.trim().toLowerCase()}%`);
    }

    sql += ' ORDER BY city, name';
    const centers = await db.query(sql, params);

    return res.json({ success: true, count: centers.length, centers });
  } catch (err) {
    console.error('Error fetching centers:', err);
    return res.status(500).json({ success: false, error: 'Server error retrieving centers' });
  }
});

// GET /api/centers/:id - Get center details with full inventory breakdown
router.get('/:id', async (req, res) => {
  try {
    const center = await db.get('SELECT * FROM blood_centers WHERE id = ?', [req.params.id]);
    if (!center) {
      return res.status(404).json({ success: false, error: 'Blood center not found' });
    }

    const inventory = await db.query(
      'SELECT id, blood_group, component, units_available, last_updated FROM blood_inventory WHERE center_id = ? ORDER BY blood_group, component',
      [req.params.id]
    );

    return res.json({
      success: true,
      center,
      inventory
    });
  } catch (err) {
    console.error('Error fetching center details:', err);
    return res.status(500).json({ success: false, error: 'Server error retrieving center details' });
  }
});

// POST /api/centers - Register a new blood bank/center
router.post('/', async (req, res) => {
  try {
    const { name, city, address, phone, email, operatingHours } = req.body;

    if (!name || !city || !address || !phone) {
      return res.status(400).json({
        success: false,
        error: 'name, city, address, and phone are required fields'
      });
    }

    const sql = `
      INSERT INTO blood_centers (name, city, address, phone, email, operating_hours)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      name.trim(),
      city.trim(),
      address.trim(),
      phone.trim(),
      email ? email.trim() : null,
      operatingHours ? operatingHours.trim() : '24/7 Emergency Service'
    ];

    const result = await db.execute(sql, params);
    return res.status(201).json({
      success: true,
      message: 'Blood center registered successfully',
      centerId: result.insertId
    });
  } catch (err) {
    console.error('Error adding blood center:', err);
    return res.status(500).json({ success: false, error: 'Server error registering blood center' });
  }
});

// POST /api/centers/:id/inventory - Upsert blood inventory for a center
router.post('/:id/inventory', async (req, res) => {
  try {
    const centerId = req.params.id;
    const { bloodGroup, component, units } = req.body;

    if (!bloodGroup || !component || units === undefined) {
      return res.status(400).json({
        success: false,
        error: 'bloodGroup, component, and units are required'
      });
    }

    // Check if entry exists
    const existing = await db.get(
      'SELECT id FROM blood_inventory WHERE center_id = ? AND blood_group = ? AND component = ?',
      [centerId, bloodGroup.trim(), component.trim()]
    );

    if (existing) {
      await db.execute(
        'UPDATE blood_inventory SET units_available = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
        [parseInt(units, 10), existing.id]
      );
    } else {
      await db.execute(
        'INSERT INTO blood_inventory (center_id, blood_group, component, units_available) VALUES (?, ?, ?, ?)',
        [centerId, bloodGroup.trim(), component.trim(), parseInt(units, 10)]
      );
    }

    return res.json({
      success: true,
      message: 'Inventory updated successfully'
    });
  } catch (err) {
    console.error('Error updating inventory:', err);
    return res.status(500).json({ success: false, error: 'Server error updating inventory' });
  }
});

module.exports = router;

