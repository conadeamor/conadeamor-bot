const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// ══════════════════════════════════════════════
// CONFIGURACIÓN — se llenan con las variables de entorno
// ══════════════════════════════════════════════
const TOKEN        = process.env.WHATSAPP_TOKEN;       // Token de acceso
const PHONE_ID     = process.env.PHONE_NUMBER_ID;      // 1120416664482930
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'conadeamor2024';

// ══════════════════════════════════════════════
// ESTADO DE CONVERSACIONES (en memoria)
// ══════════════════════════════════════════════
const sesiones = {};

// ══════════════════════════════════════════════
// ENVIAR MENSAJE
// ══════════════════════════════════════════════
async function enviarMensaje(telefono, texto) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: telefono,
      type: 'text',
      text: { body: texto }
    },
    { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } }
  );
}

// ══════════════════════════════════════════════
// MENÚ PRINCIPAL
// ══════════════════════════════════════════════
const MENU = `¡Hola! 👋 Soy Michelle Rivero, psicóloga clínica especialista en autismo (TEA). 💙

¿Qué estás buscando hoy?

1️⃣ Manual de autismo para familias y docentes
2️⃣ Agendar llamada gratuita de orientación
3️⃣ Taller relámpago — Cuerpos Validados
4️⃣ Terapia en línea (adolescentes y adultos)
5️⃣ Terapia presencial (niños)
6️⃣ Evaluación integral de autismo
7️⃣ Test gratuito de autismo — ¿podría ser autismo?
8️⃣ Tengo una duda, prefiero escribirle directamente

Responde con el número de tu opción 😊`;

// ══════════════════════════════════════════════
// RESPUESTAS POR OPCIÓN
// ══════════════════════════════════════════════
const RESPUESTAS = {
  '1': `📘 *Manual de Autismo — Con A de Amor*

Una guía práctica para familias y docentes que quieren entender y acompañar mejor a una persona con autismo.

✅ Incluye asesoría gratuita con Michelle
💰 $757 + IVA

🔗 Puedes adquirirlo aquí:
https://michellerivero.com/servicios/

¿Tienes alguna pregunta sobre el manual? Escríbeme y con gusto te respondo. 😊`,

  '2': `📅 *Llamada gratuita de orientación*

Una llamada de 15 minutos conmigo para resolver tus dudas sobre autismo, diagnóstico o terapia.

Es completamente gratuita y sin compromiso. 💙

🔗 Agenda aquí tu horario:
https://calendly.com/autismoconadeamor/llamada-inicial-gratuita`,

  '3': `🧠 *Taller — Cuerpos Validados, Almas Calmadas*

Dirigido a docentes y psicólogos escolares que trabajan con niños con autismo.

✅ Incluye PDF imprimible + video de asesoría
💰 $97 + IVA

🔗 Inscríbete aquí:
https://go.hotmart.com/C105389571B`,

  '4': `💻 *Terapia en línea*

Para adolescentes y adultos. Sesiones individuales por videollamada con Michelle Rivero.

Para conocer disponibilidad y tarifas, agenda una sesión de evaluación:

🔗 https://calendly.com/autismoconadeamor/sesion-de-evaluacion`,

  '5': `🏠 *Terapia presencial*

Exclusiva para niños con autismo (TEA).

Para conocer disponibilidad, ubicación y tarifas, agenda aquí:

🔗 https://calendly.com/autismoconadeamor/sesion-presencial`,

  '6': `🔬 *Evaluación Integral de Autismo*

La evaluación integral es un proceso clínico completo para obtener un diagnóstico formal de autismo (TEA).

Incluye entrevista clínica, aplicación de instrumentos validados y un reporte con los resultados y recomendaciones personalizadas.

Está disponible para niños, adolescentes y adultos. 💙

🔗 Conoce todos los detalles aquí:
https://michellerivero.com/servicios/evaluacion-integral/`,

  '7': `🧩 *Test gratuito de autismo*

¿Te has preguntado si podrías tener autismo? Este test de autoaplicación puede darte claridad.

✅ Completamente gratuito
✅ Incluye cuestionario de rasgos + sensibilidad auditiva
✅ Recibes tus resultados por correo

🔗 Haz el test aquí:
https://michellerivero.com/servicios/test-autoaplicacion/`,

  '8': `¡Claro! 😊 Escribe tu mensaje y te responderé a la brevedad. 💙`
};

// ══════════════════════════════════════════════
// WEBHOOK — VERIFICACIÓN
// ══════════════════════════════════════════════
app.get('/webhook', (req, res) => {
  if (
    req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === VERIFY_TOKEN
  ) {
    console.log('Webhook verificado ✓');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// ══════════════════════════════════════════════
// WEBHOOK — RECIBIR MENSAJES
// ══════════════════════════════════════════════
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const entry   = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;
    const msg     = value?.messages?.[0];
    if (!msg) return;

    const telefono = msg.from;
    const texto    = msg.text?.body?.trim() || '';
    const sesion   = sesiones[telefono] || { paso: 'inicio' };

    // Si ya eligió "tengo una duda" → no responder automáticamente
    if (sesion.paso === 'duda') return;

    // Si manda un número del menú
    if (['1','2','3','4','5','6','7','8'].includes(texto)) {
      sesiones[telefono] = { paso: texto === '8' ? 'duda' : 'menu' };
      await enviarMensaje(telefono, RESPUESTAS[texto]);
      if (texto !== '8') {
        setTimeout(async () => {
          await enviarMensaje(telefono,
            '¿Puedo ayudarte con algo más? Responde *menú* para ver las opciones de nuevo. 😊'
          );
        }, 3000);
      }
      return;
    }

    // Si escribe "menu" o "menú"
    if (['menu','menú','hola','inicio','hi','buenas','buenos'].some(p =>
      texto.toLowerCase().includes(p)
    )) {
      sesiones[telefono] = { paso: 'menu' };
      await enviarMensaje(telefono, MENU);
      return;
    }

    // Primera vez o mensaje desconocido → mostrar menú
    if (sesion.paso === 'inicio' || sesion.paso === 'menu') {
      sesiones[telefono] = { paso: 'menu' };
      await enviarMensaje(telefono, MENU);
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
});

// ══════════════════════════════════════════════
// INICIAR SERVIDOR
// ══════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot corriendo en puerto ${PORT} ✓`));
