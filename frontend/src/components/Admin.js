import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Main Admin component
export const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: '📊' },
    { id: 'users', name: 'Usuários', icon: '👥' },
    { id: 'companies', name: 'Empresas', icon: '🏢' },
    { id: 'challenges', name: 'Desafios', icon: '🎯' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'companies' && <AdminCompanies />}
        {activeTab === 'challenges' && <AdminChallenges />}
      </div>
    </div>
  );
};

// Overview component
const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Carregando estatísticas...</div>;
  }

  if (!stats) {
    return <div className="text-center p-6 text-red-600">Erro ao carregar estatísticas</div>;
  }

  const statsCards = [
    {
      title: 'Total de Usuários',
      value: stats.total_usuarios,
      icon: '👥',
      color: 'blue',
      description: 'Usuários registrados na plataforma'
    },
    {
      title: 'Empresas Parceiras',
      value: stats.total_empresas,
      icon: '🏢',
      color: 'green',
      description: 'Empresas cadastradas e ativas'
    },
    {
      title: 'Formandos',
      value: stats.total_formandos,
      icon: '👨‍🎓',
      color: 'purple',
      description: 'Estudantes buscando oportunidades'
    },
    {
      title: 'Desafios Ativos',
      value: stats.total_desafios,
      icon: '🎯',
      color: 'orange',
      description: 'Desafios publicados pelas empresas'
    },
    {
      title: 'Respostas Enviadas',
      value: stats.total_respostas,
      icon: '📝',
      color: 'red',
      description: 'Respostas submetidas pelos formandos'
    },
    {
      title: 'Avaliações Realizadas',
      value: stats.total_avaliacoes,
      icon: '⭐',
      color: 'indigo',
      description: 'Respostas já avaliadas pelas empresas'
    }
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{stat.title}</h3>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className={`text-3xl font-bold text-${stat.color}-600 mb-2`}>{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
            <span>👥</span>
            <span>Gerenciar Usuários</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
            <span>🏢</span>
            <span>Ver Empresas</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100">
            <span>🎯</span>
            <span>Monitorar Desafios</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100">
            <span>📊</span>
            <span>Relatórios</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Users management component
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/usuarios`);
      setUsers(response.data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    if (filter === 'all') return users;
    return users.filter(user => user.tipo === filter);
  };

  const getUserTypeLabel = (tipo) => {
    const types = {
      'admin': { label: 'Administrador', color: 'red' },
      'empresa': { label: 'Empresa', color: 'green' },
      'formando': { label: 'Formando', color: 'blue' }
    };
    return types[tipo] || { label: tipo, color: 'gray' };
  };

  if (loading) {
    return <div className="text-center p-6">Carregando usuários...</div>;
  }

  const filteredUsers = getFilteredUsers();

  return (
    <div>
      {/* Filter Buttons */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todos ({users.length})
        </button>
        <button
          onClick={() => setFilter('admin')}
          className={`px-4 py-2 rounded ${
            filter === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Admins ({users.filter(u => u.tipo === 'admin').length})
        </button>
        <button
          onClick={() => setFilter('empresa')}
          className={`px-4 py-2 rounded ${
            filter === 'empresa' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Empresas ({users.filter(u => u.tipo === 'empresa').length})
        </button>
        <button
          onClick={() => setFilter('formando')}
          className={`px-4 py-2 rounded ${
            filter === 'formando' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Formandos ({users.filter(u => u.tipo === 'formando').length})
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cadastrado em
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(user => {
              const typeInfo = getUserTypeLabel(user.tipo);
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}>
                      {typeInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      Ver
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Desativar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center text-gray-500 p-8">
          <p>Nenhum usuário encontrado com os filtros selecionados.</p>
        </div>
      )}
    </div>
  );
};

// Companies management component
const AdminCompanies = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      const response = await axios.get(`${API}/empresas`);
      setEmpresas(response.data);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Carregando empresas...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Empresas Parceiras ({empresas.length})</h2>
        <p className="text-gray-600">Gerencie as empresas cadastradas na plataforma</p>
      </div>

      <div className="grid gap-6">
        {empresas.map(empresa => (
          <div key={empresa.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{empresa.nome}</h3>
                <p className="text-gray-600">CNPJ: {empresa.cnpj}</p>
                <p className="text-sm text-gray-500">
                  Cadastrada em {new Date(empresa.criada_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Ver Detalhes
                </button>
                <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                  Desativar
                </button>
              </div>
            </div>
            
            <p className="text-gray-700">{empresa.descricao}</p>
          </div>
        ))}
      </div>

      {empresas.length === 0 && (
        <div className="text-center text-gray-500 p-8">
          <p>Nenhuma empresa cadastrada ainda.</p>
        </div>
      )}
    </div>
  );
};

// Challenges management component
const AdminChallenges = () => {
  const [desafios, setDesafios] = useState([]);
  const [empresas, setEmpresas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [desafiosResponse, empresasResponse] = await Promise.all([
        axios.get(`${API}/desafios`),
        axios.get(`${API}/empresas`)
      ]);

      setDesafios(desafiosResponse.data);

      // Create empresas map
      const empresasMap = {};
      empresasResponse.data.forEach(empresa => {
        empresasMap[empresa.id] = empresa;
      });
      setEmpresas(empresasMap);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Carregando desafios...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Desafios da Plataforma ({desafios.length})</h2>
        <p className="text-gray-600">Monitore todos os desafios publicados pelas empresas</p>
      </div>

      <div className="grid gap-6">
        {desafios.map(desafio => {
          const empresa = empresas[desafio.empresa_id];
          return (
            <div key={desafio.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{desafio.titulo}</h3>
                  <p className="text-blue-600 font-medium">{empresa?.nome || 'Empresa não encontrada'}</p>
                  <p className="text-sm text-gray-500">
                    Publicado em {new Date(desafio.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Ver Respostas
                  </button>
                  <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                    Remover
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700">{desafio.descricao}</p>
            </div>
          );
        })}
      </div>

      {desafios.length === 0 && (
        <div className="text-center text-gray-500 p-8">
          <p>Nenhum desafio publicado ainda.</p>
        </div>
      )}
    </div>
  );
};