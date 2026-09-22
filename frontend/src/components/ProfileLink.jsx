function ProfileLink({ title, description, url, code, tone }) {
  return (
    <a
      className="profile-link"
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${title}: mở liên kết trong tab mới`}
    >
      <span className={`resource-icon ${tone}`}>{code}</span>

      <div className="resource-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <span className="resource-action">Mở liên kết ↗</span>
    </a>
  );
}

export default ProfileLink;
