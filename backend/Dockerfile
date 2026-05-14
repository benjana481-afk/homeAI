FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++ wget ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Download Hebrew font for PDF generation (best-effort)
RUN mkdir -p /app/fonts && \
    wget -q -O /app/fonts/NotoSansHebrew.ttf \
        "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansHebrew/NotoSansHebrew%5Bwdth%2Cwght%5D.ttf" 2>/dev/null || \
    wget -q -O /app/fonts/NotoSansHebrew.ttf \
        "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansHebrew/NotoSansHebrew-Regular.ttf" 2>/dev/null || \
    echo "Font download failed - PDF will use fallback font"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
