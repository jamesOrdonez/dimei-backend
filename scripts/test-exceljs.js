const ExcelJS = require('exceljs');
const fs = require('fs');

async function test() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Test');
  ws.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Foto', key: 'photo', width: 20 },
  ];
  ws.addRow({ id: 1 });
  ws.getRow(2).height = 60;
  
  // Create 1x1 transparent png buffer for test
  const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const imgId = wb.addImage({
    buffer: png1x1,
    extension: 'png',
  });
  ws.addImage(imgId, {
    tl: { col: 1.1, row: 1.1 },
    ext: { width: 80, height: 50 },
    editAs: 'oneCell',
  });
  
  const buf = await wb.xlsx.writeBuffer();
  console.log('Success, buffer length:', buf.length);
}

test().catch(console.error);
