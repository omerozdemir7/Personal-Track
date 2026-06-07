import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const tooltipStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(7, 17, 31, 0.08)',
}

function AnalyticsChart({ kind, data }) {
  if (kind === 'status') {
    return (
      <div className="status-chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={62}
              outerRadius={92}
              dataKey="value"
              paddingAngle={6}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="status-legend">
          {data.map((item) => (
            <div key={item.name} className="status-legend__item">
              <span style={{ backgroundColor: item.fill }} />
              <strong>{item.name}</strong>
              <small>{item.value} kişi</small>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (kind === 'attendance') {
    return (
      <div className="chart-shell">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#d8d8d8" />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              width={80}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(53, 80, 112, 0.08)' }}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="total" radius={[0, 10, 10, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#d8d8d8" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(15, 157, 148, 0.08)' }}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="value" radius={[10, 10, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default AnalyticsChart
