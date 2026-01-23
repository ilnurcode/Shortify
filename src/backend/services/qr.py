import io
import segno


def create_qr_code(link: str):
    qr = segno.make(link)
    buffer = io.BytesIO()
    qr.save(buffer, kind="svg")
    buffer.seek(0)
    return buffer.read()