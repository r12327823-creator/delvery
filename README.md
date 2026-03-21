# Market 2 Home

A hyperlocal delivery web platform connecting customers, vendors, and riders.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### Setup

**1. Database Setup**
```bash
# Create PostgreSQL database
createdb market2home

# Run the schema
psql -U postgres -d market2home -f server/config/schema.sql
```

**2. Configure Environment**
```bash
cp .env .env.local
# Edit .env with your PostgreSQL credentials and API keys
```

**3. Install Dependencies**
```bash
npm run install:all
```

**4. Start Development Server**
```bash
npm run dev
```

This starts both backend (port 5000) and frontend (port 3000).

## Portals

| Portal | URL | Default Login |
|--------|-----|---------------|
| Customer | http://localhost:3000/customer | Mobile + OTP |
| Vendor | http://localhost:3000/vendor | Mobile + OTP |
| Rider | http://localhost:3000/rider | Mobile + OTP |
| Admin | http://localhost:3000/admin | Mobile: `9999999999` |

## Tech Stack

- **Frontend**: React, React Router, Leaflet.js (maps)
- **Backend**: Node.js, Express, PostgreSQL
- **Auth**: JWT + OTP
- **Maps**: OpenStreetMap (free, no API key)
- **SMS**: MSG91/Fast2SMS (configure in .env)

## Project Structure

```
market2home/
├── server/
│   ├── config/         # Database config & schema
│   ├── middleware/      # Auth middleware
│   ├── models/          # (DB-based, no ORM)
│   ├── routes/          # API routes
│   ├── utils/           # OTP, helpers
│   └── index.js         # Server entry
├── client/
│   ├── src/
│   │   ├── components/   # Shared components
│   │   ├── context/      # Auth context
│   │   ├── pages/       # Portal pages
│   │   └── utils/       # API client
│   └── public/
└── .env                 # Environment variables
```

## Order Flow

1. Customer places order → Status: `placed`
2. Vendor accepts → Status: `accepted`
3. Vendor marks ready → Status: `ready_for_pickup`
4. Rider accepts → Status: `rider_assigned`
5. Rider picks up → Status: `picked_up`
6. Rider delivers → Status: `delivered`

## Platform Fees (Configurable)

- Delivery Fee: ₹40 (customer pays)
- Rider Earnings: ₹30 per delivery
- Platform Commission: ₹10 per delivery + 10% from vendor

## TODO (Phase 2)

- Hindi language support
- Customer ratings and reviews
- Promotional coupons
- Scheduled delivery
- Push notifications
