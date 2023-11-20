export function stripTitles(nameWithTitles: string): string {
  const titles = [
    'Mgr.',
    'et', 
    'M.Sc.',
    'M.Sc.,',
    'MgA.',
    'Ing.',
    'MUDr.',
    'MVDr.',
    'CSc.',
    'PhDr.',
    'Ph.D.',
    'PharmDr.',
    'RNDr.',
    'ThDr.',
    'ThLic.',
    'ThMgr.',
    'prof.',
    'doc.',
    'Dr.',
    'DrSc.',
    'Dr.h.c.',
    'Dr.rer.nat.',
    'Dr.h.c.mult.',
    'Bc.',
    'B.Sc.',
    'B.Sc.,',
    'M.Sc.',
    'Dipl.-Ing.',
  ]

  return nameWithTitles.split(' ').filter(x => !titles.includes(x)).join(' ')
}