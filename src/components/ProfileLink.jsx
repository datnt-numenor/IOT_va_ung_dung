function ProfileLink({ title, description, url }) {
  return (
    <a className="profile-link" href={url} target="_blank" rel="noreferrer">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <span>Open</span>
    </a>
  );
}

export default ProfileLink;
