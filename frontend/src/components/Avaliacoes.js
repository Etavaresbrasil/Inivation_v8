import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Component for company to evaluate responses
export const Avaliacoes = () => {
  const [desafios, setDesafios] = useState([]);
  const [selectedDesafio, setSelectedDesafio] = useState(null);
  const [respostas, setRespostas] = useState([]);
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

  const loadRespostas = async (desafioId) => {
    try {
      const response = await axios.get(`${API}/respostas/desafio/${desafioId}`);
      setRespostas(response.data);
      setSelectedDesafio(desafioId);
    } catch (err) {
      console.error('Erro ao carregar respostas:', err);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Carregando desafios...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Avaliações de Respostas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Desafios */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Seus Desafios</h2>
          <div className="space-y-2">
            {desafios.map(desafio => (
              <button
                key={desafio.id}
                onClick={() => loadRespostas(desafio.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedDesafio === desafio.id 
                    ? 'bg-blue-50 border-blue-500' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <h3 className="font-medium">{desafio.titulo}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(desafio.criado_em).toLocaleDateString('pt-BR')}
                </p>
              </button>
            ))}
          </div>

          {desafios.length === 0 && (
            <p className="text-gray-500 text-center">
              Nenhum desafio criado ainda.
            </p>
          )}
        </div>

        {/* Lista de Respostas */}
        <div className="lg:col-span-2">
          {selectedDesafio ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Respostas Recebidas ({respostas.length})
              </h2>
              <div className="space-y-4">
                {respostas.map(resposta => (
                  <RespostaParaAvaliar key={resposta.id} resposta={resposta} />
                ))}
              </div>

              {respostas.length === 0 && (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <p className="text-gray-500">
                    Nenhuma resposta recebida para este desafio ainda.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500">
                Selecione um desafio para ver as respostas recebidas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component for individual response evaluation
const RespostaParaAvaliar = ({ resposta }) => {
  const [avaliacao, setAvaliacao] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvaliacao();
  }, [resposta.id]);

  const loadAvaliacao = async () => {
    try {
      const response = await axios.get(`${API}/avaliacoes/resposta/${resposta.id}`);
      setAvaliacao(response.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Erro ao carregar avaliação:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvaliacaoSuccess = (novaAvaliacao) => {
    setAvaliacao(novaAvaliacao);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-center">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-600">
            Enviado em {new Date(resposta.enviada_em).toLocaleDateString('pt-BR')}
          </p>
        </div>
        {!avaliacao && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Avaliar
          </button>
        )}
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Resposta:</h4>
        <p className="text-gray-700 bg-gray-50 p-4 rounded">{resposta.texto}</p>
      </div>

      {avaliacao && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Avaliação:</h4>
          <div className="bg-green-50 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Nota:</span>
              <span className="text-2xl font-bold text-green-600">{avaliacao.nota}/10</span>
            </div>
            {avaliacao.comentario && (
              <div>
                <span className="font-medium">Comentário:</span>
                <p className="text-gray-700 mt-1">{avaliacao.comentario}</p>
              </div>
            )}
            <p className="text-sm text-gray-600 mt-2">
              Avaliado em {new Date(avaliacao.avaliado_em).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <AvaliacaoForm
          respostaId={resposta.id}
          onCancel={() => setShowForm(false)}
          onSuccess={handleAvaliacaoSuccess}
        />
      )}
    </div>
  );
};

// Form component for creating evaluations
const AvaliacaoForm = ({ respostaId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    nota: '',
    comentario: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        resposta_id: respostaId,
        nota: parseFloat(formData.nota)
      };

      if (formData.comentario.trim()) {
        payload.comentario = formData.comentario;
      }

      const response = await axios.post(`${API}/avaliacoes`, payload);
      onSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar avaliação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-semibold mb-4">Avaliar Resposta</h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nota (0 a 10)
          </label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            required
            value={formData.nota}
            onChange={(e) => setFormData({...formData, nota: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: 8.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comentário (Opcional)
          </label>
          <textarea
            value={formData.comentario}
            onChange={(e) => setFormData({...formData, comentario: e.target.value})}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Feedback para o formando sobre sua resposta..."
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
            {loading ? 'Salvando...' : 'Salvar Avaliação'}
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

// Component for students to view their responses and evaluations
export const MinhasRespostas = () => {
  const [respostas, setRespostas] = useState([]);
  const [desafios, setDesafios] = useState({});
  const [empresas, setEmpresas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRespostas();
  }, []);

  const loadRespostas = async () => {
    try {
      const [respostasResponse, desafiosResponse, empresasResponse] = await Promise.all([
        axios.get(`${API}/respostas/me`),
        axios.get(`${API}/desafios`),
        axios.get(`${API}/empresas`)
      ]);

      setRespostas(respostasResponse.data);

      // Create maps for easy lookup
      const desafiosMap = {};
      desafiosResponse.data.forEach(desafio => {
        desafiosMap[desafio.id] = desafio;
      });
      setDesafios(desafiosMap);

      const empresasMap = {};
      empresasResponse.data.forEach(empresa => {
        empresasMap[empresa.id] = empresa;
      });
      setEmpresas(empresasMap);
    } catch (err) {
      console.error('Erro ao carregar respostas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-6">Carregando suas respostas...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Minhas Respostas</h1>

      <div className="space-y-6">
        {respostas.map(resposta => {
          const desafio = desafios[resposta.desafio_id];
          const empresa = desafio ? empresas[desafio.empresa_id] : null;
          
          return (
            <MinhaRespostaCard
              key={resposta.id}
              resposta={resposta}
              desafio={desafio}
              empresa={empresa}
            />
          );
        })}
      </div>

      {respostas.length === 0 && (
        <div className="text-center text-gray-500 p-8">
          <p>Você ainda não respondeu nenhum desafio.</p>
          <p>Que tal explorar os desafios disponíveis?</p>
        </div>
      )}
    </div>
  );
};

// Component for individual student response display
const MinhaRespostaCard = ({ resposta, desafio, empresa }) => {
  const [avaliacao, setAvaliacao] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvaliacao();
  }, [resposta.id]);

  const loadAvaliacao = async () => {
    try {
      const response = await axios.get(`${API}/avaliacoes/resposta/${resposta.id}`);
      setAvaliacao(response.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Erro ao carregar avaliação:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (loading) {
      return <span className="text-sm text-gray-500">Carregando...</span>;
    }
    
    if (avaliacao) {
      const cor = avaliacao.nota >= 7 ? 'green' : avaliacao.nota >= 5 ? 'yellow' : 'red';
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${cor}-100 text-${cor}-800`}>
          Avaliado - Nota: {avaliacao.nota}/10
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Aguardando Avaliação
      </span>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{desafio?.titulo || 'Desafio não encontrado'}</h3>
          <p className="text-blue-600 font-medium">{empresa?.nome || 'Empresa não encontrada'}</p>
          <p className="text-gray-600 text-sm">
            Enviado em {new Date(resposta.enviada_em).toLocaleDateString('pt-BR')}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Sua Resposta:</h4>
        <p className="text-gray-700 bg-gray-50 p-4 rounded">{resposta.texto}</p>
      </div>

      {avaliacao && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Feedback da Empresa:</h4>
          <div className="bg-blue-50 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Nota Recebida:</span>
              <span className="text-2xl font-bold text-blue-600">{avaliacao.nota}/10</span>
            </div>
            {avaliacao.comentario && (
              <div>
                <span className="font-medium">Comentário:</span>
                <p className="text-gray-700 mt-1">{avaliacao.comentario}</p>
              </div>
            )}
            <p className="text-sm text-gray-600 mt-2">
              Avaliado em {new Date(avaliacao.avaliado_em).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};