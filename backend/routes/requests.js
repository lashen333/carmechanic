const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

// Helper function to run SQL queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (sql.trim().toLowerCase().startsWith('select')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    }
  });
};

// Get all service requests for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    let sql, params;

    if (req.user.role === 'client') {
      sql = `
        SELECT sr.*, v.make, v.model, v.year, v.license_plate,
               (SELECT COUNT(*) FROM quotes WHERE request_id = sr.id) as quote_count
        FROM service_requests sr
        JOIN vehicles v ON sr.vehicle_id = v.id
        WHERE sr.user_id = ?
        ORDER BY sr.created_at DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'mechanic') {
      sql = `
        SELECT sr.*, v.make, v.model, v.year, v.license_plate,
               u.name as client_name, u.phone as client_phone,
               (SELECT COUNT(*) FROM quotes WHERE request_id = sr.id AND mechanic_id = ?) as has_quoted
        FROM service_requests sr
        JOIN vehicles v ON sr.vehicle_id = v.id
        JOIN users u ON sr.user_id = u.id
        WHERE sr.status = 'open'
        ORDER BY sr.created_at DESC
      `;
      params = [req.user.id];
    }

    const requests = await runQuery(sql, params);
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Error fetching service requests' });
  }
});

// Get a specific service request
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    let sql, params;

    if (req.user.role === 'client') {
      sql = `
        SELECT sr.*, v.make, v.model, v.year, v.license_plate,
               (SELECT COUNT(*) FROM quotes WHERE request_id = sr.id) as quote_count
        FROM service_requests sr
        JOIN vehicles v ON sr.vehicle_id = v.id
        WHERE sr.id = ? AND sr.user_id = ?
      `;
      params = [requestId, req.user.id];
    } else if (req.user.role === 'mechanic') {
      sql = `
        SELECT sr.*, v.make, v.model, v.year, v.license_plate,
               u.name as client_name, u.phone as client_phone,
               (SELECT COUNT(*) FROM quotes WHERE request_id = sr.id AND mechanic_id = ?) as has_quoted
        FROM service_requests sr
        JOIN vehicles v ON sr.vehicle_id = v.id
        JOIN users u ON sr.user_id = u.id
        WHERE sr.id = ?
      `;
      params = [req.user.id, requestId];
    }

    const request = await runQuery(sql, params);

    if (!request || request.length === 0) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    res.json({ request: request[0] });
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({ message: 'Error fetching service request' });
  }
});

// Create a new service request
router.post('/', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const {
      vehicle_id,
      service_type,
      description,
      location,
      urgency,
      preferred_date,
      photo
    } = req.body;

    // Validate required fields
    if (!vehicle_id || !service_type || !description || !location || !urgency || !preferred_date) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Verify vehicle belongs to user
    const vehicle = await runQuery(
      'SELECT * FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicle_id, req.user.id]
    );

    if (!vehicle || vehicle.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Create service request
    const requestId = await runQuery(
      `INSERT INTO service_requests (
        user_id, vehicle_id, service_type, description,
        location, urgency, preferred_date, photo, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        req.user.id,
        vehicle_id,
        service_type,
        description,
        location,
        urgency,
        preferred_date,
        photo || ''
      ]
    );

    const newRequest = await runQuery(
      `SELECT sr.*, v.make, v.model, v.year, v.license_plate
       FROM service_requests sr
       JOIN vehicles v ON sr.vehicle_id = v.id
       WHERE sr.id = ?`,
      [requestId]
    );

    res.status(201).json({
      message: 'Service request created successfully',
      request: newRequest[0]
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ message: 'Error creating service request' });
  }
});

// Update a service request
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const requestId = req.params.id;
    const {
      service_type,
      description,
      location,
      urgency,
      preferred_date,
      photo,
      status
    } = req.body;

    // Check if request exists
    const existingRequest = await runQuery(
      'SELECT * FROM service_requests WHERE id = ?',
      [requestId]
    );

    if (!existingRequest || existingRequest.length === 0) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Verify permissions
    if (req.user.role === 'client' && existingRequest[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    // Only clients can update certain fields
    if (req.user.role === 'client') {
      if (status && status !== existingRequest[0].status) {
        return res.status(403).json({ message: 'Clients cannot change request status' });
      }
    }

    // Only mechanics can update status
    if (req.user.role === 'mechanic' && status && !['open', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update request
    const updates = [];
    const params = [];

    if (service_type) {
      updates.push('service_type = ?');
      params.push(service_type);
    }
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }
    if (location) {
      updates.push('location = ?');
      params.push(location);
    }
    if (urgency) {
      updates.push('urgency = ?');
      params.push(urgency);
    }
    if (preferred_date) {
      updates.push('preferred_date = ?');
      params.push(preferred_date);
    }
    if (photo !== undefined) {
      updates.push('photo = ?');
      params.push(photo);
    }
    if (status && req.user.role === 'mechanic') {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    params.push(requestId);
    await runQuery(
      `UPDATE service_requests SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updatedRequest = await runQuery(
      `SELECT sr.*, v.make, v.model, v.year, v.license_plate
       FROM service_requests sr
       JOIN vehicles v ON sr.vehicle_id = v.id
       WHERE sr.id = ?`,
      [requestId]
    );

    res.json({
      message: 'Service request updated successfully',
      request: updatedRequest[0]
    });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ message: 'Error updating service request' });
  }
});

// Delete a service request
router.delete('/:id', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const requestId = req.params.id;

    // Check if request exists and belongs to user
    const existingRequest = await runQuery(
      'SELECT * FROM service_requests WHERE id = ? AND user_id = ?',
      [requestId, req.user.id]
    );

    if (!existingRequest || existingRequest.length === 0) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    // Check if request has any quotes
    const quotes = await runQuery(
      'SELECT * FROM quotes WHERE request_id = ?',
      [requestId]
    );

    if (quotes && quotes.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete service request with existing quotes'
      });
    }

    // Delete request
    await runQuery('DELETE FROM service_requests WHERE id = ?', [requestId]);

    res.json({ message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ message: 'Error deleting service request' });
  }
});

module.exports = router; 