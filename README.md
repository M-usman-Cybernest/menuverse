# MenuVerse 🚀

MenuVerse is a cutting-edge, mobile-first AR Menu SaaS platform designed to transform traditional dining into an immersive digital experience. Built with Next.js 15, it empowers business owners to showcase their dishes in stunning 3D and Augmented Reality (AR) directly from the browser.

---

## ✨ Core Features

### 🕶️ Augmented Reality & 3D Visualization
- **Immersive Previews**: High-fidelity 3D models powered by Google's `<model-viewer>`.
- **Cross-Platform AR**: Automatic support for **iOS (USDZ)** via Quick Look and **Android/Web (GLB)** via WebXR.
- **Tableside Experience**: Customers can "place" digital dishes on their table to see proportions and presentation before ordering.
- **Dynamic QR Codes**: Every menu item generates a unique QR code that launches the AR experience directly.

### 📁 Smart Asset Management
- **Google Drive Integration**: Automated upload flow where menu assets (images and 3D models) are stored securely in the cloud.
- **CORS-Aware Proxying**: Custom API routes to bypass Google Drive's restricted access, ensuring seamless loading of large 3D files.
- **Smart Sizing**: Automatic enforcement of file limits (20MB) with user-friendly error reporting.

### 🛠️ Robust Admin Dashboard
- **Inventory**: Intuitive management of categories and Inventory.
- **Branch Management**: Support for multiple locations and custom business branches.
- **Role-Based Access**: Secure dashboard protected by JWT-based authentication for Admins and Owners.
- **Live Statistics**: Overview of business performance and item popularity.

---

## 🛠️ Technical Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **3D Engine**: [@google/model-viewer](https://modelviewer.dev/)
- **Authentication**: JWT Cookie-based Session Management
- **Cloud Storage**: Google Drive API

---

## 🗺️ Route Architecture

### 🏠 Public View
- `/`: The primary business storefront.
- `/[slug]`: Branch-specific menu pages with filtered categories.
- `?item=[id]`: Direct-to-AR routing for specific Inventory.

### 🛡️ Dashboard (Protected)
- `/dashboard`: Analytics and overview.
- `/dashboard/menu`: The core Menu & Category editor.
- `/dashboard/google-connect`: OAuth flow for Google Drive storage.
- `/dashboard/qr`: Centralized QR code management.
- `/dashboard/branches`: Multi-location management.
- `/dashboard/users`: Admin-level user control.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+
- MongoDB instance (or uses in-memory dev store)
- Google Cloud Console Project (for Google Drive storage)

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local` and configure your keys:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

### 4. Database Seeding
```bash
npm run seed
```

### 5. Launch
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔒 Security & Performance
- **Role-Aware Guards**: Middleware-based protection for sensitive routes.
- **Optimized Media**: Lazy-loaded 3D models and optimized images for fast mobile performance.
- **SEO Ready**: Semantic HTML5 and metadata management for maximum search visibility.

---

Built with  by the MenuVerse Team.
