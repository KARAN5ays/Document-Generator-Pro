# Document Generation & Verification System

A React single-page application for creating and verifying documents (Certificates, Vouchers, Receipts) with unique verification codes.

## Features

- **Data Entry Form**: Choose document type (Certificate, Voucher, Receipt) and enter Name, Date, and Amount
- **PDF Previewer**: Styled document preview with unique code assignment and PDF download via print dialog
- **Verification Tool**: Verify document authenticity by entering its unique code

## Tech Stack

- Vite
- React 18
- Tailwind CSS
- react-to-print

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. Fill in the Data Entry Form with the recipient name, date, and amount
2. Click **Generate Document** to create a document with a unique 8-character code
3. Preview the document and click **Download PDF** to save or print
4. To verify a document, enter its code in the Verification Tool and click **Verify**
