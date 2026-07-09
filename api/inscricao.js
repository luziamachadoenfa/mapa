module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const { nome, whatsapp, email, perfil } = req.body || {};

  if (!nome || !whatsapp || !email || !perfil) {
    res.status(400).json({ error: 'campos obrigatórios faltando' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'e-mail inválido' });
    return;
  }

  const whatsappDigits = whatsapp.replace(/\D/g, '');
  const whatsappE164 = '+' + (whatsappDigits.startsWith('55') ? whatsappDigits : '55' + whatsappDigits);

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          NOME: nome,
          WHATSAPP: whatsappE164,
          PERFIL: perfil
        },
        listIds: [Number(process.env.BREVO_LIST_ID)],
        updateEnabled: true
      })
    });

    if (!brevoRes.ok) {
      const errBody = await brevoRes.text();
      console.error('Brevo error:', brevoRes.status, errBody);
      res.status(502).json({ error: 'falha ao registrar inscrição', debug_status: brevoRes.status, debug_body: errBody });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao chamar Brevo:', err);
    res.status(500).json({ error: 'erro interno' });
  }
};
