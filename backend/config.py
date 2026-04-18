import firebase_admin
from firebase_admin import credentials, firestore, storage

# --- VARIÁVEIS DE AMBIENTE / CONFIGURAÇÃO ---
FIREBASE_CREDENTIALS_PATH = "firebase-service-account.json"
STORAGE_BUCKET = "SEU_PROJETO.appspot.com" # Substitua pelo ID real do seu Storage

# Variável global para garantir que o app inicialize apenas uma vez
_firebase_app = None

def get_firebase_clients():
    global _firebase_app
    if not _firebase_app:
        try:
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            _firebase_app = firebase_admin.initialize_app(cred, {
                'storageBucket': STORAGE_BUCKET
            })
        except ValueError:
            # Caso o app já tenha sido inicializado em outro escopo
            _firebase_app = firebase_admin.get_app()
            
    return firestore.client(), storage.bucket()