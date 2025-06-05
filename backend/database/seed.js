const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Helper function to run SQL queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Error executing query:', sql, err);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
};

// Helper function to run multiple queries in sequence
const runQueries = async (queries) => {
  for (const query of queries) {
    await runQuery(query.sql, query.params);
  }
};

const seed = async () => {
  try {
    // Clear existing data in reverse order of dependencies
    const clearQueries = [
      { sql: 'DELETE FROM reviews' },
      { sql: 'DELETE FROM bookings' },
      { sql: 'DELETE FROM quotes' },
      { sql: 'DELETE FROM service_requests' },
      { sql: 'DELETE FROM vehicles' },
      { sql: 'DELETE FROM mechanics' },
      { sql: 'DELETE FROM users' }
    ];
    
    await runQueries(clearQueries);
    console.log('Cleared existing data');

    // Insert users (clients and mechanics)
    const users = [
      // Clients
      { name: 'Alice Smith', email: 'alice@example.com', password: 'password1', role: 'client', phone: '555-1111' },
      { name: 'Bob Johnson', email: 'bob@example.com', password: 'password2', role: 'client', phone: '555-2222' },
      { name: 'Carol Lee', email: 'carol@example.com', password: 'password3', role: 'client', phone: '555-3333' },
      // Mechanics
      { name: 'Mike Mechanic', email: 'mike@mech.com', password: 'mechpass1', role: 'mechanic', phone: '555-4444' },
      { name: 'Sara Wrench', email: 'sara@mech.com', password: 'mechpass2', role: 'mechanic', phone: '555-5555' },
      { name: 'Tom Gear', email: 'tom@mech.com', password: 'mechpass3', role: 'mechanic', phone: '555-6666' },
      { name: 'Linda Bolt', email: 'linda@mech.com', password: 'mechpass4', role: 'mechanic', phone: '555-7777' },
      { name: 'Rick Fix', email: 'rick@mech.com', password: 'mechpass5', role: 'mechanic', phone: '555-8888' }
    ];

    const userIds = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const userId = await runQuery(
        'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
        [user.name, user.email, hashedPassword, user.role, user.phone]
      );
      userIds.push(userId);
    }
    console.log('Inserted users');

    // Insert mechanics
    const mechanics = [
      { userIdx: 3, certification: 'ASE Certified', specialization: 'Engine', service_area: 'Downtown', rate: 60, verified: 1 },
      { userIdx: 4, certification: 'ASE Certified', specialization: 'Transmission', service_area: 'Uptown', rate: 65, verified: 1 },
      { userIdx: 5, certification: 'OEM Certified', specialization: 'Brakes', service_area: 'Suburbs', rate: 55, verified: 1 },
      { userIdx: 6, certification: 'ASE Certified', specialization: 'Electrical', service_area: 'Citywide', rate: 70, verified: 1 },
      { userIdx: 7, certification: 'OEM Certified', specialization: 'Suspension', service_area: 'Metro', rate: 58, verified: 1 }
    ];

    const mechanicIds = [];
    for (const mech of mechanics) {
      const mechanicId = await runQuery(
        'INSERT INTO mechanics (user_id, certification, specialization, service_area, rate, verified) VALUES (?, ?, ?, ?, ?, ?)',
        [userIds[mech.userIdx], mech.certification, mech.specialization, mech.service_area, mech.rate, mech.verified]
      );
      mechanicIds.push(mechanicId);
    }
    console.log('Inserted mechanics');

    // Insert vehicles
    const vehicles = [
      { userIdx: 0, make: 'Toyota', model: 'Camry', year: 2018, license_plate: 'ABC123', vin: 'VIN001' },
      { userIdx: 0, make: 'Honda', model: 'Civic', year: 2020, license_plate: 'XYZ789', vin: 'VIN002' },
      { userIdx: 1, make: 'Ford', model: 'Focus', year: 2017, license_plate: 'FOC456', vin: 'VIN003' },
      { userIdx: 2, make: 'Chevrolet', model: 'Malibu', year: 2019, license_plate: 'MAL321', vin: 'VIN004' }
    ];

    const vehicleIds = [];
    for (const vehicle of vehicles) {
      const vehicleId = await runQuery(
        'INSERT INTO vehicles (user_id, make, model, year, license_plate, vin) VALUES (?, ?, ?, ?, ?, ?)',
        [userIds[vehicle.userIdx], vehicle.make, vehicle.model, vehicle.year, vehicle.license_plate, vehicle.vin]
      );
      vehicleIds.push(vehicleId);
    }
    console.log('Inserted vehicles');

    // Insert service requests
    const serviceRequests = [
      { userIdx: 0, vehicleIdx: 0, service_type: 'Oil Change', description: 'Need oil change', location: 'Downtown', urgency: 'Low', preferred_date: '2024-06-10', photo: '', status: 'open' },
      { userIdx: 0, vehicleIdx: 1, service_type: 'Brake Inspection', description: 'Brakes squeaking', location: 'Downtown', urgency: 'Medium', preferred_date: '2024-06-12', photo: '', status: 'open' },
      { userIdx: 1, vehicleIdx: 2, service_type: 'Transmission', description: 'Transmission slipping', location: 'Uptown', urgency: 'High', preferred_date: '2024-06-11', photo: '', status: 'open' },
      { userIdx: 2, vehicleIdx: 3, service_type: 'Engine Diagnostics', description: 'Check engine light', location: 'Suburbs', urgency: 'Medium', preferred_date: '2024-06-13', photo: '', status: 'open' },
      { userIdx: 0, vehicleIdx: 0, service_type: 'Tire Rotation', description: 'Routine tire rotation', location: 'Downtown', urgency: 'Low', preferred_date: '2024-06-15', photo: '', status: 'open' },
      { userIdx: 1, vehicleIdx: 2, service_type: 'Battery Replacement', description: 'Car won\'t start', location: 'Uptown', urgency: 'High', preferred_date: '2024-06-14', photo: '', status: 'open' },
      { userIdx: 2, vehicleIdx: 3, service_type: 'Suspension', description: 'Strange noise', location: 'Metro', urgency: 'Medium', preferred_date: '2024-06-16', photo: '', status: 'open' },
      { userIdx: 0, vehicleIdx: 1, service_type: 'AC Repair', description: 'AC not cooling', location: 'Downtown', urgency: 'Low', preferred_date: '2024-06-17', photo: '', status: 'open' },
      { userIdx: 1, vehicleIdx: 2, service_type: 'Alignment', description: 'Car pulls right', location: 'Uptown', urgency: 'Medium', preferred_date: '2024-06-18', photo: '', status: 'open' },
      { userIdx: 2, vehicleIdx: 3, service_type: 'Detailing', description: 'Full interior detail', location: 'Suburbs', urgency: 'Low', preferred_date: '2024-06-19', photo: '', status: 'open' }
    ];

    const requestIds = [];
    for (const request of serviceRequests) {
      const requestId = await runQuery(
        'INSERT INTO service_requests (user_id, vehicle_id, service_type, description, location, urgency, preferred_date, photo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userIds[request.userIdx], vehicleIds[request.vehicleIdx], request.service_type, request.description, request.location, request.urgency, request.preferred_date, request.photo, request.status]
      );
      requestIds.push(requestId);
    }
    console.log('Inserted service requests');

    // Insert quotes
    const quotes = [
      { requestIdx: 0, mechanicIdx: 0, cost: 50, time_required: '1h', parts_needed: 'Oil, filter', availability: '2024-06-10', status: 'pending' },
      { requestIdx: 1, mechanicIdx: 1, cost: 120, time_required: '2h', parts_needed: 'Brake pads', availability: '2024-06-12', status: 'pending' },
      { requestIdx: 2, mechanicIdx: 2, cost: 300, time_required: '4h', parts_needed: 'Transmission fluid', availability: '2024-06-11', status: 'pending' },
      { requestIdx: 3, mechanicIdx: 3, cost: 80, time_required: '1.5h', parts_needed: 'Diagnostic tools', availability: '2024-06-13', status: 'pending' },
      { requestIdx: 4, mechanicIdx: 4, cost: 40, time_required: '1h', parts_needed: 'None', availability: '2024-06-15', status: 'pending' }
    ];

    const quoteIds = [];
    for (const quote of quotes) {
      const quoteId = await runQuery(
        'INSERT INTO quotes (request_id, mechanic_id, cost, time_required, parts_needed, availability, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [requestIds[quote.requestIdx], mechanicIds[quote.mechanicIdx], quote.cost, quote.time_required, quote.parts_needed, quote.availability, quote.status]
      );
      quoteIds.push(quoteId);
    }
    console.log('Inserted quotes');

    // Insert bookings
    const bookings = [
      { quoteIdx: 0, clientIdx: 0, mechanicIdx: 0, scheduled_date: '2024-06-10', status: 'scheduled' },
      { quoteIdx: 1, clientIdx: 0, mechanicIdx: 1, scheduled_date: '2024-06-12', status: 'scheduled' },
      { quoteIdx: 2, clientIdx: 1, mechanicIdx: 2, scheduled_date: '2024-06-11', status: 'scheduled' }
    ];

    const bookingIds = [];
    for (const booking of bookings) {
      const bookingId = await runQuery(
        'INSERT INTO bookings (quote_id, client_id, mechanic_id, scheduled_date, status) VALUES (?, ?, ?, ?, ?)',
        [quoteIds[booking.quoteIdx], userIds[booking.clientIdx], mechanicIds[booking.mechanicIdx], booking.scheduled_date, booking.status]
      );
      bookingIds.push(bookingId);
    }
    console.log('Inserted bookings');

    // Insert reviews
    const reviews = [
      { bookingIdx: 0, reviewerIdx: 0, mechanicIdx: 0, rating: 5, comment: 'Great service!' },
      { bookingIdx: 1, reviewerIdx: 0, mechanicIdx: 1, rating: 4, comment: 'Quick and professional.' },
      { bookingIdx: 2, reviewerIdx: 1, mechanicIdx: 2, rating: 5, comment: 'Solved my issue fast.' }
    ];

    for (const review of reviews) {
      await runQuery(
        'INSERT INTO reviews (booking_id, reviewer_id, mechanic_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [bookingIds[review.bookingIdx], userIds[review.reviewerIdx], mechanicIds[review.mechanicIdx], review.rating, review.comment]
      );
    }
    console.log('Inserted reviews');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seed(); 