import MainLayout from "../components/MainLayout";
import ProfileLink from "../components/ProfileLink";

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
        </section>

        <div className="profile-main">
          <section className="panel resources-panel">
            <h2>Tài nguyên dự án</h2>

            <div className="profile-links">
              <ProfileLink
                title="GitHub Source"
                description="https://github.com/datnt-numenor/IOT_va_ung_dung"
                url="https://github.com/datnt-numenor/IOT_va_ung_dung"
                code="GH"
                tone="github"
              />

              <ProfileLink
                title="Figma Design"
                description="https://www.figma.com/design/oV8EXsmIogdvIPIk4qzZfX/IoT?node-id=0-1"
                url="https://www.figma.com/design/oV8EXsmIogdvIPIk4qzZfX/IoT?node-id=0-1"
                code="FI"
                tone="figma"
              />

              <ProfileLink
                title="Postman API"
                description="datksnb2005-6044344.postman.co/workspace/IoT-va-ung-dung"
                url="https://datksnb2005-6044344.postman.co/workspace/IoT-va-ung-dung~8f049eba-e674-4ad6-b92b-eeb56e32e5b3/collection/57506128-01b6ee5c-0446-46fb-a27b-e30500a01c7f?action=share&source=copy-link&creator=57506128"
                code="PM"
                tone="postman"
              />

              <ProfileLink
                title="Báo cáo cuối kỳ"
                description="drive.google.com/drive/folders/1V76T7YQR2wumaZ4Im_FXeh-kUrDeRGp_"
                url="https://drive.google.com/drive/folders/1V76T7YQR2wumaZ4Im_FXeh-kUrDeRGp_?usp=drive_link"
                code="PDF"
                tone="pdf"
              />
            </div>
          </section>

          <section className="panel academic-panel">
            <h2>Thông tin học phần</h2>

            <div className="academic-grid">
              <div>
                <span>HỌ TÊN</span>
                <strong>Nguyễn Tiến Đạt</strong>
              </div>
              <div>
                <span>MÃ SINH VIÊN</span>
                <strong>B23DCCN139</strong>
              </div>
              <div>
                <span>LỚP</span>
                <strong>D23CNPM06</strong>
              </div>
              <div>
                <span>NHÓM HỌC PHẦN</span>
                <strong>10</strong>
              </div>
              <div>
                <span>GIẢNG VIÊN</span>
                <strong>Nguyễn Quốc Uy</strong>
              </div>
              <div>
                <span>DỰ ÁN</span>
                <strong>IoT Room Monitoring</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

export default Profile;
