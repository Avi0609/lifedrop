const express = require('express');
const router = express.Router();
const db = require('../db');

// Valid blood groups
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// POST /api/donors - Register a new donor
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, bloodGroup, city, state, pincode, address, age, gender } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, error: 'City is required' });
    }
    if (!bloodGroup || !VALID_BLOOD_GROUPS.includes(bloodGroup.trim())) {
      return res.status(400).json({
        success: false,
        error: `Please select a valid blood group (${VALID_BLOOD_GROUPS.join(', ')})`
      });
    }

    const sql = `
      INSERT INTO donors (name, phone, email, blood_group, city, state, pincode, address, age, gender, is_available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;
    const params = [
      name.trim(),
      phone.trim(),
      email ? email.trim() : null,
      bloodGroup.trim(),
      city.trim(),
      state ? state.trim() : null,
      pincode ? pincode.trim() : null,
      address ? address.trim() : null,
      age ? parseInt(age, 10) : null,
      gender || null
    ];

    const result = await db.execute(sql, params);

    return res.status(201).json({
      success: true,
      message: 'Thank you! You have been successfully registered as a donor.',
      donorId: result.insertId,
      donor: {
        id: result.insertId,
        name: name.trim(),
        bloodGroup: bloodGroup.trim(),
        city: city.trim(),
        phone: phone.trim()
      }
    });
  } catch (err) {
    console.error('Error registering donor:', err);
    return res.status(500).json({ success: false, error: 'Server error registering donor' });
  }
});

// GET /api/donors - List/Search donors
router.get('/', async (req, res) => {
  try {
    const { bloodGroup, city, available } = req.query;
    let sql = 'SELECT id, name, phone, email, blood_group, city, address, age, gender, is_available, created_at FROM donors WHERE 1=1';
    const params = [];

    if (bloodGroup) {
      sql += ' AND blood_group = ?';
      params.push(bloodGroup.trim());
    }

    if (city) {
      sql += ' AND LOWER(city) LIKE ?';
      params.push(`%${city.trim().toLowerCase()}%`);
    }

    if (available !== undefined) {
      sql += ' AND is_available = ?';
      params.push(available === 'true' || available === '1' ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC';

    const donors = await db.query(sql, params);
    return res.json({ success: true, count: donors.length, donors });
  } catch (err) {
    console.error('Error fetching donors:', err);
    return res.status(500).json({ success: false, error: 'Server error retrieving donors' });
  }
});

// GET /api/donors/:id - Get single donor details
router.get('/:id', async (req, res) => {
  try {
    const donor = await db.get('SELECT * FROM donors WHERE id = ?', [req.params.id]);
    if (!donor) {
      return res.status(400).json({ success: false, error: 'Donor not found' });
    }
    return res.json({ success: true, donor });
  } catch (err) {
    console.error('Error fetching donor:', err);
    return res.status(500).json({ success: false, error: 'Server error retrieving donor' });
  }
});

// PATCH /api/donors/:id/availability - Toggle donor availability
router.patch('/:id/availability', async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const availVal = isAvailable ? 1 : 0;
    const result = await db.execute('UPDATE donors SET is_available = ? WHERE id = ?', [availVal, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Donor not found' });
    }
    return res.json({ success: true, message: 'Availability status updated', isAvailable: availVal === 1 });
  } catch (err) {
    console.error('Error updating donor availability:', err);
    return res.status(500).json({ success: false, error: 'Server error updating availability' });
  }
});

module.exports = router;

