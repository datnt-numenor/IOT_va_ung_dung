import MainLayout from "../components/MainLayout";
import ProfileLink from "../components/ProfileLink";

const academicDetails = [
  ["HỌ TÊN", "Nguyễn Tiến Đạt"],
  ["MÃ SINH VIÊN", "B23DCCN139"],
  ["LỚP", "D23CNPM06"],
  ["NHÓM HỌC PHẦN", "10"],
  ["GIẢNG VIÊN", "Nguyễn Quốc Uy"],
  ["DỰ ÁN", "IoT Room Monitoring"],
];

function Profile() {
  return (
    <MainLayout
      title="Profile"
      subtitle="Thông tin sinh viên và tài nguyên dự án"
    >
      <div className="profile-layout">
        <section className="panel profile-identity">
          <h2>Hồ sơ cá nhân</h2>

          <div className="profile-avatar">Đ</div>
          <h3>Nguyễn Tiến Đạt</h3>
          <strong className="profile-student-id">B23DCCN139</strong>
          <p className="profile-role">Sinh viên · IoT và ứng dụng</p>

          <div className="profile-divider" />

          <div className="profile-email">
            <span>EMAIL TÀI KHOẢN</span>
            <p>datnt.b23cn139@stu.ptit.edu.vn</p>
          </div>

          <div className="profile-academic">
            <h3>Thông tin học phần</h3>
            <div className="academic-grid">
              {academicDetails.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="profile-main">
          <section className="panel resources-panel">
            <h2>Tài nguyên dự án</h2>

            <div className="profile-links">
              <ProfileLink
                title="GitHub Source"
                description="github.com/datnt-numenor/IOT_va_ung_dung"
                url="https://github.com/datnt-numenor/IOT_va_ung_dung"
                brand="github"
              />
              <ProfileLink
                title="Figma Design"
                description="figma.com/design/oV8EXsmIogdvIPIk4qzZfX/IoT"
                url="https://www.figma.com/design/oV8EXsmIogdvIPIk4qzZfX/IoT?node-id=0-1"
                brand="figma"
              />
              <ProfileLink
                title="Postman API"
                description="datksnb2005-6044344.postman.co/workspace/IoT-va-ung-dung"
                url="https://datksnb2005-6044344.postman.co/workspace/IoT-va-ung-dung~8f049eba-e674-4ad6-b92b-eeb56e32e5b3/collection/57506128-01b6ee5c-0446-46fb-a27b-e30500a01c7f?action=share&source=copy-link&creator=57506128"
                brand="postman"
              />
              <ProfileLink
                title="Báo cáo cuối kỳ"
                description="drive.google.com/drive/folders/1V76T7YQR2wumaZ4Im_FXeh-kUrDeRGp_"
                url="https://drive.google.com/drive/folders/1V76T7YQR2wumaZ4Im_FXeh-kUrDeRGp_?usp=drive_link"
                brand="googledrive"
              />
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

export default Profile;
