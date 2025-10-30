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

export const sendPasswordResetEmail = async (email, resetUrl) => {
    await transporter.sendMail({
        from: `Factura Ticket <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Recupera tu contraseña - Factura Ticket',
        html: `
            <h2>Recuperación de Contraseña</h2>
            <p>Has solicitado restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                Restablecer Contraseña
            </a>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p>${resetUrl}</p>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste este cambio, ignora este email.</p>
        `
    });
};
