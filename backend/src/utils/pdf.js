import { jsPDF } from 'jspdf';

export const generateInvoicePDF = async (invoice) => {
    const doc = new jsPDF();
    const primaryColor = [102, 126, 234];
    const darkGray = [51, 51, 51];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('FACTURA', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.company.name, 105, 30, { align: 'center' });

    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    let yPos = 50;
    doc.setFont(undefined, 'bold');
    doc.text('DATOS DEL EMISOR:', 20, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    doc.text(invoice.company.name, 20, yPos);
    yPos += 5;
    doc.text(`NIF: ${invoice.company.nif}`, 20, yPos);
    yPos += 5;
    doc.text(invoice.company.address, 20, yPos);
    yPos += 5;
    doc.text(invoice.company.email, 20, yPos);
    yPos += 5;
    doc.text(invoice.company.phone, 20, yPos);

    yPos = 50;
    doc.setFont(undefined, 'bold');
    doc.text('DATOS DEL CLIENTE:', 120, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    doc.text(invoice.client.name, 120, yPos);
    yPos += 5;
    doc.text(`NIF: ${invoice.client.nif}`, 120, yPos);
    yPos += 5;
    doc.text(invoice.client.address, 120, yPos, { maxWidth: 70 });
    yPos += 10;
    doc.text(invoice.client.email, 120, yPos);

    yPos = 100;
    doc.setFont(undefined, 'bold');
    doc.text(`Nº Factura: ${invoice.number}`, 20, yPos);
    doc.text(`Fecha: ${new Date(invoice.date).toLocaleDateString('es-ES')}`, 120, yPos);

    yPos += 5;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);

    yPos += 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, 170, 10, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('CONCEPTO', 25, yPos + 7);
    doc.text('IMPORTE', 160, yPos + 7);

    yPos += 15;
    doc.setFont(undefined, 'normal');
    const description = invoice.description || 'Servicios prestados';
    const splitDescription = doc.splitTextToSize(description, 120);
    doc.text(splitDescription, 25, yPos);
    doc.text(`${invoice.baseAmount.toFixed(2)} €`, 160, yPos);

    yPos += splitDescription.length * 5 + 10;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    doc.text('Base Imponible:', 120, yPos);
    doc.text(`${invoice.baseAmount.toFixed(2)} €`, 170, yPos);
    yPos += 7;
    doc.text(`IVA (${invoice.taxRate}%):`, 120, yPos);
    doc.text(`${invoice.taxAmount.toFixed(2)} €`, 170, yPos);
    yPos += 7;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 120, yPos);
    doc.text(`${invoice.totalAmount.toFixed(2)} €`, 170, yPos);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('Gracias por su confianza', 105, 280, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
};
