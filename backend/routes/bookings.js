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

// Get all bookings for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    let sql, params;

    if (req.user.role === 'client') {
      sql = `
        SELECT b.*, 
               q.cost, q.time_required, q.parts_needed,
               sr.service_type, sr.description, sr.location, sr.urgency,
               v.make, v.model, v.year, v.license_plate,
               m.certification, m.specialization, m.service_area, m.rate,
               u.name as mechanic_name, u.phone as mechanic_phone,
               (SELECT COUNT(*) FROM reviews WHERE booking_id = b.id) as has_review
        FROM bookings b
        JOIN quotes q ON b.quote_id = q.id
        JOIN service_requests sr ON q.request_id = sr.id
        JOIN vehicles v ON sr.vehicle_id = v.id
        JOIN mechanics m ON q.mechanic_id = m.id
        JOIN users u ON m.user_id = u.id
        WHERE sr.user_id = ?
        ORDER BY b.scheduled_date DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'mechanic') {
      sql = `
        SELECT b.*, 
               q.cost, q.time_required, q.parts_needed,
               sr.service_type, sr.description, sr.location, sr.urgency,
               v.make, v.model, v.year, v.license_plate,
               u.name as client_name, u.phone as client_phone,
               (SELECT COUNT(*) FROM reviews WHERE booking_id = b.id) as has_review
        FROM bookings b
        JOIN quotes q ON b.quote_id = q.id
        JOIN service_requests sr ON q.request_id = sr.id
        JOIN vehicles v ON sr.vehicle_id = v.id
        JOIN users u ON sr.user_id = u.id
        JOIN mechanics m ON q.mechanic_id = m.id
        WHERE m.user_id = ?
        ORDER BY b.scheduled_date DESC
      `;
      params = [req.user.id];
    }

    const bookings = await runQuery(sql, params);
    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Get a specific booking
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    let sql, params;

    if (req.user.role === 'client') {
      sql = `
        SELECT b.*, 
               q.cost, q.time_required, q.parts_needed,
               sr.service_type, sr.description, sr.location, sr.urgency,
               v.make, v.model, v.year, v.license_plate,
               m.certification, m.specialization, m.service_area, m.rate,
               u.name as mechanic_name, u.phone as mechanic_phone,
               (SELECT COUNT(*) FROM reviews WHERE booking_id = b.id) as has_review
        FROM bookings b
        JOIN quotes q ON b.quote_id = q.id
        JOIN service_requests sr ON q.request_id = sr.id
        JOIN vehicles v ON sr.vehicle_id = v.id
        JOIN mechanics m ON q.mechanic_id = m.id
        JOIN users u ON m.user_id = u.id
        WHERE b.id = ? AND sr.user_id = ?
      `;
      params = [bookingId, req.user.id];
    } else if (req.user.role === 'mechanic') {
      sql = `
        SELECT b.*, 
               q.cost, q.time_required, q.parts_needed,
               sr.service_type, sr.description, sr.location, sr.urgency,
               v.make, v.model, v.year, v.license_plate,
               u.name as client_name, u.phone as client_phone,
               (SELECT COUNT(*) FROM reviews WHERE booking_id = b.id) as has_review
        FROM bookings b
        JOIN quotes q ON b.quote_id = q.id
        JOIN service_requests sr ON q.request_id = sr.id
        JOIN vehicles v ON sr.vehicle_id = v.id
        JOIN users u ON sr.user_id = u.id
        JOIN mechanics m ON q.mechanic_id = m.id
        WHERE b.id = ? AND m.user_id = ?
      `;
      params = [bookingId, req.user.id];
    }

    const booking = await runQuery(sql, params);

    if (!booking || booking.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ booking: booking[0] });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Error fetching booking' });
  }
});

// Create a new booking (client only)
router.post('/', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const { quote_id, scheduled_date, notes } = req.body;

    // Validate required fields
    if (!quote_id || !scheduled_date) {
      return res.status(400).json({ message: 'Quote ID and scheduled date are required' });
    }

    // Get quote with service request info
    const quote = await runQuery(
      `SELECT q.*, sr.user_id as client_id, sr.status as request_status
       FROM quotes q
       JOIN service_requests sr ON q.request_id = sr.id
       WHERE q.id = ?`,
      [quote_id]
    );

    if (!quote || quote.length === 0) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Verify quote belongs to client and is accepted
    if (quote[0].client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to book this quote' });
    }
    if (quote[0].status !== 'accepted') {
      return res.status(400).json({ message: 'Can only book accepted quotes' });
    }
    if (quote[0].request_status !== 'open') {
      return res.status(400).json({ message: 'Service request is not open' });
    }

    // Check if quote already has a booking
    const existingBooking = await runQuery(
      'SELECT * FROM bookings WHERE quote_id = ?',
      [quote_id]
    );

    if (existingBooking && existingBooking.length > 0) {
      return res.status(400).json({ message: 'This quote already has a booking' });
    }

    // Create booking
    const bookingId = await runQuery(
      `INSERT INTO bookings (
        quote_id, scheduled_date, notes, status
      ) VALUES (?, ?, ?, 'scheduled')`,
      [quote_id, scheduled_date, notes || '']
    );

    // Update service request status
    await runQuery(
      'UPDATE service_requests SET status = ? WHERE id = ?',
      ['in_progress', quote[0].request_id]
    );

    const newBooking = await runQuery(
      `SELECT b.*, 
              q.cost, q.time_required, q.parts_needed,
              sr.service_type, sr.description, sr.location, sr.urgency,
              v.make, v.model, v.year, v.license_plate,
              m.certification, m.specialization, m.service_area, m.rate,
              u.name as mechanic_name, u.phone as mechanic_phone
       FROM bookings b
       JOIN quotes q ON b.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       JOIN vehicles v ON sr.vehicle_id = v.id
       JOIN mechanics m ON q.mechanic_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE b.id = ?`,
      [bookingId]
    );

    res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking[0]
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
});

// Update a booking
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { scheduled_date, notes, status } = req.body;

    // Get booking with quote and service request info
    const booking = await runQuery(
      `SELECT b.*, q.request_id, sr.user_id as client_id, m.user_id as mechanic_user_id
       FROM bookings b
       JOIN quotes q ON b.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       JOIN mechanics m ON q.mechanic_id = m.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking || booking.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify permissions
    if (req.user.role === 'client' && booking[0].client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }
    if (req.user.role === 'mechanic' && booking[0].mechanic_user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Validate status changes
    if (status) {
      const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Only mechanics can mark as completed
      if (status === 'completed' && req.user.role !== 'mechanic') {
        return res.status(403).json({ message: 'Only mechanics can mark bookings as completed' });
      }

      // Only clients can cancel
      if (status === 'cancelled' && req.user.role !== 'client') {
        return res.status(403).json({ message: 'Only clients can cancel bookings' });
      }
    }

    // Update booking
    const updates = [];
    const params = [];

    if (scheduled_date) {
      updates.push('scheduled_date = ?');
      params.push(scheduled_date);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);

      // Update service request status if booking is completed or cancelled
      if (status === 'completed') {
        await runQuery(
          'UPDATE service_requests SET status = ? WHERE id = ?',
          ['completed', booking[0].request_id]
        );
      } else if (status === 'cancelled') {
        await runQuery(
          'UPDATE service_requests SET status = ? WHERE id = ?',
          ['open', booking[0].request_id]
        );
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    params.push(bookingId);
    await runQuery(
      `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updatedBooking = await runQuery(
      `SELECT b.*, 
              q.cost, q.time_required, q.parts_needed,
              sr.service_type, sr.description, sr.location, sr.urgency,
              v.make, v.model, v.year, v.license_plate,
              m.certification, m.specialization, m.service_area, m.rate,
              u.name as ${req.user.role === 'client' ? 'mechanic_name' : 'client_name'},
              u.phone as ${req.user.role === 'client' ? 'mechanic_phone' : 'client_phone'}
       FROM bookings b
       JOIN quotes q ON b.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       JOIN vehicles v ON sr.vehicle_id = v.id
       JOIN mechanics m ON q.mechanic_id = m.id
       JOIN users u ON ${req.user.role === 'client' ? 'm.user_id' : 'sr.user_id'} = u.id
       WHERE b.id = ?`,
      [bookingId]
    );

    res.json({
      message: 'Booking updated successfully',
      booking: updatedBooking[0]
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Error updating booking' });
  }
});

// Delete a booking (client only)
router.delete('/:id', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Check if booking exists and belongs to client
    const booking = await runQuery(
      `SELECT b.*, sr.user_id as client_id, sr.status as request_status
       FROM bookings b
       JOIN quotes q ON b.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking || booking.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking[0].client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    // Check if booking can be deleted
    if (booking[0].status !== 'scheduled') {
      return res.status(400).json({
        message: 'Can only delete scheduled bookings'
      });
    }

    // Check if booking has any reviews
    const reviews = await runQuery(
      'SELECT * FROM reviews WHERE booking_id = ?',
      [bookingId]
    );

    if (reviews && reviews.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete booking with associated reviews'
      });
    }

    // Delete booking and update service request status
    await runQuery('DELETE FROM bookings WHERE id = ?', [bookingId]);
    await runQuery(
      'UPDATE service_requests SET status = ? WHERE id = ?',
      ['open', booking[0].request_id]
    );

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Error deleting booking' });
  }
});

module.exports = router; 