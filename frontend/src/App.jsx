import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './components/Login';
import Register from './components/Register';
import WorkerDashboard from './pages/WorkerDashboard';
import UserDashboard from './pages/UserDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/contributer" element={<WorkerDashboard />} />
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/register" element={<Register/>}/>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;