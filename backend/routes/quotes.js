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

// Get all quotes for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    let sql, params;

    if (req.user.role === 'client') {
      sql = `
        SELECT q.*, 
               sr.service_type, sr.description, sr.location, sr.urgency,
               v.make, v.model, v.year, v.license_plate,
               m.certification, m.specialization, m.service_area, m.rate,
               u.name as mechanic_name, u.phone as mechanic_phone,
               (SELECT COUNT(*) FROM bookings WHERE quote_id = q.id) as has_booking
        FROM quotes q
        JOIN service_requests sr ON q.request_id = sr.id
        JOIN vehicles v ON sr.vehicle_id = v.id
        JOIN mechanics m ON q.mechanic_id = m.id
        JOIN users u ON m.user_id = u.id
        WHERE sr.user_id = ?
        ORDER BY q.created_at DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'mechanic') {
      sql = `
        SELECT q.*, 
               sr.service_type, sr.description, sr.location, sr.urgency,
               v.make, v.model, v.year, v.license_plate,
               u.name as client_name, u.phone as client_phone,
               (SELECT COUNT(*) FROM bookings WHERE quote_id = q.id) as has_booking
        FROM quotes q
        JOIN service_requests sr ON q.request_id = sr.id
        JOIN vehicles v ON sr.vehicle_id = v.id
        JOIN users u ON sr.user_id = u.id
        JOIN mechanics m ON q.mechanic_id = m.id
        WHERE m.user_id = ?
        ORDER BY q.created_at DESC
      `;
      params = [req.user.id];
    }

    const quotes = await runQuery(sql, params);
    res.json({ quotes });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ message: 'Error fetching quotes' });
  }
});

// Get a specific quote
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const quoteId = req.params.id;
    let sql, params;

    if (req.user.role === 'client') {
      sql = `
        SELECT q.*, 
               sr.service_type, sr.description, sr.location, sr.urgency,
               v.make, v.model, v.year, v.license_plate,
               m.certification, m.specialization, m.service_area, m.rate,
               u.name as mechanic_name, u.phone as mechanic_phone,
               (SELECT COUNT(*) FROM bookings WHERE quote_id = q.id) as has_booking
        FROM quotes q
        JOIN service_requests sr ON q.request_id = sr.id
        JOIN vehicles v ON sr.vehicle_id = v.id
        JOIN mechanics m ON q.mechanic_id = m.id
        JOIN users u ON m.user_id = u.id
        WHERE q.id = ? AND sr.user_id = ?
      `;
      params = [quoteId, req.user.id];
    } else if (req.user.role === 'mechanic') {
      sql = `
        SELECT q.*, 
               sr.service_type, sr.description, sr.location, sr.urgency,
               v.make, v.model, v.year, v.license_plate,
               u.name as client_name, u.phone as client_phone,
               (SELECT COUNT(*) FROM bookings WHERE quote_id = q.id) as has_booking
        FROM quotes q
        JOIN service_requests sr ON q.request_id = sr.id
        JOIN vehicles v ON sr.vehicle_id = v.id
        JOIN users u ON sr.user_id = u.id
        JOIN mechanics m ON q.mechanic_id = m.id
        WHERE q.id = ? AND m.user_id = ?
      `;
      params = [quoteId, req.user.id];
    }

    const quote = await runQuery(sql, params);

    if (!quote || quote.length === 0) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    res.json({ quote: quote[0] });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ message: 'Error fetching quote' });
  }
});

// Create a new quote (mechanic only)
router.post('/', verifyToken, checkRole(['mechanic']), async (req, res) => {
  try {
    const { request_id, cost, time_required, parts_needed, availability } = req.body;

    // Validate required fields
    if (!request_id || !cost || !time_required || !availability) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get mechanic ID
    const mechanic = await runQuery(
      'SELECT id FROM mechanics WHERE user_id = ?',
      [req.user.id]
    );

    if (!mechanic || mechanic.length === 0) {
      return res.status(404).json({ message: 'Mechanic profile not found' });
    }

    // Check if service request exists and is open
    const serviceRequest = await runQuery(
      'SELECT * FROM service_requests WHERE id = ? AND status = ?',
      [request_id, 'open']
    );

    if (!serviceRequest || serviceRequest.length === 0) {
      return res.status(404).json({ message: 'Service request not found or not open' });
    }

    // Check if mechanic has already quoted this request
    const existingQuote = await runQuery(
      'SELECT * FROM quotes WHERE request_id = ? AND mechanic_id = ?',
      [request_id, mechanic[0].id]
    );

    if (existingQuote && existingQuote.length > 0) {
      return res.status(400).json({ message: 'You have already quoted this request' });
    }

    // Create quote
    const quoteId = await runQuery(
      `INSERT INTO quotes (
        request_id, mechanic_id, cost, time_required,
        parts_needed, availability, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        request_id,
        mechanic[0].id,
        cost,
        time_required,
        parts_needed || '',
        availability
      ]
    );

    const newQuote = await runQuery(
      `SELECT q.*, 
              sr.service_type, sr.description, sr.location, sr.urgency,
              v.make, v.model, v.year, v.license_plate,
              u.name as client_name, u.phone as client_phone
       FROM quotes q
       JOIN service_requests sr ON q.request_id = sr.id
       JOIN vehicles v ON sr.vehicle_id = v.id
       JOIN users u ON sr.user_id = u.id
       WHERE q.id = ?`,
      [quoteId]
    );

    res.status(201).json({
      message: 'Quote created successfully',
      quote: newQuote[0]
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ message: 'Error creating quote' });
  }
});

// Update a quote
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const quoteId = req.params.id;
    const { cost, time_required, parts_needed, availability, status } = req.body;

    // Get quote with mechanic info
    const quote = await runQuery(
      `SELECT q.*, m.user_id as mechanic_user_id
       FROM quotes q
       JOIN mechanics m ON q.mechanic_id = m.id
       WHERE q.id = ?`,
      [quoteId]
    );

    if (!quote || quote.length === 0) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Verify permissions
    if (req.user.role === 'mechanic' && quote[0].mechanic_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this quote' });
    }

    // Only mechanics can update certain fields
    if (req.user.role === 'mechanic') {
      if (status && status !== quote[0].status) {
        return res.status(403).json({ message: 'Mechanics cannot change quote status' });
      }
    }

    // Only clients can update status
    if (req.user.role === 'client' && status && !['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Check if quote can be updated
    if (quote[0].status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update a quote that is not pending' });
    }

    // Update quote
    const updates = [];
    const params = [];

    if (cost && req.user.role === 'mechanic') {
      updates.push('cost = ?');
      params.push(cost);
    }
    if (time_required && req.user.role === 'mechanic') {
      updates.push('time_required = ?');
      params.push(time_required);
    }
    if (parts_needed !== undefined && req.user.role === 'mechanic') {
      updates.push('parts_needed = ?');
      params.push(parts_needed);
    }
    if (availability && req.user.role === 'mechanic') {
      updates.push('availability = ?');
      params.push(availability);
    }
    if (status && req.user.role === 'client') {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    params.push(quoteId);
    await runQuery(
      `UPDATE quotes SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updatedQuote = await runQuery(
      `SELECT q.*, 
              sr.service_type, sr.description, sr.location, sr.urgency,
              v.make, v.model, v.year, v.license_plate,
              m.certification, m.specialization, m.service_area, m.rate,
              u.name as mechanic_name, u.phone as mechanic_phone
       FROM quotes q
       JOIN service_requests sr ON q.request_id = sr.id
       JOIN vehicles v ON sr.vehicle_id = v.id
       JOIN mechanics m ON q.mechanic_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE q.id = ?`,
      [quoteId]
    );

    res.json({
      message: 'Quote updated successfully',
      quote: updatedQuote[0]
    });
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({ message: 'Error updating quote' });
  }
});

// Delete a quote (mechanic only)
router.delete('/:id', verifyToken, checkRole(['mechanic']), async (req, res) => {
  try {
    const quoteId = req.params.id;

    // Check if quote exists and belongs to mechanic
    const quote = await runQuery(
      `SELECT q.*, m.user_id as mechanic_user_id
       FROM quotes q
       JOIN mechanics m ON q.mechanic_id = m.id
       WHERE q.id = ? AND m.user_id = ?`,
      [quoteId, req.user.id]
    );

    if (!quote || quote.length === 0) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Check if quote can be deleted
    if (quote[0].status !== 'pending') {
      return res.status(400).json({
        message: 'Cannot delete a quote that is not pending'
      });
    }

    // Check if quote has any bookings
    const bookings = await runQuery(
      'SELECT * FROM bookings WHERE quote_id = ?',
      [quoteId]
    );

    if (bookings && bookings.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete quote with associated bookings'
      });
    }

    // Delete quote
    await runQuery('DELETE FROM quotes WHERE id = ?', [quoteId]);

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ message: 'Error deleting quote' });
  }
});

module.exports = router; 