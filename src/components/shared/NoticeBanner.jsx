function NoticeBanner({ notice }) {
  if (!notice) {
    return null
  }

  return (
    <div className={`notice-banner notice-banner--${notice.type}`}>{notice.message}</div>
  )
}

export default NoticeBanner
