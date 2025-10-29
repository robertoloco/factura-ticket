// ============================================
// CONFIGURACIÓN - REEMPLAZA CON TUS VALORES
// ============================================

const CONFIG = {
    // OCR.space API - Obtén tu API key gratis en https://ocr.space/ocrapi
    ocrApiKey: 'K84401806388957',  // API Key gratuita (25,000 requests/mes)
    
    // Web3Forms - Obtén tu Access Key gratis en https://web3forms.com
    web3formsKey: '1e2404a9-8e95-4f07-9150-7614624d90f8',  // Reemplaza con tu Access Key
    
    // Baserow - Obtén estos valores de tu cuenta Baserow
    baserow: {
        apiToken: 'OC1ysglrfe1Ehk2xtFjmSWK6joU3RWHo',
        tableID: '722224',
        apiURL: 'https://api.baserow.io'
    },

    // Datos de tu empresa (para la factura)
    company: {
        name: 'Copisteria CADAFAL S.L.',
        nif: 'B12345678',
        address: 'Calle Principal 123, 28001 Madrid',
        email: 'almelaroberto26@gmail.com',
        phone: '+34 912 345 678'
    }
};

// ============================================
// VARIABLES GLOBALES
// ============================================

let extractedText = '';

// ============================================
// INICIALIZACIÓN
// ============================================

async function getNextInvoiceNumber() {
    try {
        // Obtener todas las facturas de Baserow
        const response = await fetch(
            `${CONFIG.baserow.apiURL}/api/database/rows/table/${CONFIG.baserow.tableID}/?user_field_names=true`,
            {
                headers: {
                    'Authorization': `Token ${CONFIG.baserow.apiToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('No se pudo obtener facturas');
        }

        const data = await response.json();
        const year = new Date().getFullYear();

        // Buscar el último número de factura del año actual
        let maxNumber = 0;
        const pattern = new RegExp(`^${year}-(\\d+)$`);
        
        if (data.results && data.results.length > 0) {
            for (const row of data.results) {
                const invoiceNum = row['Numero Factura'];
                const match = invoiceNum ? invoiceNum.match(pattern) : null;
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
        }

        // Generar siguiente número
        const nextNum = (maxNumber + 1).toString().padStart(3, '0');
        return `${year}-${nextNum}`;
    } catch (error) {
        console.error('Error generando número de factura:', error);
        // Fallback: generar basado en timestamp
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-3);
        return `${year}-${timestamp}`;
    }
}

// Autocompletar datos del cliente por NIF
async function autofillClientData() {
    const nifInput = document.getElementById('clientNIF');
    const nif = nifInput.value.trim();
    
    if (nif.length < 8) return; // Esperar a que tenga al menos 8 caracteres

    try {
        // Buscar en Baserow si existe este NIF
        const response = await fetch(
            `${CONFIG.baserow.apiURL}/api/database/rows/table/${CONFIG.baserow.tableID}/?user_field_names=true&search=${nif}`,
            {
                headers: {
                    'Authorization': `Token ${CONFIG.baserow.apiToken}`
                }
            }
        );

        if (!response.ok) return;

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            // Encontramos el cliente, autocompletar
            const client = data.results.find(row => row['NIF'] === nif);
            if (client) {
                document.getElementById('clientName').value = client['Cliente'] || '';
                document.getElementById('clientAddress').value = client['Direccion'] || '';
                document.getElementById('clientEmail').value = client['Email'] || '';
                showStatus('✅ Cliente encontrado. Datos autocompletados.', 'success');
                setTimeout(() => {
                    document.getElementById('statusMessage').style.display = 'none';
                }, 3000);
            }
        }
    } catch (error) {
        console.log('No se pudo buscar el cliente:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Generar número de factura automáticamente
    const invoiceNumber = await getNextInvoiceNumber();
    document.getElementById('invoiceNumber').value = invoiceNumber;
    document.getElementById('invoiceNumber').readOnly = true;

    // Event listeners
    document.getElementById('extractBtn').addEventListener('click', extractTextFromImage);
    document.getElementById('invoiceForm').addEventListener('submit', handleFormSubmit);
    
    // Autocompletar al escribir NIF
    document.getElementById('clientNIF').addEventListener('blur', autofillClientData);
});

// ============================================
// EXTRACCIÓN DE TEXTO CON OCR.space API
// ============================================

function parseOCRText(text) {
    // Buscar importe (total, importe, precio, etc.)
    const amountPatterns = [
        /total[:\s]*([0-9]+[,.]?[0-9]*)/i,
        /importe[:\s]*([0-9]+[,.]?[0-9]*)/i,
        /precio[:\s]*([0-9]+[,.]?[0-9]*)/i,
        /([0-9]+[,.]?[0-9]*)\s*€/,
        /€\s*([0-9]+[,.]?[0-9]*)/,
        /\b([0-9]+[,.]?[0-9]*)\b/g  // Último recurso: cualquier número
    ];

    let amount = '';
    for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            amount = match[1].replace(',', '.');
            break;
        }
    }

    // Si no encontramos importe con patrones específicos, buscar el número más grande
    if (!amount) {
        const numbers = text.match(/\b([0-9]+[,.]?[0-9]*)\b/g);
        if (numbers && numbers.length > 0) {
            // Convertir y buscar el más grande (probablemente el total)
            const parsed = numbers.map(n => parseFloat(n.replace(',', '.')));
            amount = Math.max(...parsed).toString();
        }
    }

    // Extraer texto como concepto (primeras líneas que no sean números)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let description = '';
    for (const line of lines) {
        if (line.length > 3 && !/^[0-9€.,\s]+$/.test(line)) {
            description = line.trim();
            break;
        }
    }

    return { amount, description };
}

async function extractTextFromImage() {
    const fileInput = document.getElementById('ticketImage');
    const ocrResult = document.getElementById('ocrResult');
    const ocrProgress = document.getElementById('ocrProgress');
    const extractBtn = document.getElementById('extractBtn');

    if (!fileInput.files || !fileInput.files[0]) {
        showStatus('Por favor, selecciona una imagen primero', 'error');
        return;
    }

    const imageFile = fileInput.files[0];

    try {
        // Mostrar barra de progreso
        ocrProgress.style.display = 'block';
        ocrResult.classList.remove('active');
        extractBtn.disabled = true;
        document.querySelector('.progress-text').textContent = 'Procesando imagen...';

        // Llamar a OCR.space API enviando el archivo directamente
        const formData = new FormData();
        formData.append('file', imageFile);  // Enviar archivo directamente
        formData.append('language', 'spa');
        formData.append('isOverlayRequired', 'false');
        formData.append('apikey', CONFIG.ocrApiKey);

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.IsErroredOnProcessing && result.ParsedResults && result.ParsedResults[0]) {
            extractedText = result.ParsedResults[0].ParsedText;

            // Auto-rellenar campos del formulario
            const parsed = parseOCRText(extractedText);
            if (parsed.amount) {
                document.getElementById('amount').value = parsed.amount;
            }
            if (parsed.description) {
                document.getElementById('description').value = parsed.description;
            }

            // Mostrar mensaje de éxito
            showStatus('✅ Datos extraídos correctamente del ticket. Verifica el importe y concepto.', 'success');
            setTimeout(() => {
                document.getElementById('statusMessage').style.display = 'none';
            }, 4000);
        } else {
            throw new Error(result.ErrorMessage || 'Error en el procesamiento OCR');
        }

    } catch (error) {
        console.error('Error en OCR:', error);
        showStatus('Error al procesar la imagen. Por favor, intenta con otra imagen.', 'error');
    } finally {
        ocrProgress.style.display = 'none';
        extractBtn.disabled = false;
    }
}


// ============================================
// GENERACIÓN DE PDF CON jsPDF
// ============================================

function generateInvoicePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configuración de colores
    const primaryColor = [102, 126, 234];
    const darkGray = [51, 51, 51];

    // Encabezado
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('FACTURA', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(CONFIG.company.name, 105, 30, { align: 'center' });

    // Información de la empresa
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    let yPos = 50;
    doc.text('DATOS DEL EMISOR:', 20, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    doc.text(CONFIG.company.name, 20, yPos);
    yPos += 5;
    doc.text(`NIF: ${CONFIG.company.nif}`, 20, yPos);
    yPos += 5;
    doc.text(CONFIG.company.address, 20, yPos);
    yPos += 5;
    doc.text(CONFIG.company.email, 20, yPos);
    yPos += 5;
    doc.text(CONFIG.company.phone, 20, yPos);

    // Información del cliente
    yPos = 50;
    doc.setFont(undefined, 'bold');
    doc.text('DATOS DEL CLIENTE:', 120, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    doc.text(data.clientName, 120, yPos);
    yPos += 5;
    doc.text(`NIF: ${data.clientNIF}`, 120, yPos);
    yPos += 5;
    doc.text(data.clientAddress, 120, yPos, { maxWidth: 70 });
    yPos += 10;
    doc.text(data.clientEmail, 120, yPos);

    // Número de factura y fecha
    yPos = 100;
    doc.setFont(undefined, 'bold');
    doc.text(`Nº Factura: ${data.invoiceNumber}`, 20, yPos);
    doc.text(`Fecha: ${data.date}`, 120, yPos);

    // Línea separadora
    yPos += 5;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);

    // Tabla de conceptos
    yPos += 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, 170, 10, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('CONCEPTO', 25, yPos + 7);
    doc.text('IMPORTE', 160, yPos + 7);

    yPos += 15;
    doc.setFont(undefined, 'normal');
    const description = data.description || 'Servicios prestados';
    const splitDescription = doc.splitTextToSize(description, 120);
    doc.text(splitDescription, 25, yPos);
    doc.text(`${data.amount} €`, 160, yPos);

    // Totales
    yPos += splitDescription.length * 5 + 10;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    const iva = (data.amount * 0.21).toFixed(2);
    const total = (parseFloat(data.amount) + parseFloat(iva)).toFixed(2);

    doc.text('Base Imponible:', 120, yPos);
    doc.text(`${data.amount} €`, 170, yPos);
    yPos += 7;
    doc.text('IVA (21%):', 120, yPos);
    doc.text(`${iva} €`, 170, yPos);
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 120, yPos);
    doc.text(`${total} €`, 170, yPos);

    // Pie de página
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('Gracias por su confianza', 105, 280, { align: 'center' });

    return doc;
}

// ============================================
// ENVÍO DE EMAIL CON Web3Forms
// ============================================

async function sendInvoiceByEmail(pdfDoc, data) {
    try {
        // Crear FormData
        const formData = new FormData();
        formData.append('access_key', CONFIG.web3formsKey);
        formData.append('subject', `Factura ${data.invoiceNumber} - ${CONFIG.company.name}`);
        formData.append('from_name', CONFIG.company.name);
        formData.append('email', data.clientEmail);  // Email del cliente (destinatario)
        formData.append('name', data.clientName);
        
        // Calcular total con IVA
        const iva = (parseFloat(data.amount) * 0.21).toFixed(2);
        const total = (parseFloat(data.amount) + parseFloat(iva)).toFixed(2);
        
        // Mensaje del email (SIN ADJUNTO)
        const message = `
Estimado/a ${data.clientName},

Se ha generado la factura número ${data.invoiceNumber} con fecha ${data.date}.

Detalles de la factura:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Número: ${data.invoiceNumber}
Concepto: ${data.description || 'Servicios prestados'}
Base Imponible: ${data.amount}€
IVA (21%): ${iva}€
TOTAL: ${total}€
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El PDF de la factura se ha descargado automáticamente en su navegador.

Saludos cordiales,
${CONFIG.company.name}
${CONFIG.company.email}
${CONFIG.company.phone}
        `;
        
        formData.append('message', message);

        // Enviar email (SIN ADJUNTO para evitar cobro)
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Error al enviar el email');
        }

        return true;
    } catch (error) {
        console.error('Error enviando email:', error);
        throw error;
    }
}

// ============================================
// GUARDAR DATOS EN BASEROW
// ============================================

async function saveToBaserow(data) {
    try {
        const response = await fetch(
            `${CONFIG.baserow.apiURL}/api/database/rows/table/${CONFIG.baserow.tableID}/`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${CONFIG.baserow.apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'Numero Factura': data.invoiceNumber,
                    'Fecha': data.date,
                    'Cliente': data.clientName,
                    'NIF': data.clientNIF,
                    'Direccion': data.clientAddress,
                    'Email': data.clientEmail,
                    'Importe': parseFloat(data.amount),
                    'Total con IVA': parseFloat(data.amount) * 1.21,
                    'Concepto': data.description || 'Servicios prestados'
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Error al guardar en Baserow: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error guardando en Baserow:', error);
        throw error;
    }
}

// ============================================
// MANEJO DEL FORMULARIO
// ============================================

async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';

    try {
        // Recoger datos del formulario
        const formData = {
            clientName: document.getElementById('clientName').value,
            clientNIF: document.getElementById('clientNIF').value,
            clientAddress: document.getElementById('clientAddress').value,
            clientEmail: document.getElementById('clientEmail').value,
            amount: parseFloat(document.getElementById('amount').value).toFixed(2),
            invoiceNumber: document.getElementById('invoiceNumber').value,
            description: document.getElementById('description').value,
            date: new Date().toLocaleDateString('es-ES')
        };

        // 1. Generar PDF
        showStatus('Generando PDF...', 'success');
        const pdfDoc = generateInvoicePDF(formData);

        // 2. Enviar email
        showStatus('Enviando factura por email...', 'success');
        await sendInvoiceByEmail(pdfDoc, formData);

        // 3. Guardar en Baserow
        showStatus('Guardando datos en base de datos...', 'success');
        await saveToBaserow(formData);

        // 4. Descargar PDF localmente
        pdfDoc.save(`Factura_${formData.invoiceNumber}.pdf`);

        // Mensaje de éxito
        showStatus(
            `✅ ¡Factura generada correctamente!\n\n` +
            `- PDF descargado\n` +
            `- Email enviado a ${formData.clientEmail}\n` +
            `- Datos guardados en Baserow`,
            'success'
        );

        // Limpiar formulario
        document.getElementById('invoiceForm').reset();

    } catch (error) {
        console.error('Error:', error);
        showStatus(
            `❌ Error al procesar la factura: ${error.message}\n\n` +
            `Verifica tu configuración de EmailJS y Baserow.`,
            'error'
        );
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generar y Enviar Factura';
    }
}

// ============================================
// UTILIDADES
// ============================================

function showStatus(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';

    // Scroll al mensaje
    statusDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto-ocultar después de 5 segundos si es error
    if (type === 'error') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}
