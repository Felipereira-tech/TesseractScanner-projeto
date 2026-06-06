from fastapi import APIRouter, File, UploadFile
from fastapi.responses import HTMLResponse
import cv2
import numpy as np
import base64
import math
import src.services.utils as utils

router = APIRouter()

def img_to_base64(img):
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

@router.post("/debug/scanner", response_class=HTMLResponse)
async def debug_scanner(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    etapas = []

    # ETAPA 1 - Imagem original
    etapas.append(("1. Original", img_to_base64(img)))

    # ETAPA 2 - Grayscale
    imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    etapas.append(("2. Grayscale", img_to_base64(imgGray)))

    # ETAPA 3 - Blur
    imgBlur = cv2.GaussianBlur(imgGray, (5, 5), 1)
    etapas.append(("3. Blur", img_to_base64(imgBlur)))

    # ETAPA 4 - Canny
    imgCanny = cv2.Canny(imgBlur, 10, 50)
    etapas.append(("4. Canny (detecção de bordas)", img_to_base64(imgCanny)))

    # ETAPA 5 - Contornos
    contours, _ = cv2.findContours(imgCanny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    imgContornos = img.copy()
    cv2.drawContours(imgContornos, contours, -1, (0, 255, 0), 2)
    etapas.append(("5. Contornos detectados", img_to_base64(imgContornos)))

    # ETAPA 6 - Maior contorno retangular
    rectCon = utils.rectContour(contours)
    imgRectCon = img.copy()
    if rectCon:
        cv2.drawContours(imgRectCon, [rectCon[0]], -1, (0, 0, 255), 4)
        area = cv2.contourArea(rectCon[0])
        etapas.append((f"6. Maior retângulo (área={int(area)})", img_to_base64(imgRectCon)))

        # ETAPA 7 - Warp
        biggestContour = utils.getCornerPoints(rectCon[0])
        if biggestContour.size == 8:
            biggestContour = utils.reorder(biggestContour)
            pt1 = np.float32(biggestContour)
            pt2 = np.float32([[0,0],[700,0],[0,900],[700,900]])
            matrix = cv2.getPerspectiveTransform(pt1, pt2)
            imgWarp = cv2.warpPerspective(img, matrix, (700, 900))
            etapas.append(("7. Warp (alinhamento)", img_to_base64(imgWarp)))

            # ETAPA 8 - Threshold
            imgWarpGray = cv2.cvtColor(imgWarp, cv2.COLOR_BGR2GRAY)
            imgThresh = cv2.threshold(imgWarpGray, 100, 255, cv2.THRESH_BINARY_INV)[1]
            etapas.append(("8. Threshold (preto=marcado)", img_to_base64(imgThresh)))

            # ETAPA 9 - Grid de divisão
            imgGrid = imgWarp.copy()
            num_cols = math.ceil(50 / 24)
            col_width = 700 // num_cols
            for c in range(num_cols):
                x = c * col_width
                cv2.line(imgGrid, (x, 0), (x, 900), (255, 0, 0), 2)
            row_height = 900 // 24
            for r in range(25):
                y = r * row_height
                cv2.line(imgGrid, (0, y), (700, y), (255, 0, 0), 1)
            etapas.append(("9. Grid de divisão das questões", img_to_base64(imgGrid)))
    else:
        etapas.append(("6. ERRO: nenhum retângulo detectado", img_to_base64(imgContornos)))

    # Monta HTML
    html = """
    <html>
    <head>
        <title>Debug Scanner</title>
        <style>
            body { font-family: Arial; background: #1a1a2e; color: white; padding: 20px; }
            h1 { color: #7C3AED; }
            .etapa { margin-bottom: 40px; }
            .etapa h2 { color: #a78bfa; margin-bottom: 10px; }
            img { max-width: 100%; border: 2px solid #7C3AED; border-radius: 8px; }
        </style>
    </head>
    <body>
        <h1>Debug do Scanner OpenCV</h1>
    """
    for titulo, b64 in etapas:
        html += f"""
        <div class="etapa">
            <h2>{titulo}</h2>
            <img src="data:image/jpeg;base64,{b64}" />
        </div>
        """
    html += "</body></html>"
    return html