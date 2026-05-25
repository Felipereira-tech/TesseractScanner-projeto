import cv2
import numpy as np
import math
import src.services.utils as utils

class CartaoScanner:
    def __init__(self, total_questoes, gabarito, alternativas=5):
        self.questions = total_questoes
        self.gabarito = gabarito
        self.choices = alternativas
        self.q_per_col = 24
        self.width_img = 700
        self.height_img = 900
        self.min_area = 50000
        # PARÂMETROS CALIBRADOS
        self.header_pct = 0.04
        self.numero_width_px = 117
        self.limiar_pct = 0.28
        self.dominancia = 1.15

    def processar(self, img_bytes):
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Imagem corrompida ou formato inválido.")

        # 1. Preparação
        imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        imgBlur = cv2.GaussianBlur(imgGray, (5, 5), 1)
        imgCanny = cv2.Canny(imgBlur, 10, 50)

        # 2. Detecção do contorno
        contours, _ = cv2.findContours(imgCanny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        rectCon = utils.rectContour(contours)

        if len(rectCon) == 0 or cv2.contourArea(rectCon[0]) < self.min_area:
            raise ValueError("Cartão-resposta não detectado com clareza. Ajuste a iluminação e tente novamente.")

        biggestContour = utils.getCornerPoints(rectCon[0])
        if biggestContour.size != 8:
            raise ValueError("Os 4 cantos da folha não foram detectados perfeitamente.")

        # 3. Warp
        biggestContour = utils.reorder(biggestContour)
        pt1 = np.float32(biggestContour)
        pt2 = np.float32([[0,0],[self.width_img,0],[0,self.height_img],[self.width_img,self.height_img]])
        matrix = cv2.getPerspectiveTransform(pt1, pt2)
        imgWarpColored = cv2.warpPerspective(img, matrix, (self.width_img, self.height_img))

        # 4. Threshold adaptativo
        imgWarpGray = cv2.cvtColor(imgWarpColored, cv2.COLOR_BGR2GRAY)
        imgThresh = cv2.adaptiveThreshold(
            imgWarpGray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 31, 10
        )
        cv2.imwrite("debug_threshold.jpg", imgThresh)

        # 5. Extração das bolinhas
        boxes = self._extrair_bolinhas(imgThresh)

        if len(boxes) != self.questions * self.choices:
            raise ValueError(f"Falha no mapeamento. Esperado {self.questions * self.choices} bolinhas, encontrou {len(boxes)}.")

        # 6. Contagem de pixels
        myPixelVal = np.zeros((self.questions, self.choices))
        countR, countC = 0, 0
        for image in boxes:
            myPixelVal[countR][countC] = cv2.countNonZero(image)
            countC += 1
            if countC == self.choices:
                countR += 1
                countC = 0

        area_bolinha = boxes[0].shape[0] * boxes[0].shape[1]
        limiar = int(area_bolinha * self.limiar_pct)
        print(f">>> area_bolinha: {area_bolinha}, limiar: {limiar}")
        print(f">>> pixelVal completo:\n{myPixelVal}")
        print(f">>> pixelVal amostra Q1: {myPixelVal[0]}")
        print(f">>> pixelVal amostra Q2: {myPixelVal[1]}")
        print(f">>> pixelVal amostra Q3: {myPixelVal[2]}")
        
        # 7. Análise com dominância
        myIndex = []
        for x in range(self.questions):
            arr = myPixelVal[x]
            marcacoes = np.where(arr > limiar)[0]

            if len(marcacoes) == 0:
                myIndex.append(-1)
            elif len(marcacoes) == 1:
                myIndex.append(int(np.argmax(arr)))
            else:
                sorted_vals = np.sort(arr)[::-1]
                if sorted_vals[0] > sorted_vals[1] * self.dominancia:
                    myIndex.append(int(np.argmax(arr)))
                else:
                    myIndex.append(-2)

        # 8. Avaliação
        grading = [1 if myIndex[x] == self.gabarito[x] else 0 for x in range(self.questions)]
        acertos = sum(grading)

        # 9. Feedback visual
        imgResult = self._desenhar_respostas(imgWarpColored.copy(), myIndex, grading)
        _, buffer = cv2.imencode('.jpg', imgResult)
        return acertos, myIndex, buffer

    def _extrair_bolinhas(self, imgThresh):
        header_height = int(self.height_img * self.header_pct)
        row_height = (self.height_img - header_height) // self.q_per_col
        boxes = []

        for r in range(self.questions):
            y_start = header_height + r * row_height
            y_end = y_start + row_height
            row_img = imgThresh[y_start:y_end, self.numero_width_px:]
            cw = row_img.shape[1] // self.choices
            for ch in range(self.choices):
                box = row_img[:, ch * cw:(ch+1) * cw]
                boxes.append(box)
        return boxes

    def _desenhar_respostas(self, img, myIndex, grading):
        header_height = int(self.height_img * self.header_pct)
        row_height = (self.height_img - header_height) // self.q_per_col
        area_alt = self.width_img - self.numero_width_px
        secW = area_alt // self.choices
        raio = int(secW * 0.35)

        for x in range(self.questions):
            myAns = myIndex[x]
            correta = self.gabarito[x]
            r = x % self.q_per_col
            cY = header_height + r * row_height + row_height // 2
            cX = self.numero_width_px + correta * secW + secW // 2

            if grading[x] == 1:
                cv2.circle(img, (cX, cY), raio, (0, 255, 0), cv2.FILLED)
            else:
                if myAns >= 0:
                    alunoX = self.numero_width_px + myAns * secW + secW // 2
                    cv2.circle(img, (alunoX, cY), raio, (0, 0, 255), cv2.FILLED)
                cv2.circle(img, (cX, cY), raio, (0, 255, 0), cv2.FILLED)

        return img