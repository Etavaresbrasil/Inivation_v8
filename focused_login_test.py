#!/usr/bin/env python3
"""
Focused Login System Test for TCC Inovation Platform
Tests the critical registration → login → profile access flow
"""

import requests
import sys
import json
from datetime import datetime

class FocusedLoginTester:
    def __init__(self, base_url: str = "https://96abef81-db51-40fd-a1fb-5d11797adb77.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.test_users = []
        self.tokens = {}
        
        print(f"🎯 TESTE FOCADO DO SISTEMA DE LOGIN")
        print(f"📍 Base URL: {self.base_url}")
        print(f"⏰ Timestamp: {self.timestamp}")
        print("=" * 60)

    def test_complete_auth_flow(self):
        """Test complete authentication flow for each user type"""
        
        # Test users with unique emails using timestamp
        user_types = [
            {
                "type": "admin",
                "email": f"admin_{self.timestamp}@teste.com",
                "nome": "Admin Teste",
                "senha": "TestPass123!",
                "tipo": "admin"
            },
            {
                "type": "empresa", 
                "email": f"empresa_{self.timestamp}@teste.com",
                "nome": "Empresa Teste LTDA",
                "senha": "TestPass123!",
                "tipo": "empresa"
            },
            {
                "type": "formando",
                "email": f"formando_{self.timestamp}@teste.com", 
                "nome": "João Silva Formando",
                "senha": "TestPass123!",
                "tipo": "formando"
            }
        ]
        
        all_success = True
        
        for user_data in user_types:
            print(f"\n🔄 TESTANDO FLUXO COMPLETO PARA: {user_data['type'].upper()}")
            print("-" * 50)
            
            # Step 1: Registration
            print(f"1️⃣ Registrando usuário {user_data['type']}...")
            reg_success, reg_response = self.register_user(user_data)
            
            if not reg_success:
                print(f"❌ Falha no registro para {user_data['type']}")
                all_success = False
                continue
                
            # Step 2: Login immediately after registration
            print(f"2️⃣ Fazendo login para {user_data['type']}...")
            login_success, login_response = self.login_user(user_data['email'], user_data['senha'])
            
            if not login_success:
                print(f"❌ Falha no login para {user_data['type']}")
                all_success = False
                continue
                
            # Step 3: Access profile with token
            print(f"3️⃣ Acessando perfil para {user_data['type']}...")
            token = login_response.get('access_token')
            profile_success, profile_data = self.get_profile(token)
            
            if not profile_success:
                print(f"❌ Falha no acesso ao perfil para {user_data['type']}")
                all_success = False
                continue
                
            # Store successful data
            self.tokens[user_data['type']] = token
            self.test_users.append({
                'type': user_data['type'],
                'email': user_data['email'],
                'token': token,
                'user_data': profile_data
            })
            
            print(f"✅ Fluxo completo OK para {user_data['type']}")
            print(f"   👤 Nome: {profile_data.get('nome')}")
            print(f"   📧 Email: {profile_data.get('email')}")
            print(f"   🏷️ Tipo: {profile_data.get('tipo')}")
            
        return all_success

    def register_user(self, user_data):
        """Register a new user"""
        try:
            response = requests.post(
                f"{self.base_url}/register",
                json=user_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"   ✅ Registro OK - Status: {response.status_code}")
                return True, response.json()
            else:
                print(f"   ❌ Registro FALHOU - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   📝 Erro: {error_data}")
                except:
                    print(f"   📝 Resposta: {response.text}")
                return False, {}
                
        except Exception as e:
            print(f"   ❌ Erro de conexão: {str(e)}")
            return False, {}

    def login_user(self, email, senha):
        """Login user"""
        try:
            login_data = {"email": email, "senha": senha}
            response = requests.post(
                f"{self.base_url}/login",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"   ✅ Login OK - Status: {response.status_code}")
                data = response.json()
                print(f"   🔑 Token gerado: {data.get('access_token', 'N/A')[:20]}...")
                return True, data
            else:
                print(f"   ❌ Login FALHOU - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   📝 Erro: {error_data}")
                except:
                    print(f"   📝 Resposta: {response.text}")
                return False, {}
                
        except Exception as e:
            print(f"   ❌ Erro de conexão: {str(e)}")
            return False, {}

    def get_profile(self, token):
        """Get user profile"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            }
            
            response = requests.get(
                f"{self.base_url}/profile",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"   ✅ Perfil OK - Status: {response.status_code}")
                return True, response.json()
            else:
                print(f"   ❌ Perfil FALHOU - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   📝 Erro: {error_data}")
                except:
                    print(f"   📝 Resposta: {response.text}")
                return False, {}
                
        except Exception as e:
            print(f"   ❌ Erro de conexão: {str(e)}")
            return False, {}

    def test_api_health(self):
        """Test API health"""
        print("\n🏥 TESTANDO SAÚDE DA API")
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ API OK - {data.get('message', 'N/A')}")
                return True
            else:
                print(f"❌ API com problema - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Erro de conexão com API: {str(e)}")
            return False

    def run_focused_test(self):
        """Run focused authentication test"""
        print("🎯 EXECUTANDO TESTE FOCADO DE AUTENTICAÇÃO")
        print("=" * 60)
        
        # Test API health first
        api_ok = self.test_api_health()
        if not api_ok:
            print("❌ API não está respondendo. Abortando testes.")
            return 1
            
        # Test complete auth flow
        auth_ok = self.test_complete_auth_flow()
        
        # Print final results
        print("\n" + "=" * 60)
        print("📊 RESULTADO DO TESTE FOCADO")
        print("=" * 60)
        
        if auth_ok:
            print("✅ SISTEMA DE LOGIN FUNCIONANDO CORRETAMENTE!")
            print(f"   Usuários testados com sucesso: {len(self.test_users)}")
            for user in self.test_users:
                print(f"   - {user['type']}: {user['email']}")
            print("\n🎉 O problema crítico do login foi RESOLVIDO!")
            return 0
        else:
            print("❌ SISTEMA DE LOGIN COM PROBLEMAS!")
            print("   Falhas detectadas no fluxo de autenticação.")
            print("   ⚠️  O problema crítico do login PERSISTE!")
            return 1

def main():
    """Main function"""
    tester = FocusedLoginTester()
    return tester.run_focused_test()

if __name__ == "__main__":
    sys.exit(main())