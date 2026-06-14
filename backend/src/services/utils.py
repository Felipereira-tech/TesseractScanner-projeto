import cv2
import numpy as np

def rectContour(contours):
    """
    Filtra e retorna apenas os contornos que são retângulos (4 lados).
    Removido o isContourConvex para evitar que pequenas dobras no papel ou
    distorções de lente descartem o cartão-resposta legítimo.
    """
    rectCon = []
    for i in contours:
        area = cv2.contourArea(i)

        if area > 500000:
            peri = cv2.arcLength(i, True)
            approx = cv2.approxPolyDP(i, 0.04 * peri, True)

            # Mantemos apenas a checagem de 4 lados (retângulos/quadriláteros)
            if len(approx) == 4:
                rectCon.append(i)

    return sorted(rectCon, key=cv2.contourArea, reverse=True)

def getCornerPoints(cont):
    """
    Extrai os 4 pontos (cantos) do contorno.
    Se a aproximação falhar por um triz devido a ruídos na borda,
    força o retorno dos 4 pontos baseados no bounding box rotacionado.
    """
    peri = cv2.arcLength(cont, True)
    approx = cv2.approxPolyDP(cont, 0.04 * peri, True)
    
    # Se por acaso não retornar 4 pontos aqui, usamos uma estratégia de segurança
    # que pega os 4 cantos geométricos da caixa que envolve o contorno
    if len(approx) != 4:
        rect = cv2.minAreaRect(cont)
        box = cv2.boxPoints(rect)
        approx = np.int32(box).reshape(-1, 1, 2)
        
    return approx

def reorder(myPoints):
    """
    Reordena os pontos para:
    Superior-Esquerdo, Superior-Direito, Inferior-Esquerdo, Inferior-Direito.
    """
    myPoints = myPoints.reshape((4, 2))
    myPointsNew = np.zeros((4, 1, 2), np.int32)
    add = myPoints.sum(1)

    myPointsNew[0] = myPoints[np.argmin(add)]
    myPointsNew[3] = myPoints[np.argmax(add)]
    diff = np.diff(myPoints, axis=1)
    myPointsNew[1] = myPoints[np.argmin(diff)]
    myPointsNew[2] = myPoints[np.argmax(diff)]

    return myPointsNew