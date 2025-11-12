import protobuf from 'protobufjs';

const SERVER_URL = 'http://localhost:3000';
const NUM_REQUESTS = 5;

let EchoRequest, EchoResponse;

async function cargarProtobuf() {
  const root = await protobuf.load('./echo.proto');
  EchoRequest = root.lookupType('echo.EchoRequest');
  EchoResponse = root.lookupType('echo.EchoResponse');
}

async function testJSON() {
  console.log('\nProbando JSON...');
  const tamanos = [];

  for (let i = 1; i <= NUM_REQUESTS; i++) {
    const payload = { message: `Mensaje de prueba numero ${i}` };

    const response = await fetch(`${SERVER_URL}/echo/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const size = parseInt(response.headers.get('X-Response-Size'));
    tamanos.push(size);
    console.log(`  Request ${i}: ${size} bytes`);
  }

  const promedio = tamanos.reduce((a, b) => a + b, 0) / tamanos.length;
  return promedio;
}

async function testProtobuf() {
  console.log('\nProbando Protobuf...');
  const tamanos = [];

  for (let i = 1; i <= NUM_REQUESTS; i++) {
    const payload = { message: `Mensaje de prueba numero ${i}` };
    const requestMessage = EchoRequest.create(payload);
    const buffer = EchoRequest.encode(requestMessage).finish();

    const response = await fetch(`${SERVER_URL}/echo/protobuf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-protobuf' },
      body: buffer
    });

    const size = parseInt(response.headers.get('X-Response-Size'));
    tamanos.push(size);
    console.log(`  Request ${i}: ${size} bytes`);
  }

  const promedio = tamanos.reduce((a, b) => a + b, 0) / tamanos.length;
  return promedio;
}

async function ejecutar() {
  console.log('='.repeat(50));
  console.log('COMPARACION JSON vs PROTOBUF');
  console.log('='.repeat(50));

  try {
    await cargarProtobuf();

    const promedioJSON = await testJSON();
    const promedioProtobuf = await testProtobuf();

    console.log('\n' + '='.repeat(50));
    console.log('RESULTADOS');
    console.log('='.repeat(50));
    console.log(`JSON:     ${promedioJSON.toFixed(2)} bytes (promedio)`);
    console.log(`Protobuf: ${promedioProtobuf.toFixed(2)} bytes (promedio)`);
    
    const reduccion = ((promedioJSON - promedioProtobuf) / promedioJSON * 100);
    console.log(`\nProtobuf es ${reduccion.toFixed(2)}% mas compacto`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\nError:', error.message);
    console.error('Asegurate de que el servidor este corriendo (npm start)');
  }
}

ejecutar();