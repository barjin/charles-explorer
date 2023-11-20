export function stripTitles(nameWithTitles: string): string {
  const titles = [
    'Mgr.',
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
  ]

  return nameWithTitles.split(' ').filter(x => !titles.includes(x)).join(' ')
}