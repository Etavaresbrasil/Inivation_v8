import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import components
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MeusDesafios, DesafiosDisponiveis } from './components/Desafios';
import { Avaliacoes, MinhasRespostas } from './components/Avaliacoes';
import { Matches } from './components/Matches';
import { Admin } from './components/Admin';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">TCC Inovation</h1>
          <div className="flex space-x-4">
            <Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link>
            {user.user_type === 'admin' && (
              <Link to="/admin" className="hover:text-blue-200">Administração</Link>
            )}
            {user.user_type === 'empresa' && (
              <>
                <Link to="/desafios" className="hover:text-blue-200">Meus Desafios</Link>
                <Link to="/avaliacoes" className="hover:text-blue-200">Avaliações</Link>
              </>
            )}
            {user.user_type === 'formando' && (
              <>
                <Link to="/desafios-disponiveis" className="hover:text-blue-200">Desafios</Link>
                <Link to="/minhas-respostas" className="hover:text-blue-200">Minhas Respostas</Link>
              </>
            )}
            <Link to="/matches" className="hover:text-blue-200">Matches</Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span>Olá, {user.user_name}</span>
          <span className="text-sm bg-blue-700 px-2 py-1 rounded">{user.user_type}</span>
          <button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
};

// Login Component
const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    nome: '',
    tipo: 'formando'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegistering ? '/register' : '/login';
      const payload = isRegistering ? formData : { email: formData.email, senha: formData.senha };
      
      const response = await axios.post(`${API}${endpoint}`, payload);
      
      login(response.data.access_token, {
        user_id: response.data.user_id,
        user_name: response.data.user_name,
        user_type: response.data.user_type
      });
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao fazer login/registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">TCC Inovation</h1>
          <p className="text-gray-600 mt-2">Conectando formandos e empresas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              required
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Usuário</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="formando">Formando</option>
                  <option value="empresa">Empresa</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : (isRegistering ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 hover:text-blue-500"
          >
            {isRegistering ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [showEmpresaForm, setShowEmpresaForm] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (user.user_type === 'admin') {
        const response = await axios.get(`${API}/admin/stats`);
        setStats(response.data);
      } else if (user.user_type === 'empresa') {
        try {
          const response = await axios.get(`${API}/empresas/me`);
          setEmpresa(response.data);
        } catch (err) {
          if (err.response?.status === 404) {
            setShowEmpresaForm(true);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    }
  };

  if (user.user_type === 'admin') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard Administrativo</h1>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800">Total de Usuários</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total_usuarios}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800">Empresas</h3>
              <p className="text-3xl font-bold text-green-600">{stats.total_empresas}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800">Formandos</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.total_formandos}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800">Desafios</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.total_desafios}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800">Respostas</h3>
              <p className="text-3xl font-bold text-red-600">{stats.total_respostas}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800">Avaliações</h3>
              <p className="text-3xl font-bold text-indigo-600">{stats.total_avaliacoes}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (user.user_type === 'empresa') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard da Empresa</h1>
        
        {showEmpresaForm ? (
          <EmpresaForm onSuccess={() => {
            setShowEmpresaForm(false);
            loadDashboardData();
          }} />
        ) : empresa ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Informações da Empresa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <p className="text-lg">{empresa.nome}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                <p className="text-lg">{empresa.cnpj}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <p className="text-lg">{empresa.descricao}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p>Carregando informações da empresa...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard do Formando</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Bem-vindo, {user.user_name}!</h2>
        <p className="text-gray-600">
          Explore os desafios disponíveis e demonstre suas habilidades para as empresas parceiras.
        </p>
        <div className="mt-4">
          <Link 
            to="/desafios-disponiveis"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Ver Desafios Disponíveis
          </Link>
        </div>
      </div>
    </div>
  );
};

// Company Form Component
const EmpresaForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    descricao: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/empresas`, formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao cadastrar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Cadastrar Empresa</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
          <input
            type="text"
            required
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">CNPJ</label>
          <input
            type="text"
            required
            value={formData.cnpj}
            onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
            placeholder="00.000.000/0000-00"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            required
            value={formData.descricao}
            onChange={(e) => setFormData({...formData, descricao: e.target.value})}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Cadastrar Empresa'}
        </button>
      </form>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.user_type)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App min-h-screen bg-gray-50">
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;