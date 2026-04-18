import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

_supabase_client: Client = None

def get_supabase_client() -> Client:

    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("As variáveis SUPABASE_URL e SUPABASE_KEY não foram encontradas no .env")
        
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
    return _supabase_client

supabase = get_supabase_client()
