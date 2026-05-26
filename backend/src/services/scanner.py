import cv2
import numpy as np
import math
import src.services.utils as utils

class CartaoScanner:
    def __init__(self, total_questoes, gabarito, alternativas=5):
        """
        Método construtor: Inicializa as configurações, dimensões da imagem e 
        parâmetros de tolerância para a leitura do cartão-resposta.
        """
        self.questions = total_questoes
        self.gabarito = gabarito
        self.choices = alternativas
        self.q_per_col = 24  # Quantidade de questões por coluna na folha
        self.width_img = 700  # Largura padrão para a qual a imagem será redimensionada
        self.height_img = 900 # Altura padrão para a qual a imagem será redimensionada
        self.min_area = 5000  # Área mínima em pixels para detectar o contorno do cartão
        self.header_pct = 0.04 # Porcentagem da altura reservada para o cabeçalho
        self.numero_width_px = 117 # Largura em pixels reservada para o número da questão (ignorado na leitura)
        self.limiar_pct = 0.25 # % mínima de pixels pretos (preenchidos) para validar uma marcação
        self.dominancia = 1.10 # Fator para evitar rasuras: a opção mais preenchida deve ser 10% maior que a segunda

    def processar(self, img_bytes):
        """
        Função principal: Recebe a imagem em bytes, localiza o cartão, alinha a folha,
        analisa as bolinhas marcadas, compara com o gabarito e gera uma imagem de resultado.
        """
        # Converte o buffer de bytes em um array unidimensional do NumPy (tipo inteiros de 8 bits)
        nparr = np.frombuffer(img_bytes, np.uint8)
        # Decodifica a matriz do NumPy em uma imagem colorida (padrão BGR do OpenCV)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Imagem corrompida ou formato inválido.")

        # Salva e exibe logs da imagem original
        cv2.imwrite("debug_01_original.jpg", img)
        print(f">>> [1] original: {img.shape}")

        # 1. Preparação da Imagem
        # Converte a imagem colorida para escala de cinza (reduz o processamento de 3 canais para 1)
        imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        cv2.imwrite("debug_02_gray.jpg", imgGray)
        print(f">>> [2] grayscale salvo")

        # Aplica o filtro de desfoque Gaussiano para suavizar ruídos e imperfeições texturais da folha
        imgBlur = cv2.GaussianBlur(imgGray, (11, 11), 1)
        cv2.imwrite("debug_03_blur.jpg", imgBlur)
        print(f">>> [3] blur salvo")

        # Detector de bordas Canny: Identifica as mudanças bruscas de intensidade (contornos)
        imgCanny = cv2.Canny(imgBlur, 10, 50)
        cv2.imwrite("debug_04_canny.jpg", imgCanny)
        print(f">>> [4] canny salvo")

        # Cria uma matriz de uns (5x5) para servir como molde estrutural na dilatação
        kernel = np.ones((5, 5), np.uint8)
        # Dilata as bordas (engrossa as linhas brancas) para fechar eventuais falhas no contorno do cartão
        imgDilated = cv2.dilate(imgCanny, kernel, iterations=2)
        
        # 2. Detecção do contorno do cartão
        # Encontra todos os contornos externos baseados nas bordas dilatadas
        contours, _ = cv2.findContours(imgDilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        # Filtra e ordena os contornos que possuem formato retangular usando a função utilitária
        rectCon = utils.rectContour(contours)

        print(f">>> contornos totais: {len(contours)}")
        print(f">>> retângulos detectados: {len(rectCon)}")

        # Cria uma cópia para desenhar e debugar os 5 maiores contornos retangulares encontrados
        imgContornos = img.copy()
        for i, r in enumerate(rectCon[:5]):
            area = cv2.contourArea(r) # Calcula a área interna do contorno
            cor = [(0,255,0),(0,0,255),(255,0,0),(0,255,255),(255,0,255)][i] # Cores variadas para o debug
            cv2.drawContours(imgContornos, [r], -1, cor, 3) # Desenha a linha do contorno na imagem
            print(f">>> retângulo [{i}]: área={int(area)}")
        cv2.imwrite("debug_05_contornos.jpg", imgContornos)
        print(f">>> [5] contornos salvo")

        # Validação: Verifica se algum retângulo foi achado e se o maior deles respeita a área mínima
        if len(rectCon) == 0 or cv2.contourArea(rectCon[0]) < self.min_area:
            raise ValueError("Cartão-resposta não detectado com clareza. Ajuste a iluminação e tente novamente.")

        # Obtém os 4 pontos de canto (vértices) do maior retângulo encontrado
        biggestContour = utils.getCornerPoints(rectCon[0])
        if biggestContour.size != 8:
            raise ValueError("Os 4 cantos da folha não foram detectados perfeitamente.")

        # 3. Warp (Alinhamento de Perspectiva)
        # Ordena os cantos na sequência correta: superior-esquerdo, superior-direito, inferior-esquerdo, inferior-direito
        biggestContour = utils.reorder(biggestContour)
        pt1 = np.float32(biggestContour) # Cantos originais da foto (distorcidos)
        # Define os cantos ideais onde o cartão deve se encaixar no tamanho final (700x900)
        pt2 = np.float32([[0,0],[self.width_img,0],[0,self.height_img],[self.width_img,self.height_img]])
        # Calcula a matriz matemática de transformação de perspectiva
        matrix = cv2.getPerspectiveTransform(pt1, pt2)
        # Recorta, endireita e redimensiona o cartão baseado na matriz calculada
        imgWarpColored = cv2.warpPerspective(img, matrix, (self.width_img, self.height_img))
        cv2.imwrite("debug_06_warp.jpg", imgWarpColored)
        print(f">>> [6] warp salvo")

        # 4. Threshold (Binarização)
        # Transforma o cartão alinhado em escala de cinza
        imgWarpGray = cv2.cvtColor(imgWarpColored, cv2.COLOR_BGR2GRAY)
        # THRESH_BINARY_INV: Transforma o que for claro em preto, e o que for escuro (as marcações a caneta) em branco puro (255)
        imgThresh = cv2.threshold(imgWarpGray, 100, 255, cv2.THRESH_BINARY_INV)[1]
        cv2.imwrite("debug_07_thresh.jpg", imgThresh)
        print(f">>> [7] threshold salvo")

        # 5. Extração das bolinhas
        # Divide a imagem binarizada em "recortes" menores, um para cada alternativa
        boxes = self._extrair_bolinhas(imgThresh)

        # Geração de Grid Visual para Debug (Desenha linhas guias para checar o alinhamento das questões)
        imgGrid = imgWarpColored.copy()
        header_height = int(self.height_img * self.header_pct)
        row_height = (self.height_img - header_height) // self.q_per_col
        choice_width = (self.width_img - self.numero_width_px) // self.choices
        cv2.line(imgGrid, (0, header_height), (self.width_img, header_height), (0, 255, 255), 2)
        cv2.line(imgGrid, (self.numero_width_px, 0), (self.numero_width_px, self.height_img), (0, 165, 255), 2)
        for r in range(self.q_per_col + 1):
            y = header_height + r * row_height
            cv2.line(imgGrid, (0, y), (self.width_img, y), (255, 0, 0), 1)
        for ch in range(self.choices + 1):
            x = self.numero_width_px + ch * choice_width
            cv2.line(imgGrid, (x, header_height), (x, self.height_img), (0, 255, 0), 1)
        cv2.imwrite("debug_08_grid.jpg", imgGrid)
        print(f">>> [8] grid salvo")

        # Verifica se a quantidade de sub-imagens extraídas bate perfeitamente com a matemática do cartão
        if len(boxes) != self.questions * self.choices:
            raise ValueError(f"Falha no mapeamento. Esperado {self.questions * self.choices} bolinhas, encontrou {len(boxes)}.")

        # 6. Contagem de pixels preenchidos
        # Matriz vazia para armazenar a quantidade de pixels marcados por questão/alternativa
        myPixelVal = np.zeros((self.questions, self.choices))
        countR, countC = 0, 0
        for image in boxes:
            # Conta quantos pixels não são zero (ou seja, pixels brancos, que representam a caneta do aluno)
            myPixelVal[countR][countC] = cv2.countNonZero(image)
            countC += 1
            if countC == self.choices:
                countR += 1
                countC = 0

        # Define dinamicamente o limiar de pixels baseado no tamanho final da caixa da bolinha
        area_bolinha = boxes[0].shape[0] * boxes[0].shape[1]
        limiar = int(area_bolinha * self.limiar_pct)
        print(f">>> area_bolinha={area_bolinha} | limiar={limiar}")
        print(f">>> pixelVal:\n{myPixelVal}")

        # 7. Análise de escolha com dominância
        myIndex = [] # Guardará os índices das respostas detectadas (0=A, 1=B, etc)
        for x in range(self.questions):
            arr = myPixelVal[x]
            # Filtra quais alternativas passaram do limite mínimo de preenchimento
            marcacoes = np.where(arr > limiar)[0]
            
            if len(marcacoes) == 0:
                myIndex.append(-1) # Nenhuma marcação detectada (Questão em branco)
            elif len(marcacoes) == 1:
                myIndex.append(int(np.argmax(arr))) # Apenas uma marcação válida detectada
            else:
                # Caso de múltipla marcação: ordena os valores de pixel do maior para o menor
                sorted_vals = np.sort(arr)[::-1]
                # Regra da dominância: O maior preenchimento deve ser visivelmente superior ao segundo maior
                if sorted_vals[0] > sorted_vals[1] * self.dominancia:
                    myIndex.append(int(np.argmax(arr))) # Ignora a rasura menor e aceita a marcação dominante
                else:
                    myIndex.append(-2) # Múltipla marcação inválida (Dupla marcação/Rasura total)

        print(f">>> respostas lidas: {myIndex}")

        # 8. Avaliação (Correção automática)
        # Cria uma lista onde 1 representa acerto (index lido igual ao gabarito) e 0 representa erro
        grading = [1 if myIndex[x] == self.gabarito[x] else 0 for x in range(self.questions)]
        acertos = sum(grading) # Soma o total de acertos (número de '1's na lista)

        # 9. Feedback visual e retorno
        # Desenha as marcações coloridas de correção sobre o cartão alinhado
        imgResult = self._desenhar_respostas(imgWarpColored.copy(), myIndex, grading)
        cv2.imwrite("debug_09_resultado.jpg", imgResult)
        print(f">>> [9] resultado salvo | acertos={acertos}/{self.questions}")

        # Codifica a imagem final modificada de volta para um formato binário JPG (.jpg)
        _, buffer = cv2.imencode('.jpg', imgResult)
        return acertos, myIndex, buffer

    def _extrair_bolinhas(self, imgThresh):
        """
        Função auxiliar interna: Fatia a imagem binarizada baseando-se em cálculos de 
        proporções, gerando uma lista com os blocos individuais de cada alternativa.
        """
        header_height = int(self.height_img * self.header_pct)
        row_height = (self.height_img - header_height) // self.q_per_col
        boxes = []
        for r in range(self.questions):
            y_start = header_height + r * row_height
            y_end = y_start + row_height
            # Recorta a linha correspondente à questão, pulando a largura reservada para o número da questão
            row_img = imgThresh[y_start:y_end, self.numero_width_px:]
            cw = row_img.shape[1] // self.choices # Calcula a largura exata de cada alternativa na linha
            for ch in range(self.choices):
                # Recorta o bloco exato da alternativa corrente (A, B, C, D ou E)
                box = row_img[:, ch * cw:(ch+1) * cw]
                boxes.append(box)
        return boxes

    def _desenhar_respostas(self, img, myIndex, grading):
        """
        Função auxiliar interna: Desenha elipses coloridas sobre a folha de respostas original:
        - Verde: O aluno acertou a questão.
        - Vermelho: O aluno marcou essa alternativa incorreta.
        - Azul: Indica qual era a alternativa correta em caso de erro do aluno.
        """
        header_height = int(self.height_img * self.header_pct) 
        row_height = (self.height_img - header_height) // self.q_per_col 
        area_alt = self.width_img - self.numero_width_px 
        secW = area_alt // self.choices 
        rx = int(secW * 0.32) # Define proporcionalmente o raio X da elipse indicadora
        ry = int(row_height * 0.35) # Define proporcionalmente o raio Y da elipse indicadora

        for x in range(self.questions):
            myAns = myIndex[x] 

            # Pula o desenho para questões que foram deixadas totalmente em branco
            if myAns == -1:
                continue

            correta = self.gabarito[x]
            r = x % self.q_per_col
            cY = header_height + r * row_height + row_height // 2 # Centro Y da linha corrente
            cX = self.numero_width_px + correta * secW + secW // 2 # Centro X da alternativa gabarito

            if grading[x] == 1:
                # Desenha uma elipse sólida verde sobre a resposta correta assinalada pelo aluno
                cv2.ellipse(img, (cX, cY), (rx, ry), 0, 0, 360, (0, 255, 0), cv2.FILLED)
            else:
                # Se o aluno marcou uma alternativa errada e válida (maior ou igual a 0)
                if myAns >= 0:
                    alunoX = self.numero_width_px + myAns * secW + secW // 2
                    # Desenha uma elipse sólida vermelha na alternativa errada que o aluno escolheu
                    cv2.ellipse(img, (alunoX, cY), (rx, ry), 0, 0, 360, (0, 0, 255), cv2.FILLED)
                # Desenha uma elipse sólida azul na alternativa que era a resposta certa do gabarito
                cv2.ellipse(img, (cX, cY), (rx, ry), 0, 0, 360, (255, 0, 0), cv2.FILLED)

        return img