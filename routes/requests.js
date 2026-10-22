const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/requests - Submit a blood request
router.post('/', async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      component,
      unitsNeeded,
      hospitalName,
      city,
      contactName,
      contactPhone,
      urgency
    } = req.body;

    if (!patientName || !bloodGroup || !component || !hospitalName || !city || !contactPhone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientName, bloodGroup, component, hospitalName, city, contactPhone are required'
      });
    }

    const sql = `
      INSERT INTO blood_requests (
        patient_name, blood_group, component, units_needed,
        hospital_name, city, contact_name, contact_phone, urgency, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')
    `;

    const params = [
      patientName.trim(),
      bloodGroup.trim(),
      component.trim(),
      parseInt(unitsNeeded, 10) || 1,
      hospitalName.trim(),
      city.trim(),
      contactName ? contactName.trim() : patientName.trim(),
      contactPhone.trim(),
      urgency || 'Normal'
    ];

    const result = await db.execute(sql, params);

    return res.status(201).json({
      success: true,
      message: 'Emergency blood request published successfully. Local donors and blood banks will be alerted.',
      requestId: result.insertId
    });
  } catch (err) {
    console.error('Error creating blood request:', err);
    return res.status(500).json({ success: false, error: 'Server error creating blood request' });
  }
});

// GET /api/requests - List blood requests
router.get('/', async (req, res) => {
  try {
    const { city, bloodGroup, status } = req.query;
    let sql = 'SELECT * FROM blood_requests WHERE 1=1';
    const params = [];

    if (city) {
      sql += ' AND LOWER(city) LIKE ?';
      params.push(`%${city.trim().toLowerCase()}%`);
    }

    if (bloodGroup) {
      sql += ' AND blood_group = ?';
      params.push(bloodGroup.trim());
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status.trim());
    } else {
      sql += " AND status = 'Open'";
    }

    sql += " ORDER BY CASE urgency WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 ELSE 3 END, created_at DESC";

    const requests = await db.query(sql, params);
    return res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    console.error('Error fetching blood requests:', err);
    return res.status(500).json({ success: false, error: 'Server error fetching requests' });
  }
});

// PATCH /api/requests/:id/status - Update blood request status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Open', 'Fulfilled', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be Open, Fulfilled, or Cancelled' });
    }

    const result = await db.execute('UPDATE blood_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    return res.json({ success: true, message: `Request marked as ${status}` });
  } catch (err) {
    console.error('Error updating request status:', err);
    return res.status(500).json({ success: false, error: 'Server error updating status' });
  }
});

module.exports = router;
