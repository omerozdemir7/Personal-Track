const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export const statusLabels = {
  active: 'Sahada',
  remote: 'Uzaktan',
  leave: 'İzinde',
  approved: 'Onaylandı',
  pending: 'Bekliyor',
  rejected: 'Reddedildi',
  high: 'Kritik',
  medium: 'Standart',
  low: 'Bilgilendirme',
  admin: 'Yönetici',
  personnel: 'Personel',
}

const departmentColors = [
  '#0f9d94',
  '#f4a261',
  '#e76f51',
  '#355070',
  '#7b8cde',
  '#5c7c4f',
]

export const formatDate = (value) => {
  if (!value) {
    return 'Tarih yok'
  }

  return dateFormatter.format(new Date(value))
}

export const formatDateTime = (value) => {
  if (!value) {
    return 'Henüz giriş yapmadı'
  }

  return dateTimeFormatter.format(new Date(value))
}

export const getInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export const calculateSummary = (employees, leaves, announcements) => {
  const activeEmployees = employees.filter((employee) => employee.status === 'active')
  const remoteEmployees = employees.filter((employee) => employee.status === 'remote')
  const pendingLeaves = leaves.filter((leave) => leave.status === 'pending')

  const averageAttendance = employees.length
    ? Math.round(
        employees.reduce(
          (total, employee) => total + Number(employee.attendanceRate || 0),
          0,
        ) / employees.length,
      )
    : 0

  const averageCompletion = employees.length
    ? Math.round(
        employees.reduce(
          (total, employee) => total + Number(employee.completionRate || 0),
          0,
        ) / employees.length,
      )
    : 0

  return {
    headcount: employees.length,
    activeHeadcount: activeEmployees.length,
    remoteHeadcount: remoteEmployees.length,
    pendingLeaves: pendingLeaves.length,
    averageAttendance,
    averageCompletion,
    announcements: announcements.length,
  }
}

export const buildDepartmentChartData = (employees) =>
  Object.entries(
    employees.reduce((groups, employee) => {
      groups[employee.department] = (groups[employee.department] || 0) + 1
      return groups
    }, {}),
  ).map(([name, value], index) => ({
    name,
    value,
    fill: departmentColors[index % departmentColors.length],
  }))

export const buildAttendanceChartData = (employees) => {
  const bands = [
    { name: '96-100%', min: 96, max: 100, fill: '#0f9d94' },
    { name: '90-95%', min: 90, max: 95, fill: '#355070' },
    { name: '80-89%', min: 80, max: 89, fill: '#f4a261' },
    { name: '0-79%', min: 0, max: 79, fill: '#e76f51' },
  ]

  return bands.map((band) => ({
    name: band.name,
    total: employees.filter((employee) => {
      const rate = Number(employee.attendanceRate || 0)
      return rate >= band.min && rate <= band.max
    }).length,
    fill: band.fill,
  }))
}

export const buildStatusChartData = (employees) => {
  const template = [
    { name: 'Sahada', key: 'active', fill: '#0f9d94' },
    { name: 'Uzaktan', key: 'remote', fill: '#355070' },
    { name: 'İzinde', key: 'leave', fill: '#e9c46a' },
  ]

  return template.map((item) => ({
    ...item,
    value: employees.filter((employee) => employee.status === item.key).length,
  }))
}

export const getTopPerformers = (employees) =>
  [...employees]
    .sort(
      (first, second) =>
        Number(second.completionRate || 0) +
          Number(second.attendanceRate || 0) -
        (Number(first.completionRate || 0) + Number(first.attendanceRate || 0)),
    )
    .slice(0, 3)

export const filterEmployees = (employees, query) => {
  if (!query.trim()) {
    return employees
  }

  const lowered = query.trim().toLocaleLowerCase('tr-TR')

  return employees.filter((employee) =>
    [employee.fullName, employee.department, employee.jobTitle, employee.location]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase('tr-TR').includes(lowered)),
  )
}
