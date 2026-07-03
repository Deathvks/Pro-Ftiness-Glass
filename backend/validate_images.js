const mysql = require('mysql2/promise');

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'pro_fitness_glass'
  });

  const [rows] = await conn.execute('SELECT id, image_url_start FROM exercise_list WHERE image_url_start IS NOT NULL');
  console.log(`Checking ${rows.length} images...`);

  let invalidCount = 0;
  
  // Procesar en lotes de 20 para no saturar
  const batchSize = 20;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    const promises = batch.map(async (row) => {
      const isValid = await checkUrl(row.image_url_start);
      if (!isValid) {
        await conn.execute('UPDATE exercise_list SET image_url_start = NULL WHERE id = ?', [row.id]);
        invalidCount++;
      }
    });

    await Promise.all(promises);
    console.log(`Processed ${Math.min(i + batchSize, rows.length)}/${rows.length}...`);
  }

  console.log(`Finished. Removed ${invalidCount} dead image links.`);
  await conn.end();
})();
