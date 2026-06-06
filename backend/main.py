import sys, uvicorn 
from pathlib import Path
from src import create_app

sys.path.append(str(Path(__file__).parent))# Adiciona o diretório atual ao caminho do sistema para permitir a importação de módulos locais

app = create_app()# Cria a aplicação FastAPI chamando a função create_app definida no módulo src.__init__.py

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)# Inicia o servidor Uvicorn para rodar a aplicação FastAPI, especificando o módulo e a variável da aplicação, o host, a porta e habilitando o modo de recarga automática para desenvolvimento.