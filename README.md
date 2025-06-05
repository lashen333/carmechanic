# MechConnect - Automotive Service Marketplace

MechConnect is a full-stack web application that connects vehicle owners with certified mechanics, streamlining the process of finding and booking automotive services.

## Features

- User authentication (clients and mechanics)
- Vehicle management for clients
- Service request creation and management
- Quote submission and comparison
- Booking system
- Review and rating system
- Real-time notifications
- Secure messaging system

## Tech Stack

### Backend
- Node.js with Express
- SQLite database
- JWT authentication
- RESTful API architecture

### Frontend
- React.js
- Material-UI
- React Router
- Axios for API calls
- React Hook Form for form handling

## Project Structure

```
MechConnect/
├── backend/           # Backend server and API
├── frontend/         # React frontend application
├── README.md         # Project documentation
└── .gitignore        # Git ignore file
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mechconnect.git
cd mechconnect
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in both backend and frontend directories
   - Update the variables with your configuration

5. Initialize the database:
```bash
cd backend
npm run db:init
npm run db:seed
```

6. Start the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Development

### Backend Development
- API endpoints are documented in the `/backend/routes` directory
- Database schema is defined in `/backend/database/init.js`
- Use `npm run dev` for development with hot-reload

### Frontend Development
- Components are organized by feature in `/frontend/src/components`
- Pages are in `/frontend/src/pages`
- Use `npm start` for development with hot-reload

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - your.email@example.com
Project Link: https://github.com/yourusername/mechconnect 