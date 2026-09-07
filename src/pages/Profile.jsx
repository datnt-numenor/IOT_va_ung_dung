import MainLayout from "../components/MainLayout";
import ProfileLink from "../components/ProfileLink";

function Profile() {
  return (
    <MainLayout>
      <h1>Profile</h1>

      <div className="profile-card">
        <div className="profile-info">
          <div className="profile-avatar">ND</div>

          <div>
            <h2>Nguyễn Tiến Đạt</h2>
            <p>Student ID: B23DCCN139</p>
            <p>Class: D23CNPM06</p>
          </div>
        </div>

        <h2 className="section-title">Project Links</h2>

        <div className="profile-links">
          <ProfileLink
            title="GitHub"
            description="Source code of the project"
            url="#"
          />

          <ProfileLink title="Figma" description="UI/UX design" url="#" />

          <ProfileLink
            title="Postman"
            description="API documentation"
            url="#"
          />

          <ProfileLink title="PDF" description="Project report" url="#" />
        </div>
      </div>
    </MainLayout>
  );
}

export default Profile;
