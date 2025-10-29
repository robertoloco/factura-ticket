# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**factura-ticket** is a client-side web application for automated invoice generation from receipt images using OCR (Optical Character Recognition). The application runs entirely in the browser without requiring a backend server, making it ideal for deployment on GitHub Pages.

### Key Features
- Extract text from ticket/receipt images using Tesseract.js OCR
- Generate professional PDF invoices with jsPDF
- Send invoices via email using EmailJS
- Store invoice records in Baserow database via REST API
- 100% client-side, no backend required

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **OCR**: Tesseract.js v5 (Spanish language support)
- **PDF Generation**: jsPDF v2.5.1
- **Email Service**: EmailJS v4
- **Database**: Baserow REST API
- **Deployment**: GitHub Pages

## Project Structure

```
/
├── index.html          # Main application interface
├── style.css          # Application styling (gradient design, responsive)
├── script.js          # Core application logic
├── libs/              # Third-party JavaScript libraries
│   ├── tesseract.min.js
│   ├── jspdf.umd.min.js
│   └── email.min.js
├── README.md          # User documentation
└── WARP.md           # This file
```

## Development Setup

### 1. Download Required Libraries

The application requires three external libraries to be placed in the `libs/` directory:

```powershell
# From project root directory
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js" -OutFile "libs/tesseract.min.js"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" -OutFile "libs/jspdf.umd.min.js"
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js" -OutFile "libs/email.min.js"
```

### 2. Configure External Services

Edit the `CONFIG` object in `script.js` (lines 5-28) with your credentials:

**EmailJS Configuration:**
- Register at https://www.emailjs.com/
- Create an email service (Gmail, Outlook, etc.)
- Create an email template with parameters: `to_email`, `client_name`, `invoice_number`, `amount`, `date`
- Obtain: Service ID, Template ID, Public Key

**Baserow Configuration:**
- Register at https://baserow.io/
- Create a table with columns: `Numero Factura`, `Fecha`, `Cliente`, `NIF`, `Email`, `Importe`, `Total con IVA`, `Concepto`
- Generate API token: Settings → API tokens
- Obtain Table ID from the browser URL

**Company Information:**
- Update company details in `CONFIG.company` object

### 3. Local Testing

Since this is a static site, use any local web server:

```powershell
# Python 3
python -m http.server 8000

# Or use VS Code Live Server extension
```

Navigate to `http://localhost:8000`

## Architecture & Code Organization

### script.js Structure

The application follows a functional programming approach with clear separation of concerns:

1. **Configuration Block** (lines 5-28): All API credentials and company data
2. **Initialization** (lines 40-47): DOM ready handler, EmailJS initialization, event binding
3. **OCR Module** (lines 53-103): Tesseract.js integration with progress tracking
4. **PDF Generation** (lines 109-214): jsPDF document creation with custom styling
5. **Email Module** (lines 220-248): EmailJS integration with PDF attachment
6. **Database Module** (lines 254-286): Baserow API integration
7. **Form Handler** (lines 292-350): Main workflow orchestration
8. **Utilities** (lines 356-371): Status messaging and UI helpers

### Key Design Patterns

- **Async/Await**: All external API calls use async/await for clean error handling
- **Try/Catch**: Comprehensive error handling with user-friendly messages
- **Progressive Enhancement**: UI updates provide real-time feedback
- **Single Responsibility**: Each function handles one specific task

### Data Flow

1. User uploads image → OCR extracts text → Display result
2. User fills form → Validate → Generate PDF → Send email → Save to Baserow → Download PDF
3. Each step shows status updates and can fail independently without breaking the workflow

## Common Development Tasks

### Modifying the Invoice PDF Layout

Edit the `generateInvoicePDF()` function in `script.js` (lines 109-214). The PDF uses:
- A4 format (210mm width)
- Coordinate system starts at top-left (0,0)
- Company header: gradient fill, white text
- Two-column layout for issuer/client data
- Table structure for line items
- Automatic IVA (21%) calculation

### Changing the Baserow Schema

If you modify the Baserow table structure, update the `saveToBaserow()` function (lines 254-286) to match your column names exactly.

### Customizing Email Templates

The email template must include attachment support. In EmailJS template editor:
- Add an attachment field
- Reference it as `{{pdf_attachment}}`
- Set filename using `{{pdf_filename}}`

### Styling Changes

The application uses a purple gradient theme. To modify:
- Primary color: `#667eea` (defined in CSS and PDF generation)
- Secondary: `#764ba2`
- Success: `#28a745`
- Responsive breakpoint: `600px`

## Deployment to GitHub Pages

```bash
# Add and commit all files
git add .
git commit -m "Initial invoice generator setup"
git push origin main

# Enable GitHub Pages
# Repository Settings → Pages → Source: main branch / root
```

The site will be available at: `https://[username].github.io/factura-ticket/`

## Security Considerations

⚠️ **Important**: All API credentials in `script.js` are exposed in the browser.

**Mitigations:**
- EmailJS: Configure allowed domains in dashboard to prevent abuse
- Baserow: Use tokens with minimum permissions (write-only to specific table)
- GitHub Pages: Consider using environment-specific configs
- For production: Implement a backend proxy for sensitive operations

## Troubleshooting

### OCR Not Working
- Tesseract.js downloads language data on first use (~2MB)
- Ensure images are clear, high-contrast, and text is horizontal
- Processing time: 5-15 seconds depending on image size
- Check browser console for Tesseract.js errors

### Email Sending Fails
- Verify EmailJS credentials in CONFIG object
- Check template parameters match exactly
- EmailJS has rate limits on free tier
- Open browser console to see detailed error messages

### Baserow API Errors
- Verify API token has write permissions
- Table ID must match exactly (numeric only)
- Column names are case-sensitive
- CORS errors indicate token/permission issues

### PDF Not Generating
- Ensure jspdf.umd.min.js is loaded (check Network tab)
- Company data must be configured in CONFIG object
- Check console for jsPDF errors

## Testing

No automated tests are configured. Manual testing checklist:

- [ ] Upload various image formats (JPG, PNG)
- [ ] Test OCR with different ticket types
- [ ] Verify PDF generation with various amounts
- [ ] Confirm email delivery to test address
- [ ] Check Baserow records are created correctly
- [ ] Test on mobile devices (responsive design)
- [ ] Verify error handling with invalid inputs

## Browser Compatibility

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Supported (may have minor CSS differences)
- Mobile browsers: ✅ Responsive design

Requires modern browser with ES6+ support (async/await, fetch API).
