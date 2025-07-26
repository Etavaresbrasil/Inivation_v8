import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Main Matches component
export const Matches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await axios.get(`${API}/matches`);
      setMatches(response.data);
    } catch (err) {
      console.error('Erro ao carregar matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMatches = () => {
    if (filter === 'all') return matches;
    
    if (user.user_type === 'empresa') {
      return matches.filter(match => match.empresa_id === user.user_id);
    } else if (user.user_type === 'formando') {
      return matches.filter(match => match.formando_id === user.user_id);
    }
    
    return matches;
  };

  const getMatchQuality = (nota) => {
    if (nota >= 9) return { label: 'Excelente', color: 'green', bgColor: 'bg-green-50' };
    if (nota >= 8) return { label: 'Muito Bom', color: 'blue', bgColor: 'bg-blue-50' };
    if (nota >= 7) return { label: 'Bom', color: 'yellow', bgColor: 'bg-yellow-50' };
    return { label: 'Regular', color: 'gray', bgColor: 'bg-gray-50' };
  };

  if (loading) {
    return <div className="text-center p-6">Carregando matches...</div>;
  }

  const filteredMatches = getFilteredMatches();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sistema de Matching</h1>
        
        {user.user_type !== 'admin' && (
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos os Matches
            </button>
            <button
              onClick={() => setFilter('mine')}
              className={`px-4 py-2 rounded ${
                filter === 'mine' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {user.user_type === 'empresa' ? 'Minha Empresa' : 'Meus Matches'}
            </button>
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-semibold text-gray-600">Total de Matches</h3>
          <p className="text-2xl font-bold text-blue-600">{filteredMatches.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-semibold text-gray-600">Matches Excelentes</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredMatches.filter(m => m.nota_media >= 9).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-semibold text-gray-600">Nota Média</h3>
          <p className="text-2xl font-bold text-purple-600">
            {filteredMatches.length > 0 
              ? (filteredMatches.reduce((acc, m) => acc + m.nota_media, 0) / filteredMatches.length).toFixed(1)
              : '0.0'
            }
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-semibold text-gray-600">Empresas Ativas</h3>
          <p className="text-2xl font-bold text-orange-600">
            {new Set(filteredMatches.map(m => m.empresa_id)).size}
          </p>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.map((match, index) => (
          <MatchCard key={`${match.formando_id}-${match.empresa_id}`} match={match} />
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <div className="text-center text-gray-500 p-8">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">Nenhum match encontrado</h3>
          <p className="text-gray-400 mt-2">
            {filter === 'mine' 
              ? 'Você ainda não tem matches disponíveis.' 
              : 'Ainda não há matches no sistema com nota suficiente (≥ 7.0).'
            }
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Matches são criados automaticamente quando formandos recebem avaliações com nota 7.0 ou superior.
          </p>
        </div>
      )}
    </div>
  );
};

// Individual Match Card component
const MatchCard = ({ match }) => {
  const quality = getMatchQuality(match.nota_media);
  
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-${quality.color}-500 ${quality.bgColor}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formando Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">👨‍🎓 Formando</h3>
              <p className="text-xl font-bold text-blue-600">{match.formando_nome}</p>
              <p className="text-sm text-gray-600 mt-1">
                {match.total_respostas} resposta{match.total_respostas !== 1 ? 's' : ''} avaliada{match.total_respostas !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Empresa Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🏢 Empresa</h3>
              <p className="text-xl font-bold text-green-600">{match.empresa_nome}</p>
              <p className="text-sm text-gray-600 mt-1">
                Desafio: {match.desafio_titulo}
              </p>
            </div>
          </div>
        </div>

        {/* Match Score */}
        <div className="ml-6 text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${quality.color}-100 text-${quality.color}-800 mb-2`}>
            {quality.label}
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800">{match.nota_media}</p>
            <p className="text-sm text-gray-600">Nota Média</p>
          </div>
        </div>
      </div>

      {/* Match Details */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{match.nota_media}</p>
            <p className="text-sm text-gray-600">Nota Média</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{match.total_respostas}</p>
            <p className="text-sm text-gray-600">Respostas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {Math.round((match.nota_media / 10) * 100)}%
            </p>
            <p className="text-sm text-gray-600">Compatibilidade</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-end space-x-3">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
          Ver Details
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
          Entrar em Contato
        </button>
      </div>
    </div>
  );
};

// Helper function for match quality
const getMatchQuality = (nota) => {
  if (nota >= 9) return { label: 'Excelente', color: 'green' };
  if (nota >= 8) return { label: 'Muito Bom', color: 'blue' };
  if (nota >= 7) return { label: 'Bom', color: 'yellow' };
  return { label: 'Regular', color: 'gray' };
};