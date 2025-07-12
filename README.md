
# PaComprar-Frontend

PaComprar-Frontend is a web application built with [Next.js](https://nextjs.org), designed to facilitate online auctions and purchases. Users can register, log in, create and manage auctions, place bids, and interact with other users. The project features a modern UI, authentication, user profiles, password management, and a variety of components for a seamless experience.

## Features

- **User Authentication:** Register, log in, and manage your account securely.
- **Auction Management:** Create, edit, and view auctions, including your own and others'.
- **Bidding System:** Place and edit bids on active auctions.
- **User Profile:** View and update your profile, change your password, and see your bidding history.
- **Comments & Ratings:** Leave comments and rate auctions using a star rating system.
- **Responsive Design:** Optimized for desktop and mobile devices.
- **Custom Components:** Includes Navbar, Footer, AuctionItem, Comments, EditBidModal, PasswordChangeForm, Register, StarRating, and more.

## Project Structure

- `app/` - Main application pages and routing (login, registration, auctions, user profile, etc.)
- `components/` - Reusable UI components (Navbar, Footer, AuctionItem, Comments, etc.)
- `config/` - Configuration files (API config)
- `contexts/` - React context providers (AuthContext)
- `hooks/` - Custom React hooks (useAuthFetch)
- `public/` - Static assets (images, icons, videos)
- `services/` - Service files for API interactions (auth.service.js)

## Getting Started

## Getting Started


To run the development server:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

You can start editing the main page by modifying `app/page.jsx`. The app supports hot-reloading for fast development.

Fonts are optimized and loaded using [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts), featuring [Geist](https://vercel.com/font).


## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Features and API reference.
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial.
- [Next.js GitHub repository](https://github.com/vercel/next.js)


## Deploy on Vercel

Deploy your Next.js app easily using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.

## Collaborators

- Miguel Ángel Vallejo ([GitHub](https://github.com/mangelv011)) 
- Javier Viseras ([GitHub](https://github.com/JVISERASS)) 