const db = require('../config/database');

const createTables = () => {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('client', 'mechanic')),
      phone TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);

    // Mechanics table
    db.run(`CREATE TABLE IF NOT EXISTS mechanics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      certification TEXT,
      specialization TEXT,
      service_area TEXT,
      rate REAL,
      verified INTEGER DEFAULT 0,
      availability TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );`);

    // Vehicles table
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      license_plate TEXT,
      vin TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );`);

    // Service Requests table
    db.run(`CREATE TABLE IF NOT EXISTS service_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      service_type TEXT NOT NULL,
      description TEXT,
      location TEXT,
      urgency TEXT,
      preferred_date TEXT,
      photo TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );`);

    // Quotes table
    db.run(`CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      mechanic_id INTEGER NOT NULL,
      cost REAL NOT NULL,
      time_required TEXT,
      parts_needed TEXT,
      availability TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
      FOREIGN KEY(mechanic_id) REFERENCES mechanics(id) ON DELETE CASCADE
    );`);

    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      mechanic_id INTEGER NOT NULL,
      scheduled_date TEXT,
      status TEXT DEFAULT 'scheduled',
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
      FOREIGN KEY(client_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(mechanic_id) REFERENCES mechanics(id) ON DELETE CASCADE
    );`);

    // Reviews table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      mechanic_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(mechanic_id) REFERENCES mechanics(id) ON DELETE CASCADE
    );`);

    // Indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    db.run('CREATE INDEX IF NOT EXISTS idx_mechanics_user_id ON mechanics(user_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_quotes_request_id ON quotes(request_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_reviews_mechanic_id ON reviews(mechanic_id);');

    console.log('All tables created successfully.');
  });
};

createTables(); 