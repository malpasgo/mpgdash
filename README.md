# Invoice Management System

A comprehensive Invoice and Letter of Credit management system built with React, TypeScript, and Supabase.

## 🚀 Latest Deployment
**Live URL**: https://xq7vqrv8cwwq.space.minimax.io

## 📋 Features

### Invoice Management
- Create, edit, view, and delete invoices
- Support for multiple invoice types (Commercial, Proforma, Credit Note, Debit Note)
- Link invoices to Letter of Credits (LC)
- Sortable table with alternating row colors
- Advanced filtering and search functionality
- Automated payment status tracking
- PDF export functionality

### Letter of Credit Management
- Complete LC lifecycle management
- Document management with file uploads
- Amendment tracking and history
- Status tracking and expiry monitoring
- Sortable and filterable LC list

### Dashboard & Reporting
- Executive dashboard with key metrics
- Real-time data visualization
- Financial analytics and trends
- Export capabilities to Excel

## 🛠️ Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui Components
- **Backend**: Supabase (Database, Auth, Storage)
- **State Management**: React Context
- **Icons**: Lucide React
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **Excel Export**: XLSX

## 📁 Project Structure
```
src/
├── components/          # React components
├── lib/                # Utilities and Supabase client
├── contexts/           # React contexts
├── views/              # Page-specific components
└── styles/             # CSS and styling files

dist/                   # Built files for deployment
supabase/              # Supabase configuration
public/                # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Installation
1. Extract the zip file
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

### Development
```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Environment Setup
1. Create a `.env` file in the root directory
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 📊 Recent Updates
- ✅ Added sorting functionality to Invoice List (Invoice, Customer, Date, Due Date, Amount, Status)
- ✅ Implemented alternating row colors for better readability
- ✅ Enhanced dropdown display for LC selection in invoices
- ✅ Added placeholder text for date pickers
- ✅ Improved styling across LC Detail pages
- ✅ Modernized payment terms UI

## 🔧 Configuration Files
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `components.json` - Shadcn/ui components configuration

## 🔄 Supabase Keep-Alive (Auto-Pause Prevention)
Database Supabase Free Plan akan tetap aktif 24/7 dengan GitHub Actions yang ping setiap 6 hari.

**Quick Start**: Lihat [QUICKSTART_KEEPALIVE.md](QUICKSTART_KEEPALIVE.md) untuk setup dalam 5 menit.

**Dokumentasi Lengkap**: Lihat [KEEPALIVE_INDEX.md](KEEPALIVE_INDEX.md) untuk semua dokumentasi.

**Test**: Jalankan `npm run test:keepalive` untuk verifikasi setup.

### NPM Scripts untuk Keep-Alive
```bash
npm run test:keepalive      # Test keep-alive function
npm run check:supabase      # Check database status
```

## 📝 Database Schema
The system uses Supabase with the following main tables:
- `invoices` - Invoice records
- `letter_of_credits` - LC records
- `lc_documents` - LC document management
- `lc_amendments` - LC amendment tracking

## 🤝 Support
For technical support or questions, please refer to the documentation or contact the development team.

---

**Generated on**: August 24, 2025
**Version**: Latest with sorting functionality and UI improvements
"# mpgdash" 
