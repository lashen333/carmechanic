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

// Get all reviews for a specific mechanic
router.get('/mechanic/:mechanicId', async (req, res) => {
  try {
    const { mechanicId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;

    // Get mechanic's average rating and total reviews
    const stats = await runQuery(
      `SELECT 
         COUNT(*) as total_reviews,
         AVG(rating) as average_rating,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM reviews r
       JOIN quotes q ON r.quote_id = q.id
       WHERE q.mechanic_id = ?`,
      [mechanicId]
    );

    // Get reviews with client info and service details
    const orderBy = sort === 'oldest' ? 'ASC' : 'DESC';
    const reviews = await runQuery(
      `SELECT r.*,
              u.name as client_name,
              sr.service_type, sr.description,
              v.make, v.model, v.year,
              b.scheduled_date, b.completed_date
       FROM reviews r
       JOIN quotes q ON r.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       JOIN users u ON sr.user_id = u.id
       JOIN vehicles v ON sr.vehicle_id = v.id
       JOIN bookings b ON r.booking_id = b.id
       WHERE q.mechanic_id = ?
       ORDER BY r.created_at ${orderBy}
       LIMIT ? OFFSET ?`,
      [mechanicId, limit, offset]
    );

    res.json({
      stats: stats[0],
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: stats[0].total_reviews,
        pages: Math.ceil(stats[0].total_reviews / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching mechanic reviews:', error);
    res.status(500).json({ message: 'Error fetching mechanic reviews' });
  }
});

// Get reviews submitted by the authenticated user
router.get('/my-reviews', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const reviews = await runQuery(
      `SELECT r.*,
              m.certification, m.specialization, m.service_area,
              u.name as mechanic_name,
              sr.service_type, sr.description,
              v.make, v.model, v.year,
              b.scheduled_date, b.completed_date
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN quotes q ON b.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       JOIN mechanics m ON q.mechanic_id = m.id
       JOIN users u ON m.user_id = u.id
       JOIN vehicles v ON sr.vehicle_id = v.id
       WHERE sr.user_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    const total = await runQuery(
      `SELECT COUNT(*) as count
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN quotes q ON b.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       WHERE sr.user_id = ?`,
      [req.user.id]
    );

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Error fetching user reviews' });
  }
});

// Create a new review
router.post('/', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;

    // Validate required fields
    if (!booking_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Booking ID and rating (1-5) are required'
      });
    }

    // Get booking with service request info
    const booking = await runQuery(
      `SELECT b.*, sr.user_id as client_id, sr.status as request_status,
              q.mechanic_id, (SELECT COUNT(*) FROM reviews WHERE booking_id = b.id) as has_review
       FROM bookings b
       JOIN quotes q ON b.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       WHERE b.id = ?`,
      [booking_id]
    );

    if (!booking || booking.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify booking belongs to client and is completed
    if (booking[0].client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }
    if (booking[0].status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }
    if (booking[0].has_review > 0) {
      return res.status(400).json({ message: 'This booking already has a review' });
    }

    // Create review
    const reviewId = await runQuery(
      `INSERT INTO reviews (
        booking_id, quote_id, rating, comment
      ) VALUES (?, ?, ?, ?)`,
      [booking_id, booking[0].quote_id, rating, comment || '']
    );

    // Update mechanic's average rating
    await runQuery(
      `UPDATE mechanics 
       SET rating = (
         SELECT AVG(r.rating)
         FROM reviews r
         JOIN quotes q ON r.quote_id = q.id
         WHERE q.mechanic_id = ?
       )
       WHERE id = ?`,
      [booking[0].mechanic_id, booking[0].mechanic_id]
    );

    const newReview = await runQuery(
      `SELECT r.*,
              m.certification, m.specialization, m.service_area,
              u.name as mechanic_name,
              sr.service_type, sr.description,
              v.make, v.model, v.year,
              b.scheduled_date, b.completed_date
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN quotes q ON b.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       JOIN mechanics m ON q.mechanic_id = m.id
       JOIN users u ON m.user_id = u.id
       JOIN vehicles v ON sr.vehicle_id = v.id
       WHERE r.id = ?`,
      [reviewId]
    );

    res.status(201).json({
      message: 'Review submitted successfully',
      review: newReview[0]
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review' });
  }
});

// Update a review
router.put('/:id', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { rating, comment } = req.body;

    // Get review with booking info
    const review = await runQuery(
      `SELECT r.*, sr.user_id as client_id, q.mechanic_id
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN quotes q ON b.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       WHERE r.id = ?`,
      [reviewId]
    );

    if (!review || review.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Verify review belongs to client
    if (review[0].client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    // Update review
    const updates = [];
    const params = [];

    if (rating && rating >= 1 && rating <= 5) {
      updates.push('rating = ?');
      params.push(rating);
    }
    if (comment !== undefined) {
      updates.push('comment = ?');
      params.push(comment);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    params.push(reviewId);
    await runQuery(
      `UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Update mechanic's average rating
    await runQuery(
      `UPDATE mechanics 
       SET rating = (
         SELECT AVG(r.rating)
         FROM reviews r
         JOIN quotes q ON r.quote_id = q.id
         WHERE q.mechanic_id = ?
       )
       WHERE id = ?`,
      [review[0].mechanic_id, review[0].mechanic_id]
    );

    const updatedReview = await runQuery(
      `SELECT r.*,
              m.certification, m.specialization, m.service_area,
              u.name as mechanic_name,
              sr.service_type, sr.description,
              v.make, v.model, v.year,
              b.scheduled_date, b.completed_date
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN quotes q ON b.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       JOIN mechanics m ON q.mechanic_id = m.id
       JOIN users u ON m.user_id = u.id
       JOIN vehicles v ON sr.vehicle_id = v.id
       WHERE r.id = ?`,
      [reviewId]
    );

    res.json({
      message: 'Review updated successfully',
      review: updatedReview[0]
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
});

// Delete a review
router.delete('/:id', verifyToken, checkRole(['client']), async (req, res) => {
  try {
    const reviewId = req.params.id;

    // Get review with booking info
    const review = await runQuery(
      `SELECT r.*, sr.user_id as client_id, q.mechanic_id
       FROM reviews r
       JOIN bookings b ON r.booking_id = b.id
       JOIN quotes q ON b.quote_id = q.id
       JOIN service_requests sr ON q.request_id = sr.id
       WHERE r.id = ?`,
      [reviewId]
    );

    if (!review || review.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Verify review belongs to client
    if (review[0].client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    // Delete review
    await runQuery('DELETE FROM reviews WHERE id = ?', [reviewId]);

    // Update mechanic's average rating
    await runQuery(
      `UPDATE mechanics 
       SET rating = (
         SELECT AVG(r.rating)
         FROM reviews r
         JOIN quotes q ON r.quote_id = q.id
         WHERE q.mechanic_id = ?
       )
       WHERE id = ?`,
      [review[0].mechanic_id, review[0].mechanic_id]
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
});

module.exports = router; 