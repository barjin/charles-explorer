const facultyIds = [
  11140,
  11240,
  11320,
  11310,
  11210,
  11150,
  11280,
  11220,
  11120,
  11260,
  11410,
  11110,
  11160,
  11270,
  11510,
  11230,
  11130
];

const HSLToRGB = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [255 * f(0), 255 * f(8), 255 * f(4)];
};

export function getFacultyColor(facultyId: string, s = 100, l = 30) {
  const faculty = facultyIds.findIndex((faculty) => String(faculty) === facultyId);
  
  const hue = (faculty * 360) / facultyIds.length;
  const [r, g, b] = HSLToRGB(hue, s, l);
  const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  return `#${hex}`;
}