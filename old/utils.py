import cv2
import numpy as np
import datetime
from keras.models import load_model
from PIL import Image, ImageDraw
model = load_model("./model2-008.model")
face_cascade = cv2.CascadeClassifier("./haarcascade_frontalface_alt2.xml")


labels_dict = {0: 'without mask', 1: 'mask'}
color_dict = {0: (0, 0, 255), 1: (0, 255, 0)}
size = 1


def analyze(im):
    # im = cv2.flip(im, 1, 1)
    mini = cv2.resize(
        im, (im.shape[1] // size, im.shape[0] // size))
    faces = face_cascade.detectMultiScale(mini)
    bottomLeftCornerOfText = (10, im.shape[0]-10)
    fontScale = 0.5
    fontColor = (255, 255, 255)
    lineType = 2
    timeFlag = datetime.datetime.now().isoformat().split("T")
    font = cv2.FONT_HERSHEY_SIMPLEX
    mask_count = 0

    for f in faces:
        (x, y, w, h) = [v * size for v in f]
        face_img = im[y:y+h, x:x+w]
        resized = cv2.resize(face_img, (150, 150))
        normalized = resized/255.0
        reshaped = np.reshape(normalized, (1, 150, 150, 3))
        reshaped = np.vstack([reshaped])
        result = model.predict(reshaped)
        label = np.argmax(result, axis=1)[0]
        if label == 1:
            mask_count += 1
        cv2.rectangle(im, (x, y), (x+w, y+h), color_dict[label], 2)
        cv2.rectangle(im, (x, y-40), (x+w, y), color_dict[label], -1)
        cv2.putText(im, labels_dict[label]+" , "+str(result[0][1]), (x+40, y-10),
                    font, 0.45, (255, 255, 255), 2)
    cv2.putText(im, timeFlag[0] + " " + timeFlag[1].split(".")[0],
                bottomLeftCornerOfText, font, fontScale, fontColor, lineType)
    cv2.putText(im, "Faces: " + str(len(faces)),
                (im.shape[1]-80, im.shape[0]-30), font, fontScale, fontColor, lineType)
    cv2.putText(im, "Masks: " + str(mask_count),
                (im.shape[1]-80, im.shape[0]-10), font, fontScale, fontColor, lineType)
    return im
