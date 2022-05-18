import cv2
import threading
import time
import logging
import numpy as np
import datetime
from keras.models import load_model
model = load_model("./model2-008.model")


logger = logging.getLogger(__name__)


face_cascade = cv2.CascadeClassifier("./haarcascade_frontalface_alt2.xml")


labels_dict = {0: 'without mask', 1: 'mask'}
color_dict = {0: (0, 0, 255), 1: (0, 255, 0)}
thread = None


class Camera:
    def __init__(self, fps=60, video_source=0):
        logger.info(
            f"Initializing camera class with {fps} fps and video_source={video_source}")
        self.fps = fps
        self.size = 1
        self.video_source = video_source
        self.camera = cv2.VideoCapture(self.video_source)
        self.max_frames = 5*self.fps
        self.frames = []
        self.isrunning = False

    def run(self):
        logging.debug("Perparing thread")
        global thread
        if thread is None:
            logging.debug("Creating thread")
            thread = threading.Thread(target=self._capture_loop, daemon=True)
            logger.debug("Starting thread")
            self.isrunning = True
            thread.start()
            logger.info("Thread started")

    def _capture_loop(self):
        dt = 1/self.fps
        logger.debug("Observation started")
        while self.isrunning:
            v, im = self.camera.read()
            if v:
                if len(self.frames) == self.max_frames:
                    self.frames = self.frames[1:]
                self.frames.append(im)
            time.sleep(dt)
        logger.info("Thread stopped successfully")

    def stop(self):
        logger.debug("Stopping thread")
        self.isrunning = False
        

    def get_frame(self, _bytes=True):
        if len(self.frames) == 0:
            return None
        im = self.frames[-1]
        im = cv2.flip(im, 1, 1)
        mini = cv2.resize(
            im, (im.shape[1] // self.size, im.shape[0] // self.size))
        faces = face_cascade.detectMultiScale(mini)
        gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        font = cv2.FONT_HERSHEY_SIMPLEX
        # bottomLeftCornerOfText = (10, im.shape[0]-10)
        # fontScale = 1
        # fontColor = (255, 255, 255)
        # lineType = 2
        # cv2.putText(im, datetime.datetime.now().isoformat().split(".")[
        #     0], bottomLeftCornerOfText, font, fontScale, fontColor, lineType)
        for f in faces:
            (x, y, w, h) = [v * self.size for v in f]
            face_img = im[y:y+h, x:x+w]
            resized = cv2.resize(face_img, (150, 150))
            normalized = resized/255.0
            reshaped = np.reshape(normalized, (1, 150, 150, 3))
            reshaped = np.vstack([reshaped])
            result = model.predict(reshaped)
            label = np.argmax(result, axis=1)[0]
            cv2.rectangle(im, (x, y), (x+w, y+h), color_dict[label], 2)
            cv2.rectangle(im, (x, y-40), (x+w, y), color_dict[label], -1)
            cv2.putText(im, labels_dict[label], (x, y-10),
                        font, 0.45, (255, 255, 255), 2)
        if _bytes:
            ret, jpeg = cv2.imencode('.jpg', im)
            return jpeg.tobytes()
        else:
            return im
