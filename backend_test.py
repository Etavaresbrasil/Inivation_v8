#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for TCC Inovation Platform
Tests all endpoints with different user types and workflows
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class TCCInovationAPITester:
    def __init__(self, base_url: str = "https://96abef81-db51-40fd-a1fb-5d11797adb77.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for different user types
        self.users = {}   # Store user data
        self.empresas = {}  # Store company data
        self.desafios = {}  # Store challenge data
        self.respostas = {}  # Store response data
        self.tests_run = 0
        self.tests_passed = 0
        
        print(f"🚀 Iniciando testes da API TCC Inovation")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, user_type: Optional[str] = None) -> tuple:
        """Execute a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add authorization if user_type specified
        if user_type and user_type in self.tokens:
            headers['Authorization'] = f'Bearer {self.tokens[user_type]}'

        self.tests_run += 1
        print(f"\n🔍 Teste {self.tests_run}: {name}")
        print(f"   {method} {endpoint}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"   ✅ PASSOU - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"   ❌ FALHOU - Esperado {expected_status}, recebido {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   📝 Erro: {error_data}")
                    return False, error_data
                except:
                    print(f"   📝 Resposta: {response.text}")
                    return False, {}

        except requests.exceptions.RequestException as e:
            print(f"   ❌ FALHOU - Erro de conexão: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"   ❌ FALHOU - Erro: {str(e)}")
            return False, {}

    def test_api_health(self):
        """Test API health endpoint"""
        print("\n🏥 TESTANDO SAÚDE DA API")
        success, data = self.run_test("API Health Check", "GET", "", 200)
        if success:
            print(f"   📊 Mensagem: {data.get('message', 'N/A')}")
            print(f"   📊 Versão: {data.get('version', 'N/A')}")
            print(f"   📊 Status: {data.get('status', 'N/A')}")
        return success

    def test_user_registration(self):
        """Test user registration for all user types"""
        print("\n👥 TESTANDO CADASTRO DE USUÁRIOS")
        
        # Test data for different user types
        test_users = [
            {
                "type": "admin",
                "data": {
                    "email": "admin@teste.com",
                    "nome": "Administrador Teste",
                    "senha": "123456",
                    "tipo": "admin"
                }
            },
            {
                "type": "empresa",
                "data": {
                    "email": "empresa@teste.com",
                    "nome": "Empresa Teste LTDA",
                    "senha": "123456",
                    "tipo": "empresa"
                }
            },
            {
                "type": "formando",
                "data": {
                    "email": "formando@teste.com",
                    "nome": "João Silva Formando",
                    "senha": "123456",
                    "tipo": "formando"
                }
            }
        ]
        
        all_success = True
        for user_info in test_users:
            success, response = self.run_test(
                f"Cadastro {user_info['type']}", 
                "POST", 
                "register", 
                200, 
                user_info['data']
            )
            
            if success:
                self.tokens[user_info['type']] = response.get('access_token')
                self.users[user_info['type']] = {
                    'id': response.get('user_id'),
                    'name': response.get('user_name'),
                    'type': response.get('user_type'),
                    'email': user_info['data']['email']
                }
                print(f"   🔑 Token {user_info['type']} salvo")
            else:
                all_success = False
                
        return all_success

    def test_user_login(self):
        """Test user login"""
        print("\n🔐 TESTANDO LOGIN DE USUÁRIOS")
        
        login_data = [
            {"type": "admin", "email": "admin@teste.com", "senha": "123456"},
            {"type": "empresa", "email": "empresa@teste.com", "senha": "123456"},
            {"type": "formando", "email": "formando@teste.com", "senha": "123456"}
        ]
        
        all_success = True
        for login_info in login_data:
            success, response = self.run_test(
                f"Login {login_info['type']}", 
                "POST", 
                "login", 
                200, 
                {"email": login_info['email'], "senha": login_info['senha']}
            )
            
            if success:
                # Update token (in case registration failed but login works)
                self.tokens[login_info['type']] = response.get('access_token')
                print(f"   🔑 Token {login_info['type']} atualizado")
            else:
                all_success = False
                
        return all_success

    def test_profile_access(self):
        """Test profile access for all user types"""
        print("\n👤 TESTANDO ACESSO AO PERFIL")
        
        all_success = True
        for user_type in ['admin', 'empresa', 'formando']:
            if user_type in self.tokens:
                success, data = self.run_test(
                    f"Perfil {user_type}", 
                    "GET", 
                    "profile", 
                    200, 
                    user_type=user_type
                )
                if success:
                    print(f"   📊 Nome: {data.get('nome', 'N/A')}")
                    print(f"   📊 Email: {data.get('email', 'N/A')}")
                    print(f"   📊 Tipo: {data.get('tipo', 'N/A')}")
                else:
                    all_success = False
            else:
                print(f"   ⚠️  Token não disponível para {user_type}")
                all_success = False
                
        return all_success

    def test_company_operations(self):
        """Test company-specific operations"""
        print("\n🏢 TESTANDO OPERAÇÕES DE EMPRESA")
        
        if 'empresa' not in self.tokens:
            print("   ⚠️  Token de empresa não disponível")
            return False
            
        # Test company profile creation
        company_data = {
            "nome": "TechCorp Inovação",
            "cnpj": "12345678000195",
            "descricao": "Empresa de tecnologia focada em inovação e desenvolvimento de soluções digitais."
        }
        
        success, response = self.run_test(
            "Criar perfil empresa", 
            "POST", 
            "empresas", 
            200, 
            company_data, 
            "empresa"
        )
        
        if success:
            self.empresas['test_company'] = response
            print(f"   🏢 Empresa criada: {response.get('nome')}")
            print(f"   🏢 CNPJ: {response.get('cnpj')}")
        
        # Test get my company
        success2, _ = self.run_test(
            "Buscar minha empresa", 
            "GET", 
            "empresas/me", 
            200, 
            user_type="empresa"
        )
        
        # Test list all companies
        success3, companies = self.run_test(
            "Listar todas empresas", 
            "GET", 
            "empresas", 
            200
        )
        
        if success3:
            print(f"   📊 Total de empresas: {len(companies)}")
        
        return success and success2 and success3

    def test_challenge_operations(self):
        """Test challenge operations"""
        print("\n🎯 TESTANDO OPERAÇÕES DE DESAFIOS")
        
        if 'empresa' not in self.tokens:
            print("   ⚠️  Token de empresa não disponível")
            return False
            
        # Create challenge
        challenge_data = {
            "titulo": "Desenvolvimento de Sistema Web",
            "descricao": "Desenvolva uma aplicação web completa usando React e Node.js. O sistema deve incluir autenticação, CRUD de usuários e interface responsiva. Prazo: 7 dias."
        }
        
        success, response = self.run_test(
            "Criar desafio", 
            "POST", 
            "desafios", 
            200, 
            challenge_data, 
            "empresa"
        )
        
        if success:
            self.desafios['test_challenge'] = response
            print(f"   🎯 Desafio criado: {response.get('titulo')}")
        
        # List all challenges
        success2, challenges = self.run_test(
            "Listar todos desafios", 
            "GET", 
            "desafios", 
            200
        )
        
        if success2:
            print(f"   📊 Total de desafios: {len(challenges)}")
        
        # List company challenges
        success3, company_challenges = self.run_test(
            "Listar desafios da empresa", 
            "GET", 
            "desafios/empresa", 
            200, 
            user_type="empresa"
        )
        
        if success3:
            print(f"   📊 Desafios da empresa: {len(company_challenges)}")
        
        return success and success2 and success3

    def test_response_operations(self):
        """Test response operations"""
        print("\n📝 TESTANDO OPERAÇÕES DE RESPOSTAS")
        
        if 'formando' not in self.tokens:
            print("   ⚠️  Token de formando não disponível")
            return False
            
        if 'test_challenge' not in self.desafios:
            print("   ⚠️  Desafio de teste não disponível")
            return False
            
        # Submit response
        response_data = {
            "desafio_id": self.desafios['test_challenge']['id'],
            "texto": "Minha solução para o desafio:\n\n1. Frontend: React com hooks e context API\n2. Backend: Node.js com Express\n3. Banco: MongoDB\n4. Autenticação: JWT\n5. Deploy: Heroku\n\nImplementei todas as funcionalidades solicitadas com foco na experiência do usuário e performance."
        }
        
        success, response = self.run_test(
            "Enviar resposta", 
            "POST", 
            "respostas", 
            200, 
            response_data, 
            "formando"
        )
        
        if success:
            self.respostas['test_response'] = response
            print(f"   📝 Resposta enviada para desafio")
        
        # Get my responses
        success2, my_responses = self.run_test(
            "Buscar minhas respostas", 
            "GET", 
            "respostas/me", 
            200, 
            user_type="formando"
        )
        
        if success2:
            print(f"   📊 Minhas respostas: {len(my_responses)}")
        
        # Get responses for challenge (as company)
        if 'test_challenge' in self.desafios:
            challenge_id = self.desafios['test_challenge']['id']
            success3, challenge_responses = self.run_test(
                "Buscar respostas do desafio", 
                "GET", 
                f"respostas/desafio/{challenge_id}", 
                200, 
                user_type="empresa"
            )
            
            if success3:
                print(f"   📊 Respostas do desafio: {len(challenge_responses)}")
        else:
            success3 = False
        
        return success and success2 and success3

    def test_evaluation_operations(self):
        """Test evaluation operations"""
        print("\n⭐ TESTANDO OPERAÇÕES DE AVALIAÇÃO")
        
        if 'empresa' not in self.tokens:
            print("   ⚠️  Token de empresa não disponível")
            return False
            
        if 'test_response' not in self.respostas:
            print("   ⚠️  Resposta de teste não disponível")
            return False
            
        # Create evaluation
        evaluation_data = {
            "resposta_id": self.respostas['test_response']['id'],
            "nota": 8.5,
            "comentario": "Excelente solução! Demonstrou conhecimento técnico sólido e boa estruturação do código. Pontos positivos: arquitetura bem definida, uso adequado das tecnologias, documentação clara. Sugestão de melhoria: implementar testes unitários."
        }
        
        success, response = self.run_test(
            "Criar avaliação", 
            "POST", 
            "avaliacoes", 
            200, 
            evaluation_data, 
            "empresa"
        )
        
        if success:
            print(f"   ⭐ Avaliação criada - Nota: {response.get('nota')}")
        
        # Get evaluation for response
        if 'test_response' in self.respostas:
            response_id = self.respostas['test_response']['id']
            success2, evaluation = self.run_test(
                "Buscar avaliação da resposta", 
                "GET", 
                f"avaliacoes/resposta/{response_id}", 
                200
            )
            
            if success2:
                print(f"   📊 Nota da avaliação: {evaluation.get('nota')}")
                print(f"   📊 Comentário: {evaluation.get('comentario', 'N/A')[:50]}...")
        else:
            success2 = False
        
        return success and success2

    def test_matching_system(self):
        """Test matching system"""
        print("\n💕 TESTANDO SISTEMA DE MATCHING")
        
        # Test matches endpoint (accessible by all authenticated users)
        all_success = True
        
        for user_type in ['admin', 'empresa', 'formando']:
            if user_type in self.tokens:
                success, matches = self.run_test(
                    f"Buscar matches ({user_type})", 
                    "GET", 
                    "matches", 
                    200, 
                    user_type=user_type
                )
                
                if success:
                    print(f"   💕 Matches encontrados ({user_type}): {len(matches)}")
                    for match in matches[:2]:  # Show first 2 matches
                        print(f"      - {match.get('formando_nome')} ↔ {match.get('empresa_nome')} (Nota: {match.get('nota_media')})")
                else:
                    all_success = False
            else:
                print(f"   ⚠️  Token não disponível para {user_type}")
                all_success = False
        
        return all_success

    def test_admin_operations(self):
        """Test admin-specific operations"""
        print("\n👑 TESTANDO OPERAÇÕES ADMINISTRATIVAS")
        
        if 'admin' not in self.tokens:
            print("   ⚠️  Token de admin não disponível")
            return False
        
        # Test admin stats
        success, stats = self.run_test(
            "Estatísticas admin", 
            "GET", 
            "admin/stats", 
            200, 
            user_type="admin"
        )
        
        if success:
            print(f"   📊 Total usuários: {stats.get('total_usuarios')}")
            print(f"   📊 Total empresas: {stats.get('total_empresas')}")
            print(f"   📊 Total formandos: {stats.get('total_formandos')}")
            print(f"   📊 Total desafios: {stats.get('total_desafios')}")
            print(f"   📊 Total respostas: {stats.get('total_respostas')}")
            print(f"   📊 Total avaliações: {stats.get('total_avaliacoes')}")
        
        # Test admin users list
        success2, users = self.run_test(
            "Listar todos usuários", 
            "GET", 
            "admin/usuarios", 
            200, 
            user_type="admin"
        )
        
        if success2:
            print(f"   📊 Total usuários listados: {len(users)}")
            # Show user type distribution
            user_types = {}
            for user in users:
                user_type = user.get('tipo', 'unknown')
                user_types[user_type] = user_types.get(user_type, 0) + 1
            
            for user_type, count in user_types.items():
                print(f"      - {user_type}: {count}")
        
        return success and success2

    def test_error_scenarios(self):
        """Test error scenarios and edge cases"""
        print("\n🚨 TESTANDO CENÁRIOS DE ERRO")
        
        all_success = True
        
        # Test unauthorized access
        success1, _ = self.run_test(
            "Acesso não autorizado", 
            "GET", 
            "admin/stats", 
            401  # Should fail without token
        )
        
        # Test invalid login
        success2, _ = self.run_test(
            "Login inválido", 
            "POST", 
            "login", 
            401, 
            {"email": "invalid@test.com", "senha": "wrongpassword"}
        )
        
        # Test duplicate email registration
        success3, _ = self.run_test(
            "Email duplicado", 
            "POST", 
            "register", 
            400, 
            {
                "email": "admin@teste.com",  # Already exists
                "nome": "Duplicate User",
                "senha": "123456",
                "tipo": "formando"
            }
        )
        
        # Test invalid CNPJ
        if 'empresa' in self.tokens:
            success4, _ = self.run_test(
                "CNPJ inválido", 
                "POST", 
                "empresas", 
                400, 
                {
                    "nome": "Invalid Company",
                    "cnpj": "123",  # Invalid CNPJ
                    "descricao": "Test company"
                },
                "empresa"
            )
        else:
            success4 = True  # Skip if no empresa token
        
        return success1 and success2 and success3 and success4

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🎯 EXECUTANDO TODOS OS TESTES")
        print("=" * 60)
        
        test_results = []
        
        # Core API tests
        test_results.append(("API Health", self.test_api_health()))
        test_results.append(("User Registration", self.test_user_registration()))
        test_results.append(("User Login", self.test_user_login()))
        test_results.append(("Profile Access", self.test_profile_access()))
        
        # Feature tests
        test_results.append(("Company Operations", self.test_company_operations()))
        test_results.append(("Challenge Operations", self.test_challenge_operations()))
        test_results.append(("Response Operations", self.test_response_operations()))
        test_results.append(("Evaluation Operations", self.test_evaluation_operations()))
        test_results.append(("Matching System", self.test_matching_system()))
        test_results.append(("Admin Operations", self.test_admin_operations()))
        
        # Error scenarios
        test_results.append(("Error Scenarios", self.test_error_scenarios()))
        
        # Print final results
        print("\n" + "=" * 60)
        print("📊 RESUMO DOS TESTES")
        print("=" * 60)
        
        passed_suites = 0
        total_suites = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ PASSOU" if result else "❌ FALHOU"
            print(f"{status} - {test_name}")
            if result:
                passed_suites += 1
        
        print(f"\n📈 ESTATÍSTICAS FINAIS:")
        print(f"   Suítes de teste: {passed_suites}/{total_suites}")
        print(f"   Testes individuais: {self.tests_passed}/{self.tests_run}")
        print(f"   Taxa de sucesso: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if passed_suites == total_suites and self.tests_passed == self.tests_run:
            print("\n🎉 TODOS OS TESTES PASSARAM! API está funcionando corretamente.")
            return 0
        else:
            print(f"\n⚠️  ALGUNS TESTES FALHARAM. Verifique os logs acima.")
            return 1

def main():
    """Main function"""
    tester = TCCInovationAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())