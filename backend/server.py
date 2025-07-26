from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = "tcc_inovation_secret_key_2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="TCC Inovation API")
api_router = APIRouter(prefix="/api")

# Models
class UserType(str):
    ADMIN = "admin"
    EMPRESA = "empresa"
    FORMANDO = "formando"

class Usuario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    nome: str
    tipo: str  # admin, empresa, formando
    criado_em: datetime = Field(default_factory=datetime.utcnow)

class UsuarioCreate(BaseModel):
    email: EmailStr
    nome: str
    senha: str
    tipo: str

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str

class Empresa(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    cnpj: str
    descricao: str
    usuario_id: str
    criada_em: datetime = Field(default_factory=datetime.utcnow)

class EmpresaCreate(BaseModel):
    nome: str
    cnpj: str
    descricao: str

class Desafio(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    descricao: str
    empresa_id: str
    criado_em: datetime = Field(default_factory=datetime.utcnow)

class DesafioCreate(BaseModel):
    titulo: str
    descricao: str

class Resposta(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    usuario_id: str
    desafio_id: str
    texto: str
    enviada_em: datetime = Field(default_factory=datetime.utcnow)

class RespostaCreate(BaseModel):
    desafio_id: str
    texto: str

class Avaliacao(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    resposta_id: str
    nota: float
    comentario: Optional[str] = None
    avaliado_em: datetime = Field(default_factory=datetime.utcnow)

class AvaliacaoCreate(BaseModel):
    resposta_id: str
    nota: float
    comentario: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_id: str
    user_name: str

class MatchResult(BaseModel):
    formando_id: str
    formando_nome: str
    empresa_id: str
    empresa_nome: str
    desafio_titulo: str
    nota_media: float
    total_respostas: int

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def validate_cnpj(cnpj: str) -> bool:
    # Remove formatting
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    return len(cnpj) == 14

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = await db.usuarios.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    return Usuario(**user)

# Authentication Routes
@api_router.get("/")
async def root():
    return {"message": "TCC Inovation API - Conectando formandos e empresas!", "version": "1.0", "status": "active"}

@api_router.post("/register", response_model=Token)
async def register(user_data: UsuarioCreate):
    # Check if user exists
    existing_user = await db.usuarios.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Validate user type
    if user_data.tipo not in [UserType.ADMIN, UserType.EMPRESA, UserType.FORMANDO]:
        raise HTTPException(status_code=400, detail="Tipo de usuário inválido")
    
    # Create user
    user_dict = user_data.dict()
    user_dict["senha_hash"] = get_password_hash(user_data.senha)
    del user_dict["senha"]
    
    # Create user object without senha_hash for response
    user_dict_clean = user_dict.copy()
    del user_dict_clean["senha_hash"]
    user = Usuario(**user_dict_clean)
    
    # Save to database with senha_hash
    user_to_save = user.dict()
    user_to_save["senha_hash"] = user_dict["senha_hash"]
    await db.usuarios.insert_one(user_to_save)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_type=user.tipo,
        user_id=user.id,
        user_name=user.nome
    )

@api_router.post("/login", response_model=Token)
async def login(login_data: UsuarioLogin):
    user_doc = await db.usuarios.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if not verify_password(login_data.senha, user_doc["senha_hash"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    user = Usuario(**user_doc)
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_type=user.tipo,
        user_id=user.id,
        user_name=user.nome
    )

@api_router.get("/profile", response_model=Usuario)
async def get_profile(current_user: Usuario = Depends(get_current_user)):
    return current_user

# Company Routes
@api_router.post("/empresas", response_model=Empresa)
async def create_empresa(empresa_data: EmpresaCreate, current_user: Usuario = Depends(get_current_user)):
    if current_user.tipo != UserType.EMPRESA:
        raise HTTPException(status_code=403, detail="Apenas empresas podem criar perfil empresarial")
    
    # Check if user already has a company
    existing_empresa = await db.empresas.find_one({"usuario_id": current_user.id})
    if existing_empresa:
        raise HTTPException(status_code=400, detail="Usuário já possui uma empresa cadastrada")
    
    # Validate CNPJ
    if not validate_cnpj(empresa_data.cnpj):
        raise HTTPException(status_code=400, detail="CNPJ inválido")
    
    # Check if CNPJ already exists
    existing_cnpj = await db.empresas.find_one({"cnpj": empresa_data.cnpj})
    if existing_cnpj:
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    
    empresa_dict = empresa_data.dict()
    empresa_dict["usuario_id"] = current_user.id
    empresa = Empresa(**empresa_dict)
    
    await db.empresas.insert_one(empresa.dict())
    return empresa

@api_router.get("/empresas", response_model=List[Empresa])
async def get_empresas():
    empresas = await db.empresas.find().to_list(1000)
    return [Empresa(**empresa) for empresa in empresas]

@api_router.get("/empresas/me", response_model=Empresa)
async def get_my_empresa(current_user: Usuario = Depends(get_current_user)):
    if current_user.tipo != UserType.EMPRESA:
        raise HTTPException(status_code=403, detail="Apenas empresas podem acessar este endpoint")
    
    empresa_doc = await db.empresas.find_one({"usuario_id": current_user.id})
    if not empresa_doc:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    return Empresa(**empresa_doc)

# Challenge Routes
@api_router.post("/desafios", response_model=Desafio)
async def create_desafio(desafio_data: DesafioCreate, current_user: Usuario = Depends(get_current_user)):
    if current_user.tipo != UserType.EMPRESA:
        raise HTTPException(status_code=403, detail="Apenas empresas podem criar desafios")
    
    # Get company
    empresa_doc = await db.empresas.find_one({"usuario_id": current_user.id})
    if not empresa_doc:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    desafio_dict = desafio_data.dict()
    desafio_dict["empresa_id"] = empresa_doc["id"]
    desafio = Desafio(**desafio_dict)
    
    await db.desafios.insert_one(desafio.dict())
    return desafio

@api_router.get("/desafios", response_model=List[Desafio])
async def get_desafios():
    desafios = await db.desafios.find().to_list(1000)
    return [Desafio(**desafio) for desafio in desafios]

@api_router.get("/desafios/empresa", response_model=List[Desafio])
async def get_empresa_desafios(current_user: Usuario = Depends(get_current_user)):
    if current_user.tipo != UserType.EMPRESA:
        raise HTTPException(status_code=403, detail="Apenas empresas podem acessar este endpoint")
    
    empresa_doc = await db.empresas.find_one({"usuario_id": current_user.id})
    if not empresa_doc:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    desafios = await db.desafios.find({"empresa_id": empresa_doc["id"]}).to_list(1000)
    return [Desafio(**desafio) for desafio in desafios]

# Response Routes
@api_router.post("/respostas", response_model=Resposta)
async def create_resposta(resposta_data: RespostaCreate, current_user: Usuario = Depends(get_current_user)):
    if current_user.tipo != UserType.FORMANDO:
        raise HTTPException(status_code=403, detail="Apenas formandos podem enviar respostas")
    
    # Check if challenge exists
    desafio_doc = await db.desafios.find_one({"id": resposta_data.desafio_id})
    if not desafio_doc:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    # Check if user already answered this challenge
    existing_resposta = await db.respostas.find_one({
        "usuario_id": current_user.id,
        "desafio_id": resposta_data.desafio_id
    })
    if existing_resposta:
        raise HTTPException(status_code=400, detail="Você já respondeu este desafio")
    
    resposta_dict = resposta_data.dict()
    resposta_dict["usuario_id"] = current_user.id
    resposta = Resposta(**resposta_dict)
    
    await db.respostas.insert_one(resposta.dict())
    return resposta

@api_router.get("/respostas/desafio/{desafio_id}", response_model=List[Resposta])
async def get_respostas_desafio(desafio_id: str, current_user: Usuario = Depends(get_current_user)):
    if current_user.tipo != UserType.EMPRESA:
        raise HTTPException(status_code=403, detail="Apenas empresas podem ver respostas")
    
    # Check if challenge belongs to user's company
    empresa_doc = await db.empresas.find_one({"usuario_id": current_user.id})
    if not empresa_doc:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    desafio_doc = await db.desafios.find_one({"id": desafio_id, "empresa_id": empresa_doc["id"]})
    if not desafio_doc:
        raise HTTPException(status_code=404, detail="Desafio não encontrado ou não pertence à sua empresa")
    
    respostas = await db.respostas.find({"desafio_id": desafio_id}).to_list(1000)
    return [Resposta(**resposta) for resposta in respostas]

@api_router.get("/respostas/me", response_model=List[Resposta])
async def get_my_respostas(current_user: Usuario = Depends(get_current_user)):
    if current_user.tipo != UserType.FORMANDO:
        raise HTTPException(status_code=403, detail="Apenas formandos podem acessar este endpoint")
    
    respostas = await db.respostas.find({"usuario_id": current_user.id}).to_list(1000)
    return [Resposta(**resposta) for resposta in respostas]

# Evaluation Routes
@api_router.post("/avaliacoes", response_model=Avaliacao)
async def create_avaliacao(avaliacao_data: AvaliacaoCreate, current_user: Usuario = Depends(get_current_user)):
    if current_user.tipo != UserType.EMPRESA:
        raise HTTPException(status_code=403, detail="Apenas empresas podem avaliar respostas")
    
    # Check if response exists and belongs to company's challenge
    resposta_doc = await db.respostas.find_one({"id": avaliacao_data.resposta_id})
    if not resposta_doc:
        raise HTTPException(status_code=404, detail="Resposta não encontrada")
    
    empresa_doc = await db.empresas.find_one({"usuario_id": current_user.id})
    if not empresa_doc:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    desafio_doc = await db.desafios.find_one({
        "id": resposta_doc["desafio_id"],
        "empresa_id": empresa_doc["id"]
    })
    if not desafio_doc:
        raise HTTPException(status_code=403, detail="Você não pode avaliar esta resposta")
    
    # Check if already evaluated
    existing_avaliacao = await db.avaliacoes.find_one({"resposta_id": avaliacao_data.resposta_id})
    if existing_avaliacao:
        raise HTTPException(status_code=400, detail="Resposta já foi avaliada")
    
    # Validate grade (0-10)
    if avaliacao_data.nota < 0 or avaliacao_data.nota > 10:
        raise HTTPException(status_code=400, detail="Nota deve estar entre 0 e 10")
    
    avaliacao = Avaliacao(**avaliacao_data.dict())
    await db.avaliacoes.insert_one(avaliacao.dict())
    return avaliacao

@api_router.get("/avaliacoes/resposta/{resposta_id}", response_model=Avaliacao)
async def get_avaliacao_resposta(resposta_id: str):
    avaliacao_doc = await db.avaliacoes.find_one({"resposta_id": resposta_id})
    if not avaliacao_doc:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    
    return Avaliacao(**avaliacao_doc)

# Matching Routes
@api_router.get("/matches", response_model=List[MatchResult])
async def get_matches(current_user: Usuario = Depends(get_current_user)):
    # Aggregate pipeline to calculate matches
    pipeline = [
        {
            "$lookup": {
                "from": "avaliacoes",
                "localField": "id",
                "foreignField": "resposta_id",
                "as": "avaliacao"
            }
        },
        {
            "$match": {
                "avaliacao": {"$ne": []}
            }
        },
        {
            "$lookup": {
                "from": "usuarios",
                "localField": "usuario_id",
                "foreignField": "id",
                "as": "formando"
            }
        },
        {
            "$lookup": {
                "from": "desafios",
                "localField": "desafio_id",
                "foreignField": "id",
                "as": "desafio"
            }
        },
        {
            "$lookup": {
                "from": "empresas",
                "localField": "desafio.empresa_id",
                "foreignField": "id",
                "as": "empresa"
            }
        },
        {
            "$group": {
                "_id": {
                    "formando_id": "$usuario_id",
                    "empresa_id": {"$arrayElemAt": ["$empresa.id", 0]}
                },
                "formando_nome": {"$first": {"$arrayElemAt": ["$formando.nome", 0]}},
                "empresa_nome": {"$first": {"$arrayElemAt": ["$empresa.nome", 0]}},
                "nota_media": {"$avg": {"$arrayElemAt": ["$avaliacao.nota", 0]}},
                "total_respostas": {"$sum": 1},
                "desafios": {"$addToSet": {"$arrayElemAt": ["$desafio.titulo", 0]}}
            }
        },
        {
            "$match": {
                "nota_media": {"$gte": 7.0}  # Only show good matches (grade >= 7)
            }
        },
        {
            "$sort": {
                "nota_media": -1
            }
        }
    ]
    
    matches_cursor = db.respostas.aggregate(pipeline)
    matches = await matches_cursor.to_list(1000)
    
    results = []
    for match in matches:
        results.append(MatchResult(
            formando_id=match["_id"]["formando_id"],
            formando_nome=match["formando_nome"],
            empresa_id=match["_id"]["empresa_id"],
            empresa_nome=match["empresa_nome"],
            desafio_titulo=match["desafios"][0] if match["desafios"] else "Múltiplos desafios",
            nota_media=round(match["nota_media"], 2),
            total_respostas=match["total_respostas"]
        ))
    
    return results

# Admin Routes
@api_router.get("/admin/usuarios", response_model=List[Usuario])
async def get_all_usuarios(current_user: Usuario = Depends(get_current_user)):
    if current_user.tipo != UserType.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas administradores podem acessar este endpoint")
    
    usuarios = await db.usuarios.find().to_list(1000)
    return [Usuario(**usuario) for usuario in usuarios]

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: Usuario = Depends(get_current_user)):
    if current_user.tipo != UserType.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas administradores podem acessar este endpoint")
    
    total_usuarios = await db.usuarios.count_documents({})
    total_empresas = await db.empresas.count_documents({})
    total_formandos = await db.usuarios.count_documents({"tipo": UserType.FORMANDO})
    total_desafios = await db.desafios.count_documents({})
    total_respostas = await db.respostas.count_documents({})
    total_avaliacoes = await db.avaliacoes.count_documents({})
    
    return {
        "total_usuarios": total_usuarios,
        "total_empresas": total_empresas,
        "total_formandos": total_formandos,
        "total_desafios": total_desafios,
        "total_respostas": total_respostas,
        "total_avaliacoes": total_avaliacoes
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()