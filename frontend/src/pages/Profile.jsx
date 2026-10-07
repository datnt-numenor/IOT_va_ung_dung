import {
  BookOpen,
  FolderOpen,
  GraduationCap,
  Hash,
  IdCard,
  Mail,
  UserRound,
  UsersRound,
  FileText,
} from "lucide-react";
import MainLayout from "../components/MainLayout";
import ProfileLink from "../components/ProfileLink";

const academicDetails = [
  ["HỌ TÊN", "Nguyễn Tiến Đạt", UserRound],
  ["MÃ SINH VIÊN", "B23DCCN139", IdCard],
  ["LỚP", "D23CNPM06", UsersRound],
  ["NHÓM HỌC PHẦN", "10", Hash],
  ["GIẢNG VIÊN", "Nguyễn Quốc Uy", GraduationCap],
  ["DỰ ÁN", "IoT Room Monitoring", FileText],
];

function Profile() {
  return (
    <MainLayout
      title="Profile"
      subtitle="Thông tin sinh viên và tài nguyên dự án"
    >
      <div className="profile-layout">
        <section className="panel profile-identity">
          <div className="profile-section-heading">
            <span className="profile-heading-icon">
              <UserRound size={23} aria-hidden="true" />
            </span>
            <div>
              <h2>Hồ sơ cá nhân</h2>
              <p>Thông tin tài khoản và thông tin học phần</p>
            </div>
          </div>

          <div className="profile-person">
            <img className="profile-avatar" src="/avatar.png" alt="Ảnh Nguyễn Tiến Đạt" />
            <div className="profile-person-copy">
              <h3>Nguyễn Tiến Đạt</h3>
              <strong className="profile-student-id">B23DCCN139</strong>
              <p className="profile-role">
                <GraduationCap size={16} aria-hidden="true" />
                Sinh viên · IoT và ứng dụng
              </p>
            </div>
          </div>

          <div className="profile-divider" />

          <div className="profile-email">
            <span className="profile-field-icon">
              <Mail size={20} aria-hidden="true" />
            </span>
            <div>
              <span>EMAIL TÀI KHOẢN</span>
              <p>datnt.b23cn139@stu.ptit.edu.vn</p>
            </div>
          </div>

          <div className="profile-academic">
            <h3>
              <BookOpen size={18} aria-hidden="true" />
              Thông tin học phần
            </h3>
            <div className="academic-grid">
              {academicDetails.map(([label, value, Icon]) => (
                <div key={label}>
                  <span className="academic-icon">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <span className="academic-copy">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="profile-main">
          <section className="panel resources-panel">
            <div className="profile-section-heading resource-heading">
              <span className="profile-heading-icon">
                <FolderOpen size={23} aria-hidden="true" />
              </span>
              <div>
                <h2>Tài nguyên dự án</h2>
                <p>Các tài liệu và liên kết phục vụ cho dự án IoT Room Monitoring</p>
              </div>
            </div>

            <div className="profile-links">
              <ProfileLink
                title="GitHub Source"
                description="Mã nguồn dự án trên GitHub"
                displayUrl="github.com/datnt-numenor/IOT_va_ung_dung"
                url="https://github.com/datnt-numenor/IOT_va_ung_dung"
                brand="github"
              />
              <ProfileLink
                title="Figma Design"
                description="Thiết kế giao diện trên Figma"
                displayUrl="figma.com/design/oV8EXsmIogdvIPIk4qzZfX/IoT"
                url="https://www.figma.com/design/oV8EXsmIogdvIPIk4qzZfX/IoT?node-id=0-1"
                brand="figma"
              />
              <ProfileLink
                title="Postman API"
                description="Bộ sưu tập API trên Postman"
                displayUrl="postman.com/datksnb2005-6044344/workspace/iot-va-ung-dung"
                url="https://www.postman.com/datksnb2005-6044344/workspace/iot-va-ung-dung/collection/57506128-01b6ee5c-0446-46fb-a27b-e30500a01c7f"
                brand="postman"
              />
              <ProfileLink
                title="Báo cáo cuối kỳ"
                description="File báo cáo PDF của dự án"
                displayUrl="drive.google.com/file/d/15v10A0A4n1YwmcCcHGvutVhIdnlVpYrk"
                url="https://drive.google.com/file/d/15v10A0A4n1YwmcCcHGvutVhIdnlVpYrk/view"
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
