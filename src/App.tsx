import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Specifications } from '@/pages/Specifications';
import { SchemaEditor } from '@/pages/SchemaEditor';
import { PageDetail } from '@/pages/PageDetail';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Specifications />} />
        <Route path="/schema-editor" element={<SchemaEditor />} />
        <Route path="/page/:jobId/:pageNumber" element={<PageDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;