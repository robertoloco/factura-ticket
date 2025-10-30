import FormData from 'form-data';
import fetch from 'node-fetch';

// Helper: Extract NIF/CIF from text
const extractNIF = (text) => {
    // Patrones para NIF/CIF españoles
    const patterns = [
        /\b([A-Z]\d{8})\b/g,  // CIF: A12345678
        /\b(\d{8}[A-Z])\b/g,  // NIF: 12345678A
        /\b([A-Z]\d{7}[A-Z])\b/g, // NIE: X1234567A
    ];

    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
            return matches[0];
        }
    }
    return null;
};

// Helper: Extract date from text
const extractDate = (text) => {
    // Patrones de fecha: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const patterns = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            let [_, day, month, year] = match;
            if (year.length === 2) {
                year = '20' + year;
            }
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
    return null;
};

// Helper: Extract amount (total)
const extractAmount = (text) => {
    // Buscar "TOTAL" seguido de cantidad
    const totalPattern = /total[:\s]*([0-9]+[,.]?[0-9]*)\s*€?/i;
    const totalMatch = text.match(totalPattern);
    if (totalMatch) {
        return parseFloat(totalMatch[1].replace(',', '.'));
    }

    // Buscar última cantidad con €
    const amountPattern = /([0-9]+[,.]?[0-9]*)\s*€/g;
    const amounts = [...text.matchAll(amountPattern)];
    if (amounts.length > 0) {
        const lastAmount = amounts[amounts.length - 1];
        return parseFloat(lastAmount[1].replace(',', '.'));
    }

    return null;
};

// Helper: Extract company name (first line usually)
const extractCompanyName = (text) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
        // Primera línea no vacía suele ser el nombre
        return lines[0].trim();
    }
    return null;
};

// Helper: Extract items from ticket
const extractItems = (text) => {
    const items = [];
    const lines = text.split('\n');
    
    // Buscar líneas que tengan formato: descripción + cantidad + precio
    const itemPattern = /(.+?)\s+(\d+[,.]?\d*)\s*x?\s*([0-9]+[,.]?[0-9]*)\s*€?/;
    
    for (const line of lines) {
        const match = line.match(itemPattern);
        if (match) {
            const [_, description, quantity, price] = match;
            items.push({
                description: description.trim(),
                quantity: parseFloat(quantity.replace(',', '.')),
                unitPrice: parseFloat(price.replace(',', '.')),
                totalPrice: parseFloat(quantity.replace(',', '.')) * parseFloat(price.replace(',', '.'))
            });
        }
    }
    
    return items;
};

export const extractTextFromImage = async (imageBuffer) => {
    try {
        const formData = new FormData();
        formData.append('file', imageBuffer, { filename: 'ticket.jpg', contentType: 'image/jpeg' });
        formData.append('language', 'spa');
        formData.append('isOverlayRequired', 'true'); // Para mejor OCR
        formData.append('apikey', process.env.OCR_API_KEY || 'K88796806988957');

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (!result.ParsedResults?.[0]) {
            throw new Error('OCR failed: ' + (result.ErrorMessage || 'Unknown error'));
        }

        const text = result.ParsedResults[0].ParsedText;
        
        // Extraer datos esenciales
        const companyName = extractCompanyName(text);
        const date = extractDate(text);
        const amount = extractAmount(text);
        const items = extractItems(text);

        return {
            companyName,  // Para ayudar a buscar la empresa
            date,         // Requerido
            amount,       // Requerido
            items,        // Opcional
            rawText: text,
            success: true
        };
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Error processing image: ' + error.message);
    }
};
