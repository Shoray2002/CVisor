from distutils.command.upload import upload
from flask import Flask, flash, render_template, send_from_directory, Response, url_for, redirect, request
# from flask_socketio import SocketIO
from pathlib import Path
from capture import capture_and_save
from camera import Camera
import argparse
import logging
import logging.config
import conf
import os
from werkzeug.utils import secure_filename

logging.config.dictConfig(conf.dictConfig)
logger = logging.getLogger(__name__)
UPLOAD_FOLDER = 'static/uploads/'

camera = Camera()
camera.run()

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
# socketio = SocketIO(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024  # 1 GB


@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering or Chrome Frame,
    and also to cache the rendered page for 10 minutes
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers["Cache-Control"] = "public, max-age=0"
    return r


@app.route("/")
def entrypoint():
    logger.debug("Requested /")
    return render_template("index.html")


@app.route("/capture")
def capture():
    logger.debug("Requested capture")
    im = camera.get_frame(_bytes=False)
    capture_and_save(im)
    return redirect(url_for("entrypoint"))


@app.route("/images/last")
def last_image():
    logger.debug("Requested last image")
    p = Path("images/last.png")
    if p.exists():
        r = "last.png"
    else:
        logger.debug("No last image")
        r = "not_found.jpeg"
    return send_from_directory("images", r)


def gen(camera):
    logger.debug("Starting stream")
    while True:
        frame = camera.get_frame()
        yield (b'--frame\r\n'
               b'Content-Type: image/png\r\n\r\n' + frame + b'\r\n')


@app.route("/stream")
def stream_page():
    logger.debug("Requested stream page")
    return render_template("stream.html")


@app.route("/video_feed")
def video_feed():
    return Response(gen(camera),
                    mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/upload")
def upload_page():
    logger.debug("Requested upload page")
    return render_template("upload.html")


@app.route('/upload', methods=['POST'])
def upload_video():
    if 'file' not in request.files:
        flash('No file part')
        return redirect(request.url)

    file = request.files['file']
    print(file)
    if file.filename == '':
        flash('No image selected for uploading')
        return redirect(request.url)
    else:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        flash('Video successfully uploaded and displayed below')
        return render_template('upload.html', filename=filename)


@app.route('/display/<filename>')
def display_video(filename):
    #print('display_video filename: ' + filename)
    return redirect(url_for('static', filename='uploads/' + filename), code=301)


if __name__ == "__main__":
    # socketio.run(app,host="0.0.0.0",port="3005",threaded=True)
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port', type=int,
                        default=5000, help="Running port")
    parser.add_argument("-H", "--host", type=str,
                        default='0.0.0.0', help="Address to broadcast")
    args = parser.parse_args()
    logger.debug("Starting server")
    app.run(host=args.host, port=args.port)
