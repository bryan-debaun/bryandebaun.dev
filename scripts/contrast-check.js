function hexToL(h) { h = h.replace('#', ''); const r = parseInt(h.substr(0, 2), 16) / 255; const g = parseInt(h.substr(2, 2), 16) / 255; const b = parseInt(h.substr(4, 2), 16) / 255; const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4); const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4); const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4); return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs }
function contrast(a, b) { const la = hexToL(a); const lb = hexToL(b); const L1 = Math.max(la, lb); const L2 = Math.min(la, lb); return ((L1 + 0.05) / (L2 + 0.05)).toFixed(2) }
const pairs = [
    ['foreground on nor-100', '#171717', '#e6f7f7'],
    ['foreground on nor-200', '#171717', '#bfeff0'],
    ['foreground on nor-300', '#171717', '#99e7e7'],
    ['foreground on slate', '#171717', '#f3f4f6'],
    ['nav link on header (nor-50)', '#00706d', '#f2fbfb'],
    ['nav hover on header', '#176fc4', '#f2fbfb'],
    ['foreground dark', '#ededed', '#0a0a0a'],
    ['nav dark', '#e6f7f7', '#0a0a0a']
];

pairs.forEach(p => console.log(`${p[0]}: contrast ${contrast(p[1], p[2])}`));
