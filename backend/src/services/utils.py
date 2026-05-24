#utils.py

import cv2
import numpy as np

def rectContour(contours):
    """ Filtra e retorna apenas os contornos que são retângulos (4 lados). """
    rectCon = []
    for i in contours:
        area = cv2.contourArea(i)
        if area > 5000:
            peri = cv2.arcLength(i, True)
            approx = cv2.approxPolyDP(i, 0.02 * peri, True)
            if len(approx) == 4:
                rectCon.append(i)
    return sorted(rectCon, key=cv2.contourArea, reverse=True)

def getCornerPoints(cont):
    """ Extrai os 4 pontos (cantos) do contorno. """
    peri = cv2.arcLength(cont, True)
    approx = cv2.approxPolyDP(cont, 0.02 * peri, True)
    return approx

def reorder(myPoints):
    """ Reordena os pontos para: Superior-Esquerdo, Superior-Direito, Inferior-Esquerdo, Inferior-Direito. """
    myPoints = myPoints.reshape((4, 2))
    myPointsNew = np.zeros((4, 1, 2), np.int32)
    add = myPoints.sum(1)
    
    myPointsNew[0] = myPoints[np.argmin(add)]
    myPointsNew[3] = myPoints[np.argmax(add)]
    diff = np.diff(myPoints, axis=1)
    myPointsNew[1] = myPoints[np.argmin(diff)]
    myPointsNew[2] = myPoints[np.argmax(diff)]
    
    return myPointsNew