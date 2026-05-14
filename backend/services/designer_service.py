"""AI generation and PDF creation for the designer studio."""
import base64
import io
import json
import os
from datetime import date
from pathlib import Path

from openai import AsyncOpenAI
from PIL import Image

from services.storage_service import UPLOADS_DIR, save_redesign_bytes

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

FONT_PATH = Path("/app/fonts/NotoSansHebrew.ttf")


def to_jpeg_base64(raw: bytes) -> str:
    """Convert any image format (including HEIC) to JPEG base64."""
    try:
        import pillow_heif
        pillow_heif.register_heif_opener()
    except ImportError:
        pass
    img = Image.open(io.BytesIO(raw))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


async def generate_designer_sketch(
    image_base64: str,
    room_type: str,
    notes: str,
) -> tuple[str, str]:
    """Analyze room dimensions/shape and generate a sketch.
    Returns (analysis_hebrew, sketch_path).
    """
    analysis_prompt = f"""You are an expert interior designer and spatial analyst.

Analyze this {room_type} photo carefully.

Designer's notes for this client:
{notes if notes else "No specific notes."}

Return a JSON object with exactly these fields:
{{
  "room_analysis": "תיאור בעברית של החדר: מידות משוערות, צורה, תאורה טבעית, מרכיבים קיימים (3-4 משפטים)",
  "estimated_width_m": 4.5,
  "estimated_depth_m": 6.0,
  "estimated_height_m": 2.7,
  "room_shape": "rectangular",
  "light_quality": "good natural light from south-facing windows",
  "design_prompt": "Detailed English prompt for the redesign based on the designer notes. Describe specific materials, colors, furniture placement, and lighting fixtures to create."
}}

Return only valid JSON, no markdown."""

    vision_resp = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": analysis_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}",
                            "detail": "high",
                        },
                    },
                ],
            }
        ],
        max_tokens=700,
        response_format={"type": "json_object"},
    )

    data = json.loads(vision_resp.choices[0].message.content)
    analysis_he = data.get("room_analysis", "")
    design_prompt = data.get("design_prompt", notes or "redesign the room beautifully")
    w = data.get("estimated_width_m", "?")
    d = data.get("estimated_depth_m", "?")
    h = data.get("estimated_height_m", "?")
    shape = data.get("room_shape", "")
    light = data.get("light_quality", "")

    full_analysis = (
        f"{analysis_he}\n\n"
        f"מידות משוערות: {w}מ' רוחב x {d}מ' עומק x {h}מ' גובה | "
        f"צורה: {shape} | תאורה: {light}"
    )

    sketch_prompt = (
        f"Interior design visualization for a {room_type}. "
        f"{design_prompt} "
        "Keep the exact same room structure, walls, windows, doorways, and ceiling. "
        "Only change furniture, colors, materials, lighting fixtures, and decor. "
        "Photorealistic interior photography, professional lighting, no people, no text, no watermarks."
    )

    image_resp = await client.images.edit(
        model="gpt-image-1",
        image=("room.jpg", base64.b64decode(image_base64), "image/jpeg"),
        prompt=sketch_prompt[:4000],
        size="1024x1024",
        n=1,
    )

    sketch_bytes = base64.b64decode(image_resp.data[0].b64_json)
    sketch_path = save_redesign_bytes(sketch_bytes)

    return full_analysis, sketch_path


def generate_pdf(
    client_name: str,
    room_type: str,
    notes: str,
    sketches: list[dict],
) -> bytes:
    """Generate a PDF with approved sketches. Returns PDF bytes."""
    from fpdf import FPDF
    try:
        from bidi.algorithm import get_display
        def rtl(text: str) -> str:
            return get_display(text) if text else ""
    except ImportError:
        def rtl(text: str) -> str:
            return text or ""

    class PDF(FPDF):
        def footer(self):
            self.set_y(-12)
            self.set_font(fn, size=8)
            self.set_text_color(160, 160, 160)
            self.cell(0, 6, str(self.page_no()), align="C")

    pdf = PDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)

    if FONT_PATH.exists():
        pdf.add_font("Hebrew", "", str(FONT_PATH))
        fn = "Hebrew"
    else:
        fn = "Helvetica"

    margin = 18
    cw = 210 - 2 * margin

    # ---- Cover page ----
    pdf.add_page()
    pdf.set_fill_color(245, 241, 235)
    pdf.rect(0, 0, 210, 297, "F")

    # Decorative top bar
    pdf.set_fill_color(180, 150, 110)
    pdf.rect(0, 0, 210, 8, "F")

    pdf.set_y(70)
    pdf.set_font(fn, size=30)
    pdf.set_text_color(60, 45, 30)
    pdf.cell(0, 14, rtl(client_name), align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font(fn, size=16)
    pdf.set_text_color(120, 90, 60)
    pdf.cell(0, 10, rtl(room_type), align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(4)
    pdf.set_font(fn, size=11)
    pdf.set_text_color(160, 140, 120)
    pdf.cell(0, 8, date.today().strftime("%d / %m / %Y"), align="C", new_x="LMARGIN", new_y="NEXT")

    if notes:
        pdf.ln(20)
        pdf.set_draw_color(200, 180, 150)
        pdf.set_line_width(0.3)
        pdf.line(margin + 20, pdf.get_y(), 210 - margin - 20, pdf.get_y())
        pdf.ln(8)
        pdf.set_font(fn, size=11)
        pdf.set_text_color(80, 60, 40)
        pdf.set_x(margin)
        pdf.multi_cell(cw, 7, rtl(f"דגשים: {notes}"), align="R")

    approved_count = len(sketches)
    pdf.ln(15)
    pdf.set_font(fn, size=10)
    pdf.set_text_color(140, 120, 100)
    pdf.cell(0, 8, rtl(f"{approved_count} סקיצות מאושרות"), align="C", new_x="LMARGIN", new_y="NEXT")

    # Bottom bar
    pdf.set_fill_color(180, 150, 110)
    pdf.rect(0, 289, 210, 8, "F")

    # ---- One page per approved sketch ----
    for i, sketch in enumerate(sketches, 1):
        pdf.add_page()
        pdf.set_fill_color(255, 255, 255)
        pdf.rect(0, 0, 210, 297, "F")

        # Top accent
        pdf.set_fill_color(180, 150, 110)
        pdf.rect(0, 0, 210, 4, "F")

        # Sketch number header
        pdf.set_y(10)
        pdf.set_font(fn, size=13)
        pdf.set_text_color(100, 80, 60)
        pdf.cell(0, 8, rtl(f"סקיצה #{i}  |  {client_name}"), align="R", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

        # Image
        img_path = UPLOADS_DIR / sketch["image_path"]
        if img_path.exists():
            pdf.image(str(img_path), x=margin, w=cw)
        pdf.ln(6)

        # Per-sketch notes
        if sketch.get("notes"):
            pdf.set_font(fn, size=10)
            pdf.set_text_color(60, 60, 60)
            pdf.set_x(margin)
            pdf.multi_cell(cw, 6, rtl(f"דגשים: {sketch['notes']}"), align="R")
            pdf.ln(3)

        # Room analysis
        if sketch.get("analysis"):
            pdf.set_draw_color(220, 210, 195)
            pdf.set_line_width(0.2)
            pdf.line(margin, pdf.get_y(), 210 - margin, pdf.get_y())
            pdf.ln(3)
            pdf.set_font(fn, size=9)
            pdf.set_text_color(120, 110, 100)
            pdf.set_x(margin)
            pdf.multi_cell(cw, 5, rtl(sketch["analysis"]), align="R")

    return bytes(pdf.output())
