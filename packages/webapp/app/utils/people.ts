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
    'phil.',
    'Bc.',
    'B.Sc.',
    'M.Sc.',
    'Dipl.-Ing.',
    'JUDr.',
    'DEA',
    'LL.M.',
    'mimořádný',
    'profesor',
    'Univerzity',
    'Karlovy',
    'PhD'
  ]

  return nameWithTitles.split(' ').filter(x => !x.endsWith('.') && !x.endsWith(',') && !titles.includes(x) && !titles.includes(`${x},`)).join(' ')
}

export function normalizeName(name: string): string {
  return stripTitles(name).toLowerCase().split(' ').sort().join(' ');
}