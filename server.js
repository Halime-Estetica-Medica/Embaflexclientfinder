const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Permite llamadas desde el navegador

// ─── Ruta de salud ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', servicio: 'Embaflex Mailer' });
});

// ─── Ruta de envío de mail ───────────────────────────────────────────────────
app.post('/send-email', async (req, res) => {
  const { smtp, to, subject, text, html } = req.body;

  if (!smtp || !to || !subject) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: smtp, to, subject' });
  }

  // Crear transporter con los datos SMTP que manda la app
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: parseInt(smtp.port) || 587,
    secure: parseInt(smtp.port) === 465, // true solo para puerto 465
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${smtp.nombre || 'Embaflex'}" <${smtp.user}>`,
      to,
      subject,
      text: text || '',
      html: html || text?.replace(/\n/g, '<br>') || '',
    });

    console.log(`✓ Mail enviado a ${to} — ID: ${info.messageId}`);
    res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error(`✗ Error al enviar a ${to}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Ruta de envío masivo ────────────────────────────────────────────────────
app.post('/send-bulk', async (req, res) => {
  const { smtp, recipients, subject, templateBody } = req.body;
  // recipients: [{ email, empresa, contacto, rubro }]

  if (!smtp || !recipients?.length || !subject || !templateBody) {
    return res.status(400).json({ error: 'Faltan campos: smtp, recipients, subject, templateBody' });
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: parseInt(smtp.port) || 587,
    secure: parseInt(smtp.port) === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  const results = [];

  for (const r of recipients) {
    // Reemplazar variables en asunto y cuerpo
    const finalSubject = subject
      .replace(/{{empresa}}/g, r.empresa || '')
      .replace(/{{contacto}}/g, r.contacto || '')
      .replace(/{{rubro}}/g, r.rubro || '');

    const finalBody = templateBody
      .replace(/{{empresa}}/g, r.empresa || '')
      .replace(/{{contacto}}/g, r.contacto || '')
      .replace(/{{rubro}}/g, r.rubro || '')
      .replace(/{{vendedor}}/g, smtp.nombre || '');

    try {
      await transporter.sendMail({
        from: `"${smtp.nombre || 'Embaflex'}" <${smtp.user}>`,
        to: r.email,
        subject: finalSubject,
        text: finalBody,
        html: finalBody.replace(/\n/g, '<br>'),
      });
      results.push({ email: r.email, status: 'ok' });
      console.log(`✓ Enviado a ${r.email}`);
      // Pausa de 1.5s entre mails para no ser marcado como spam
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err) {
      results.push({ email: r.email, status: 'error', mensaje: err.message });
      console.error(`✗ Error con ${r.email}:`, err.message);
    }
  }

  res.json({ ok: true, results });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Embaflex Mailer corriendo en puerto ${PORT}`);
});
