import base64
from flask import Flask, request, jsonify
from rapidocr_onnxruntime import RapidOCR

app = Flask(__name__)
engine = RapidOCR()


def boxes_to_text(result):
    items = []
    for box, text, _ in result:
        xs = [p[0] for p in box]
        ys = [p[1] for p in box]
        x_min = min(xs)
        y_min, y_max = min(ys), max(ys)
        y_center = (y_min + y_max) / 2
        height = y_max - y_min
        items.append((y_center, x_min, height, text))

    items.sort(key=lambda i: (i[0], i[1]))

    lines: list[list] = [[items[0]]]
    for item in items[1:]:
        prev = lines[-1][-1]
        # same line if vertical centers are closer than the average box height
        if abs(item[0] - prev[0]) < (item[2] + prev[2]) / 2:
            lines[-1].append(item)
        else:
            lines.append([item])

    return "\n".join(
        " ".join(i[3] for i in sorted(line, key=lambda i: i[1]))
        for line in lines
    )


@app.post("/ocr")
def ocr():
    data = request.get_json()
    img_bytes = base64.b64decode(data["image"])
    result, _ = engine(img_bytes)
    if not result:
        return jsonify({"text": ""})
    return jsonify({"text": boxes_to_text(result)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001)
