import { BrowserRouter, Routes, Route } from 'react-router-dom';

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<div>Hades Gym Manager</div>} />
    </Routes>
  </BrowserRouter>
);
