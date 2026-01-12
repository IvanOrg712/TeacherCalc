import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { SubjectGroupProvider } from './contexts/SubjectGroupContext';

function App() {
  return (
    <BrowserRouter>
      <SubjectGroupProvider>
        <AppRoutes />
      </SubjectGroupProvider>
    </BrowserRouter>
  );
}

export default App;
