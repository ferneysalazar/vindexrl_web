import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicApp from './PublicApp';
import AdminLayout from './layouts/AdminLayout';
import DocumentsPage from './pages/admin/documents/DocumentsPage';
import PlaceholderAdminPage from './pages/admin/PlaceholderAdminPage';
import IconsPage from './pages/tools/IconsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<PublicApp />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="documents" replace />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="entities"  element={<PlaceholderAdminPage pageId="entities" />} />
          <Route path="themes"    element={<PlaceholderAdminPage pageId="themes" />} />
          <Route path="doctypes"  element={<PlaceholderAdminPage pageId="doctypes" />} />
          <Route path="icons"     element={<IconsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
