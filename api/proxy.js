// api/proxy.js
export const config = {
  api: {
    bodyParser: false, // Esencial para no corromper el payload binario
  },
};

export default async function handler(req, res) {
  // 1. Manejo de CORS (Preflight) para el reproductor web
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // 2. Extraer parámetros de la URL
  const { deviceId, Authorization } = req.query;
  if (!deviceId || !Authorization) {
    return res.status(400).send('Faltan parámetros de autorización.');
  }

  const targetUrl = `https://gowv.izzigo.tv:8063/?deviceId=${encodeURIComponent(deviceId)}&Authorization=${encodeURIComponent(Authorization)}`;

  try {
    // 3. Reenviar el flujo binario (req) con fetch nativo (Node 18+)
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: req,
      headers: {
        'Host': 'gowv.izzigo.tv',
        'Origin': 'chrome-extension://cjfbmleiaobegagekpmlhmaadepdeedn',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
        'Content-Type': req.headers['content-type'] || 'application/octet-stream',
      },
      duplex: 'half' // Requerido en Node fetch al enviar un stream
    });

    // 4. Procesar la respuesta binaria
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Devolver la licencia al reproductor
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    res.status(response.status).send(buffer);
  } catch (error) {
    console.error('Error en el proxy:', error);
    res.status(500).send('Error interno del servidor proxy');
  }
}
