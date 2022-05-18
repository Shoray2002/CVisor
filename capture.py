import cv2
import datetime
import time
from pathlib import Path


def capture_and_save(im):
    s = im.shape
    # Add a timestamp
    # use source code font
    font = cv2.FONT_HERSHEY_COMPLEX_SMALL
    bottomLeftCornerOfText = (10, s[0]-10)
    fontScale = 1
    fontColor = (255, 0, 0)
    lineType = 1
    cv2.putText(im, datetime.datetime.now().isoformat().split(".")[
                0], bottomLeftCornerOfText, font, fontScale, fontColor, lineType)

    m = 0
    p = Path("images")
    for img in p.iterdir():
        if img.suffix == ".png" and img.stem != "last":
            num = img.stem.split("_")[1]
            try:
                num = int(num)
                if num > m:
                    m = num
            except:
                print("Error reading image number for", str(img))
    m += 1
    lp = Path("images/last.png")
    if lp.exists() and lp.is_file():
        np = Path("images/img_{}.png".format(m))
        np.write_bytes(lp.read_bytes())
    cv2.imwrite("images/last.png", im)


if __name__ == "__main__":
    capture_and_save()
    print("done")
