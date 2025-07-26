import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Component for company challenges management
export const MeusDesafios = () => {
  const [desafios, setDesafios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDesafios();
  }, []);

  const loadDesafios = async () => {
    try {
      const response = await axios.get(`${API}/desafios/empresa`);
      setDesafios(response.data);
    } catch (err) {
      console.error('Erro ao carregar desafios:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Carregando desafios...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meus Desafios</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Novo Desafio
        </button>
      </div>

      {showForm && (
        <DesafioForm 
          onCancel={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadDesafios();
          }}
        />
      )}

      <div className="grid gap-6">
        {desafios.map(desafio => (
          <DesafioCard key={desafio.id} desafio={desafio} />
        ))}
      </div>

      {desafios.length === 0 && (
        <div className="text-center text-gray-500 p-8">
          <p>Nenhum desafio criado ainda.</p>
          <p>Clique em "Novo Desafio" para começar!</p>
        </div>
      )}
    </div>
  );
};

// Component for available challenges (for students)
export const DesafiosDisponiveis = () => {
  const [desafios, setDesafios] = useState([]);
  const [empresas, setEmpresas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDesafios();
  }, []);

  const loadDesafios = async () => {
    try {
      const [desafiosResponse, empresasResponse] = await Promise.all([
        axios.get(`${API}/desafios`),
        axios.get(`${API}/empresas`)
      ]);
      
      setDesafios(desafiosResponse.data);
      
      // Create a map of empresas for easy lookup
      const empresasMap = {};
      empresasResponse.data.forEach(empresa => {
        empresasMap[empresa.id] = empresa;
      });
      setEmpresas(empresasMap);
    } catch (err) {
      console.error('Erro ao carregar desafios:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Carregando desafios...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Desafios Disponíveis</h1>

      <div className="grid gap-6">
        {desafios.map(desafio => (
          <DesafioDisponivelCard 
            key={desafio.id} 
            desafio={desafio} 
            empresa={empresas[desafio.empresa_id]}
          />
        ))}
      </div>

      {desafios.length === 0 && (
        <div className="text-center text-gray-500 p-8">
          <p>Nenhum desafio disponível no momento.</p>
        </div>
      )}
    </div>
  );
};

// Form component for creating challenges
const DesafioForm = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/desafios`, formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao criar desafio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Criar Novo Desafio</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Título do Desafio</label>
          <input
            type="text"
            required
            value={formData.titulo}
            onChange={(e) => setFormData({...formData, titulo: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            required
            value={formData.descricao}
            onChange={(e) => setFormData({...formData, descricao: e.target.value})}
            rows={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Descreva o desafio, objetivos, requisitos e critérios de avaliação..."
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Desafio'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

// Card component for company's own challenges
const DesafioCard = ({ desafio }) => {
  const [respostas, setRespostas] = useState([]);
  const [showRespostas, setShowRespostas] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadRespostas = async () => {
    if (showRespostas) {
      setShowRespostas(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/respostas/desafio/${desafio.id}`);
      setRespostas(response.data);
      setShowRespostas(true);
    } catch (err) {
      console.error('Erro ao carregar respostas:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{desafio.titulo}</h3>
          <p className="text-gray-600 text-sm">
            Criado em {new Date(desafio.criado_em).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <button
          onClick={loadRespostas}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Carregando...' : showRespostas ? 'Ocultar Respostas' : 'Ver Respostas'}
        </button>
      </div>
      
      <p className="text-gray-700 mb-4">{desafio.descricao}</p>

      {showRespostas && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-semibold mb-2">Respostas Recebidas ({respostas.length})</h4>
          {respostas.length > 0 ? (
            <div className="space-y-2">
              {respostas.map(resposta => (
                <RespostaCard key={resposta.id} resposta={resposta} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma resposta recebida ainda.</p>
          )}
        </div>
      )}
    </div>
  );
};

// Card component for available challenges (student view)
const DesafioDisponivelCard = ({ desafio, empresa }) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{desafio.titulo}</h3>
          <p className="text-blue-600 font-medium">{empresa?.nome}</p>
          <p className="text-gray-600 text-sm">
            Publicado em {new Date(desafio.criado_em).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Responder
        </button>
      </div>
      
      <p className="text-gray-700 mb-4">{desafio.descricao}</p>

      {empresa && (
        <div className="bg-gray-50 p-4 rounded mb-4">
          <h4 className="font-semibold text-sm text-gray-700">Sobre a Empresa</h4>
          <p className="text-sm text-gray-600">{empresa.descricao}</p>
        </div>
      )}

      {showForm && (
        <RespostaForm 
          desafioId={desafio.id}
          onCancel={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

// Form component for submitting responses
const RespostaForm = ({ desafioId, onCancel, onSuccess }) => {
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/respostas`, {
        desafio_id: desafioId,
        texto: texto
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao enviar resposta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-semibold mb-4">Sua Resposta</h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            required
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite sua resposta detalhada para este desafio..."
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar Resposta'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

// Card component for displaying responses
const RespostaCard = ({ resposta }) => {
  return (
    <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm text-gray-600">
          Enviado em {new Date(resposta.enviada_em).toLocaleDateString('pt-BR')}
        </p>
      </div>
      <p className="text-gray-800">{resposta.texto}</p>
    </div>
  );
};