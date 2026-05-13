import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DQ from './pages/DQ';
import DQOverview from './pages/DQ/Overview';
import DQRules from './pages/DQ/Rules';
import DQIssues from './pages/DQ/Issues';
import MPI from './pages/MPI';
import MPISummary from './pages/MPI/Summary';
import MPIDuplicates from './pages/MPI/Duplicates';
import MPISources from './pages/MPI/Sources';
import Drug from './pages/Drug';
import DrugTrend from './pages/Drug/Trend';
import DrugAlerts from './pages/Drug/Alerts';
import DrugReport from './pages/Drug/Report';
import Expense from './pages/Expense';
import Inpatient from './pages/Inpatient';
import DevAssistant from './pages/DevAssistant';
import SemanticLayer from './pages/SemanticLayer';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <App />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dq" element={<DQ />}>
            <Route index element={<DQOverview />} />
            <Route path="rules" element={<DQRules />} />
            <Route path="issues" element={<DQIssues />} />
          </Route>
          <Route path="mpi" element={<MPI />}>
            <Route index element={<MPISummary />} />
            <Route path="duplicates" element={<MPIDuplicates />} />
            <Route path="sources" element={<MPISources />} />
          </Route>
          <Route path="drug" element={<Drug />}>
            <Route index element={<DrugTrend />} />
            <Route path="alerts" element={<DrugAlerts />} />
            <Route path="report" element={<DrugReport />} />
          </Route>
          <Route path="expense" element={<Expense />} />
          <Route path="inpatient" element={<Inpatient />} />
          <Route path="dev-assistant" element={<DevAssistant />} />
          <Route path="semantic-layer" element={<SemanticLayer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
