// app/admin/login/layout.js
export default function LoginLayout({ children }) {
  // Login page has its own layout without the admin sidebar
  return <>{children}</>;
}
