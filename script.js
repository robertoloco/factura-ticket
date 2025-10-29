// ============================================
// CONFIGURACIÓN - REEMPLAZA CON TUS VALORES
// ============================================

const CONFIG = {
    // EmailJS - Obtén estos valores de https://www.emailjs.com/
    emailjs: {
        serviceID:'service_ghupet9',      // Ej: 'service_abc123'
        templateID:'template_qwfj1lw',    // Ej: 'template_xyz789'
        userID:'_Boe_Y0g_Eh7f5UzK'         // Ej: 'user_xyz123abc456'
    },
    
    // Baserow - Obtén estos valores de tu cuenta Baserow
    baserow: {
        apiToken:'OC1ysglrfe1Ehk2xtFjmSWK6joU3RWHo',        // Ej: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
        tableID:'722224',          // Ej: '12345'
        apiURL:'https://api.baserow.io' // URL base de la API
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

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar EmailJS
    emailjs.init(CONFIG.emailjs.userID);

    // Event listeners
    document.getElementById('extractBtn').addEventListener('click', extractTextFromImage);
    document.getElementById('invoiceForm').addEventListener('submit', handleFormSubmit);
});

// ============================================
// EXTRACCIÓN DE TEXTO CON TESSERACT.js (OCR)
// ============================================

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

        // Ejecutar OCR
        const result = await Tesseract.recognize(
            imageFile,
            'spa', // Idioma español
            {
                logger: (m) => {
                    console.log(m);
                    if (m.status === 'recognizing text') {
                        const percent = Math.round(m.progress * 100);
                        document.querySelector('.progress-text').textContent = 
                            `Procesando imagen... ${percent}%`;
                    }
                }
            }
        );

        extractedText = result.data.text;

        // Mostrar resultado
        ocrResult.textContent = extractedText || 'No se pudo extraer texto de la imagen';
        ocrResult.classList.add('active');

        showStatus('Texto extraído correctamente. Revisa los datos y rellena el formulario.', 'success');

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
// ENVÍO DE EMAIL CON EmailJS
// ============================================

async function sendInvoiceByEmail(pdfDoc, data) {
    try {
        // Convertir PDF a base64
        const pdfBase64 = pdfDoc.output('dataurlstring').split(',')[1];

        // Parámetros para EmailJS
        const templateParams = {
            to_email: data.clientEmail,
            client_name: data.clientName,
            invoice_number: data.invoiceNumber,
            amount: data.amount,
            date: data.date,
            pdf_attachment: pdfBase64,
            pdf_filename: `Factura_${data.invoiceNumber}.pdf`
        };

        // Enviar email
        await emailjs.send(
            CONFIG.emailjs.serviceID,
            CONFIG.emailjs.templateID,
            templateParams
        );

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
