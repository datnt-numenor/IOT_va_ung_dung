import { ChevronRight, ExternalLink, Link2 } from "lucide-react";
import BrandIcon from "./BrandIcon";

function ProfileLink({ title, description, displayUrl, url, brand }) {
  return (
    <a
      className="profile-link"
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${title}: mở liên kết trong tab mới`}
    >
      <span className={`resource-icon ${brand}`}>
        <BrandIcon brand={brand} />
      </span>

      <div className="resource-copy">
        <h3>{title}</h3>
        <p>{description}</p>
        <span className="resource-url">
          <Link2 size={13} aria-hidden="true" />
          <span>{displayUrl}</span>
        </span>
      </div>

      <span className="resource-action">
        Mở liên kết <ExternalLink size={13} aria-hidden="true" />
      </span>
      <ChevronRight className="resource-chevron" size={17} aria-hidden="true" />
    </a>
  );
}

export default ProfileLink;
