#!/usr/bin/env python3
"""Extract text from all uploaded PDF documents."""

import os
import sys

UPLOAD_DIR = "/home/z/my-project/upload"
OUTPUT_DIR = "/home/z/my-project/scripts/extracted"
os.makedirs(OUTPUT_DIR, exist_ok=True)

try:
    import pdfplumber
except ImportError:
    os.system(f"{sys.executable} -m pip install pdfplumber -q")
    import pdfplumber

pdf_files = sorted([f for f in os.listdir(UPLOAD_DIR) if f.endswith('.pdf')])

for pdf_file in pdf_files:
    pdf_path = os.path.join(UPLOAD_DIR, pdf_file)
    output_path = os.path.join(OUTPUT_DIR, pdf_file.replace('.pdf', '.txt'))
    
    print(f"\n{'='*80}")
    print(f"Extracting: {pdf_file}")
    print(f"{'='*80}")
    
    full_text = []
    with pdfplumber.open(pdf_path) as pdf:
        print(f"  Pages: {len(pdf.pages)}")
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            full_text.append(f"\n--- Page {i+1} ---\n{text}")
    
    combined = "\n".join(full_text)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(combined)
    
    # Print first 2000 chars as preview
    print(combined[:2000])
    print(f"\n... [Full text saved to {output_path}]")
    print(f"... [Total length: {len(combined)} chars]")
