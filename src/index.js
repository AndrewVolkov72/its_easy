import http from 'http';
import { createInterface } from 'node:readline/promises';
import { performance } from 'node:perf_hooks';

const hostname = '127.0.0.1'; /* в реальном прокте все в ENV */
const port = 5000; /* в реальном прокте все в ENV */

const REQUEST_COUNT = 10;
const BYTES_IN_MB = 1024 * 1024;

const server = http.createServer((req, res) => {
  res.statusCode = 204;
  res.end();
});


const downloadImage = async (imageUrl) => {
  const startTime = performance.now();

  const res = await fetch(imageUrl);

  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`);
  }

  const data = await res.arrayBuffer();

  const endTime = performance.now();

  return {
    time: endTime - startTime,
    size: data.byteLength,
  };
}

async function consoleInterfaceToUrlImg() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const url = await rl.question('Введите URL: ');

    const parsedUrl = new URL(url);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Поддерживаются только HTTP и HTTPS');
    }

    const durations = [];
    let totalSize = 0;

    const totalStartTime = performance.now();

    for (let i = 0; i < REQUEST_COUNT; i++) {
      console.log(`\nЗапрос ${i + 1}/${REQUEST_COUNT}...`);

      const result = await downloadImage(url);

      durations.push(result.time);
      totalSize += result.size;

      console.log(
        `Время: ${result.time.toFixed(2)} мс | ` +
        `Размер: ${(result.size / BYTES_IN_MB).toFixed(2)} МБ`
      );
    }

    const totalEndTime = performance.now();

    const totalDuration = totalEndTime - totalStartTime;

    const averageDuration = durations.reduce((sum, time) => sum + time, 0) / REQUEST_COUNT;

    const averageSpeed = totalSize / BYTES_IN_MB / (totalDuration / 1000);

    console.log('\n========== РЕЗУЛЬТАТ ==========');
    console.log(`Количество запросов: ${REQUEST_COUNT}`);
    console.log(`Среднее время: ${averageDuration.toFixed(2)} мс`);
    console.log(`Общий объём: ${(totalSize / BYTES_IN_MB).toFixed(2)} МБ`);
    console.log(`Общее время: ${(totalDuration / 1000).toFixed(2)} сек`);
    console.log(`Средняя скорость: ${averageSpeed.toFixed(2)} МБ/с`);
  } finally {
    rl.close();
  }
}

consoleInterfaceToUrlImg().catch((error) => {
  console.error('\nОшибка:', error.message);
  process.exitCode = 1;
});


server.listen(port, hostname, () => {
  console.log(`\nСервер запущен: http://${hostname}:${port}`);
});

server.on('error', (error) => {
  console.log(`\nСервер упал с ошибкой: ${error.message}`);
})