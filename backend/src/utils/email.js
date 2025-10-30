import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

export const sendInvoiceEmail = async (invoice, pdfBuffer) => {
    await transporter.sendMail({
        from: `${invoice.company.name} <${process.env.GMAIL_USER}>`,
        to: invoice.client.email,
        cc: process.env.GMAIL_USER,
        subject: `Factura ${invoice.number} - ${invoice.company.name}`,
        html: `<h2>Factura ${invoice.number}</h2><p>Estimado/a ${invoice.client.name},</p><p>Adjuntamos su factura.</p>`,
        attachments: [{
            filename: `Factura_${invoice.number}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }]
    });
};
