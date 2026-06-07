import { statusLabels } from '../utils/dashboard'

const toneMap = {
  active: 'teal',
  remote: 'navy',
  leave: 'sand',
  approved: 'green',
  pending: 'amber',
  rejected: 'rose',
  high: 'rose',
  medium: 'navy',
  low: 'slate',
  admin: 'navy',
  personnel: 'teal',
}

function StatusPill({ value }) {
  return (
    <span className={`status-pill status-pill--${toneMap[value] ?? 'slate'}`}>
      {statusLabels[value] ?? value}
    </span>
  )
}

export default StatusPill
