import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicApp from './PublicApp';
import AdminLayout from './layouts/AdminLayout';
import DocumentsPage from './pages/admin/documents/DocumentsPage';
import DocTypesPage from './pages/admin/doctypes/DocTypesPage';
import EntityTypesPage from './pages/admin/entitytypes/EntityTypesPage';
import EntitiesPage from './pages/admin/entities/EntitiesPage';
import ThemesPage from './pages/admin/themes/ThemesPage';
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
          <Route path="entity-types"  element={<EntityTypesPage />} />
          <Route path="entities"     element={<EntitiesPage />} />
          <Route path="themes"    element={<ThemesPage />} />
          <Route path="doctypes"  element={<DocTypesPage />} />
          <Route path="icons"     element={<IconsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
