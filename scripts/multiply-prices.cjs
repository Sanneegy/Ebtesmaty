const fs = require('fs');
let content = fs.readFileSync('src/config/clinic-catalog.ts', 'utf8');

content = content.replace(/startingPriceEgp:\s*(\d+)/g, (match, p1) => {
  return 'startingPriceEgp: ' + (parseInt(p1, 10) * 10);
});

content = content.replace(/priceRangeEn:\s*'EGP\s*([\d,]+)\s*-\s*([\d,]+)'/g, (match, p1, p2) => {
  const n1 = parseInt(p1.replace(/,/g, ''), 10) * 10;
  const n2 = parseInt(p2.replace(/,/g, ''), 10) * 10;
  return "priceRangeEn: 'EGP " + n1.toLocaleString() + " - " + n2.toLocaleString() + "'";
});

content = content.replace(/priceRangeAr:\s*'([\d,]+)\s*-\s*([\d,]+)\s*ج\.م'/g, (match, p1, p2) => {
  const n1 = parseInt(p1.replace(/,/g, ''), 10) * 10;
  const n2 = parseInt(p2.replace(/,/g, ''), 10) * 10;
  return "priceRangeAr: '" + n1.toLocaleString() + " - " + n2.toLocaleString() + " ج.م'";
});

content = content.replace(/priceRangeEgp:\s*'EGP\s*([\d,]+)\s*-\s*([\d,]+)'/g, (match, p1, p2) => {
  const n1 = parseInt(p1.replace(/,/g, ''), 10) * 10;
  const n2 = parseInt(p2.replace(/,/g, ''), 10) * 10;
  return "priceRangeEgp: 'EGP " + n1.toLocaleString() + " - " + n2.toLocaleString() + "'";
});

fs.writeFileSync('src/config/clinic-catalog.ts', content, 'utf8');
console.log('Successfully multiplied clinic catalog prices by 10');
