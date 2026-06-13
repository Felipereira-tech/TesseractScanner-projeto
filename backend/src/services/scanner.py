#   NÃO
#   MEXER
#   EM
#   NADA
#   NESTA
#   PORRA
#   !!!!!

import cv2
import numpy as np
import src.services.utils as utils


class CartaoScanner:
    def __init__(self, total_questoes, gabarito, alternativas=5):
        self.questions = total_questoes
        self.gabarito = gabarito
        self.choices = alternativas
        self.width_img = 700
        self.height_img = 900
        self.min_area = 1000000
        self.header_pct = 0.04
        self.numero_width_px = 117
        self.limiar_pct = 0.15
        self.dominancia = 1.10

    def processar(self, img_bytes):
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Imagem corrompida ou formato inválido.")

        cv2.imwrite("debug_01_original.jpg", img)

        # 1. Preparação
        imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        imgBlur = cv2.GaussianBlur(imgGray, (5, 5), 1.2)
        
        # O Canny calibrado
        imgCanny = cv2.Canny(imgBlur, 39, 40)
        cv2.imwrite("debug_04_canny.jpg", imgCanny)
        
        # Enviamos o Canny direto para a dilatação (pulando o filtro que apagava tudo)
        kernel = np.ones((5, 5), np.uint8)
        imgDilated = cv2.dilate(imgCanny, kernel, iterations=3)

        # 2. Detecção do contorno
        contours, _ = cv2.findContours(imgDilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        rectCon = utils.rectContour(contours)

        print(f">>> contornos: {len(contours)} | retângulos: {len(rectCon)}")
        if rectCon:
            print(f">>> maior área: {int(cv2.contourArea(rectCon[0]))}")

        if len(rectCon) == 0 or cv2.contourArea(rectCon[0]) < self.min_area:
            raise ValueError("Cartão-resposta não detectado com clareza. Ajuste a iluminação e tente novamente.")

        # === NOVO: Lógica para desenhar e salvar os contornos encontrados ===
        imgContours = img.copy()
        # Desenha TODOS os contornos detectados em Azul (espessura 2)
        cv2.drawContours(imgContours, contours, -1, (255, 0, 0), 2)
        # Destaca o maior contorno retangular em Verde (espessura 4)
        cv2.drawContours(imgContours, [rectCon[0]], -1, (0, 255, 0), 4)
        cv2.imwrite("debug_05_contornos.jpg", imgContours)
        # ===================================================================

        biggestContour = utils.getCornerPoints(rectCon[0])
        if biggestContour.size != 8:
            raise ValueError("Os 4 cantos da folha não foram detectados perfeitamente.")

        # 3. Warp
        biggestContour = utils.reorder(biggestContour)
        pt1 = np.float32(biggestContour)
        pt2 = np.float32([
            [0, 0],
            [self.width_img, 0],
            [0, self.height_img],
            [self.width_img, self.height_img]
        ])
        matrix = cv2.getPerspectiveTransform(pt1, pt2)
        imgWarpColored = cv2.warpPerspective(img, matrix, (self.width_img, self.height_img))
        cv2.imwrite("debug_06_warp.jpg", imgWarpColored)

        # 4. Threshold fixo — converte marcações escuras em branco
        imgWarpGray = cv2.cvtColor(imgWarpColored, cv2.COLOR_BGR2GRAY)
        imgThresh = cv2.threshold(imgWarpGray, 100, 255, cv2.THRESH_BINARY_INV)[1]
        cv2.imwrite("debug_07_thresh.jpg", imgThresh)

        # 5. Extração das células
        boxes = self._extrair_bolinhas(imgThresh)

        # Grid visual de debug
        self._salvar_grid_debug(imgWarpColored)

        if len(boxes) != self.questions * self.choices:
            raise ValueError(
                f"Falha no mapeamento. Esperado {self.questions * self.choices} "
                f"bolinhas, encontrou {len(boxes)}."
            )

        # 6. Contagem de pixels por célula
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
        print(f">>> area_bolinha={area_bolinha} | limiar={limiar}")
        print(f">>> pixelVal:\n{myPixelVal}")

        # 7. Análise de marcação com dominância
        myIndex = []
        for x in range(self.questions):
            arr = myPixelVal[x]
            marcacoes = np.where(arr > limiar)[0]

            if len(marcacoes) == 0:
                myIndex.append(-1)  # Branco
            elif len(marcacoes) == 1:
                myIndex.append(int(np.argmax(arr)))
            else:
                sorted_vals = np.sort(arr)[::-1]
                if sorted_vals[0] > sorted_vals[1] * self.dominancia:
                    myIndex.append(int(np.argmax(arr)))  # Dominância clara
                else:
                    myIndex.append(-2)  # Rasura

        print(f">>> respostas lidas: {myIndex}")

        # 8. Avaliação
        grading = [
            1 if myIndex[x] == self.gabarito[x] else 0
            for x in range(self.questions)
        ]
        acertos = sum(grading)

        # 9. Feedback visual
        imgResult = self._desenhar_respostas(imgWarpColored.copy(), myIndex, grading)
        cv2.imwrite("debug_09_resultado.jpg", imgResult)
        print(f">>> acertos={acertos}/{self.questions}")

        _, buffer = cv2.imencode('.jpg', imgResult)
        return acertos, myIndex, buffer

    def _extrair_bolinhas(self, imgThresh):
        header_height = int(self.height_img * self.header_pct)
        row_height = (self.height_img - header_height) // self.questions
        boxes = []

        for r in range(self.questions):
            y_start = header_height + r * row_height
            y_end = y_start + row_height
            row_img = imgThresh[y_start:y_end, self.numero_width_px:]
            cw = row_img.shape[1] // self.choices
            for ch in range(self.choices):
                box = row_img[:, ch * cw:(ch + 1) * cw]
                boxes.append(box)
        return boxes

    def _desenhar_respostas(self, img, myIndex, grading):
        header_height = int(self.height_img * self.header_pct)
        row_height = (self.height_img - header_height) // self.questions
        area_alt = self.width_img - self.numero_width_px
        secW = area_alt // self.choices
        rx = int(secW * 0.32)
        ry = int(row_height * 0.35)

        for x in range(self.questions):
            myAns = myIndex[x]

            if myAns < 0:
                continue

            cY = header_height + x * row_height + row_height // 2

            if grading[x] == 1:
                cX = self.numero_width_px + myAns * secW + secW // 2
                cv2.ellipse(img, (cX, cY), (rx, ry), 0, 0, 360, (0, 255, 0), cv2.FILLED)
            else:
                alunoX = self.numero_width_px + myAns * secW + secW // 2
                cv2.ellipse(img, (alunoX, cY), (rx, ry), 0, 0, 360, (0, 0, 255), cv2.FILLED)

        return img

    def _salvar_grid_debug(self, imgWarpColored):
        imgGrid = imgWarpColored.copy()
        header_height = int(self.height_img * self.header_pct)
        row_height = (self.height_img - header_height) // self.questions
        choice_width = (self.width_img - self.numero_width_px) // self.choices

        cv2.line(imgGrid, (0, header_height), (self.width_img, header_height), (0, 255, 255), 2)
        cv2.line(imgGrid, (self.numero_width_px, 0), (self.numero_width_px, self.height_img), (0, 165, 255), 2)

        for r in range(self.questions + 1):
            y = header_height + r * row_height
            cv2.line(imgGrid, (0, y), (self.width_img, y), (255, 0, 0), 1)

        for ch in range(self.choices + 1):
            x = self.numero_width_px + ch * choice_width
            cv2.line(imgGrid, (x, header_height), (x, self.height_img), (0, 255, 0), 1)

        cv2.imwrite("debug_08_grid.jpg", imgGrid)