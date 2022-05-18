import cv2
import threading
import time
import logging
from utils import analyze

logger = logging.getLogger(__name__)

thread = None


class Camera:
    def __init__(self, fps=60, video_source=0):
        logger.info(
            f"Initializing camera class with {fps} fps and video_source={video_source}")
        self.fps = fps
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
        im = analyze(im)
        if _bytes:
            ret, jpeg = cv2.imencode('.jpg', im)
            return jpeg.tobytes()
        else:
            return im
