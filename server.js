import express, { json } from 'express';
import protobuf from 'protobufjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
// Middleware para protobuf - acepta varios tipos de contenido binario
app.use('/echo/protobuf', express.raw({
  type: ['application/x-protobuf', 'application/octet-stream', '*/*'],
  limit: '10mb'
}));

let EchoRequest, EchoResponse;

async function cargarProtobuf() {
  const root = await protobuf.load(join(__dirname, 'echo.proto'));
  EchoRequest = root.lookupType('echo.EchoRequest');
  EchoResponse = root.lookupType('echo.EchoResponse');
}

app.post('/echo/json', (req, res) => {
  const { message } = req.body;
  
  const response = {
    message: message,
    timestamp: Date.now()
  };

  const responseSize = JSON.stringify(response).length;
  res.set('X-Response-Size', responseSize);
  res.json(response);

  console.log(`[JSON] Tamaño: ${responseSize} bytes`);
});

app.post('/echo/protobuf', (req, res) => {
  try {
    // Verificar que req.body es un Buffer
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        error: 'El body debe ser un Buffer de protobuf',
        receivedType: typeof req.body,
        contentType: req.headers['content-type']
      });
    }

    const requestMessage = EchoRequest.decode(req.body);

    const responsePayload = {
      message: requestMessage.message,
      timestamp: Date.now()
    };

    const responseMessage = EchoResponse.create(responsePayload);
    const buffer = EchoResponse.encode(responseMessage).finish();

    res.set('Content-Type', 'application/x-protobuf');
    res.set('X-Response-Size', buffer.length);
    res.send(buffer);

    console.log(`[Protobuf] Tamaño: ${buffer.length} bytes`);
  } catch (error) {
    console.error('Error procesando protobuf:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({
    servicio: 'Servicio de Eco - JSON vs Protobuf',
    endpoints: {
      json: 'POST /echo/json',
      protobuf: 'POST /echo/protobuf'
    }
  });
});

await cargarProtobuf();

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('Servicio de Eco - JSON vs Protobuf');
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log('='.repeat(50));
  console.log('Endpoints:');
  console.log('  POST /echo/json');
  console.log('  POST /echo/protobuf');
  console.log('='.repeat(50));
});