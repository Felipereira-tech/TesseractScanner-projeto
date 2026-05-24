# scanner.py

import cv2
import numpy as np
import math
import src.services.utils as utils

class CartaoScanner:
    def __init__(self, total_questoes, gabarito, alternativas=5):
        self.questions = total_questoes
        self.gabarito = gabarito
        self.choices = alternativas
        # CONFIGURAÇÃO CRÍTICA DO SEU LAYOUT:
        self.q_per_col = 24 
        self.width_img = 700
        self.height_img = 900
        self.min_area = 50000

    def processar(self, img_bytes):
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Imagem corrompida ou formato inválido.")

        # 1. Preparação da Imagem
        imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        imgBlur = cv2.GaussianBlur(imgGray, (5, 5), 1)
        imgCanny = cv2.Canny(imgBlur, 10, 50)

        # 2. Detecção do Cartão
        contours, _ = cv2.findContours(imgCanny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        rectCon = utils.rectContour(contours)

        if len(rectCon) == 0 or cv2.contourArea(rectCon[0]) < self.min_area:
            raise ValueError("Cartão-resposta não detectado com clareza. Ajuste a iluminação e tente novamente.")

        biggestContour = utils.getCornerPoints(rectCon[0])
        if biggestContour.size != 8:
            raise ValueError("Os 4 cantos da folha não foram detectados perfeitamente.")

        # 3. Alinhamento (Warp Perspective)
        biggestContour = utils.reorder(biggestContour)
        pt1 = np.float32(biggestContour)
        pt2 = np.float32([[0, 0], [self.width_img, 0], [0, self.height_img], [self.width_img, self.height_img]])
        matrix = cv2.getPerspectiveTransform(pt1, pt2)
        imgWarpColored = cv2.warpPerspective(img, matrix, (self.width_img, self.height_img))

        imgWarpGray = cv2.cvtColor(imgWarpColored, cv2.COLOR_BGR2GRAY)
        imgThresh = cv2.threshold(imgWarpGray, 150, 255, cv2.THRESH_BINARY_INV)[1]

        # 4. Extração de Bolinhas por Coluna
        boxes = self._extrair_bolinhas(imgThresh)
        
        if len(boxes) != self.questions * self.choices:
            raise ValueError(f"Falha no mapeamento. Esperado {self.questions * self.choices} bolinhas, mas encontrou {len(boxes)}. Verifique as bordas do cartão.")

        # 5. Análise de Marcações (Dinâmico)
        myPixelVal = np.zeros((self.questions, self.choices))
        countR, countC = 0, 0
        for image in boxes:
            myPixelVal[countR][countC] = cv2.countNonZero(image)
            countC += 1
            if countC == self.choices:
                countR += 1
                countC = 0

        area_bolinha = boxes[0].shape[0] * boxes[0].shape[1]
        limiar_dinamico = int(area_bolinha * 0.35) # 35% de preenchimento para considerar marcado

        myIndex = []
        for x in range(self.questions):
            arr = myPixelVal[x]
            marcacoes = np.where(arr > limiar_dinamico)[0]

            if len(marcacoes) == 0:
                myIndex.append(-1) # Branco
            elif len(marcacoes) > 1:
                myIndex.append(-2) # Anulada/Rasura
            else:
                myIndex.append(int(np.argmax(arr)))

        # 6. Avaliação
        grading = [1 if myIndex[x] == self.gabarito[x] else 0 for x in range(self.questions)]
        acertos = sum(grading)

        # 7. Feedback Visual
        imgResult = self._desenhar_respostas(imgWarpColored.copy(), myIndex, grading)

        # Retorna os dados processados e a imagem final codificada para upload
        _, buffer = cv2.imencode('.jpg', imgResult)
        return acertos, myIndex, buffer

    def _extrair_bolinhas(self, imgThresh):
        """ Divide a imagem respeitando as colunas físicas do cartão """
        num_cols = math.ceil(self.questions / self.q_per_col)# Calcula o número de colunas necessárias com base na quantidade total de questões e na configuração de questões por coluna
        col_width = self.width_img // num_cols
        boxes = []
        
        for c in range(num_cols):
            start_q = c * self.q_per_col
            end_q = min(start_q + self.q_per_col, self.questions)
            q_in_this_col = end_q - start_q
            
            col_img = imgThresh[:, c * col_width : (c + 1) * col_width]
            
            # A altura da linha DEVE ser dividida sempre por 24 para manter a proporção,
            # mesmo que a última coluna tenha menos de 24 questões.
            row_height = col_img.shape[0] // self.q_per_col
            
            for r in range(q_in_this_col):
                row_img = col_img[r * row_height : (r + 1) * row_height, :]
                choice_width = row_img.shape[1] // self.choices
                
                for ch in range(self.choices):
                    box = row_img[:, ch * choice_width : (ch + 1) * choice_width]
                    boxes.append(box)
        return boxes

    def _desenhar_respostas(self, img, myIndex, grading):
        """ Pinta as bolinhas corretas e incorretas no layout fatiado """
        num_cols = math.ceil(self.questions / self.q_per_col)
        col_width = int(self.width_img / num_cols)
        secW = int(col_width / self.choices)
        secH = int(self.height_img / self.q_per_col)

        raio = int(secW * 0.35)

        for x in range(self.questions):
            myAns = myIndex[x]
            correta = self.gabarito[x]
            
            c = x // self.q_per_col
            r = x % self.q_per_col
            
            offset_x = c * col_width
            cX = offset_x + (correta * secW) + (secW // 2)
            cY = (r * secH) + (secH // 2)

            if grading[x] == 1:
                cv2.circle(img, (cX, cY), raio, (0, 255, 0), cv2.FILLED)
            else:
                if myAns >= 0:
                    alunoX = offset_x + (myAns * secW) + (secW // 2)
                    cv2.circle(img, (alunoX, cY), raio, (0, 0, 255), cv2.FILLED)
                cv2.circle(img, (cX, cY), raio, (0, 255, 0), cv2.FILLED)

        return img