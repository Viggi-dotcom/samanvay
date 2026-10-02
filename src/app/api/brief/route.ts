/**
 * GET /api/brief?stateLgd=&schemeId=&fy=
 * Generates a one-click cabinet-ready PDF Executive Brief.
 * Uses ReportLab via Python subprocess (since we have python available).
 * Returns PDF file with Content-Disposition: attachment.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized } from "@/lib/api/session";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

export async function GET(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const url = req.nextUrl;
  const stateLgdParam = url.searchParams.get("stateLgd");
  const schemeIdParam = url.searchParams.get("schemeId");
  const fy = url.searchParams.get("fy") ?? "2025-2026";

  // Build geo scope
  let geoCodes: number[] | null = null;
  if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
    geoCodes = [claims.assignedLgdCode];
  } else if (stateLgdParam) {
    const geos = await db.lgdGeography.findMany({
      where: { stateLgd: Number(stateLgdParam), level: "DISTRICT" },
      select: { lgdCode: true },
    });
    geoCodes = geos.map((g) => g.lgdCode);
  }

  // Aggregate KPIs
  const allocs = await db.allocation.findMany({
    where: {
      financialYear: fy,
      lgdCode: geoCodes ? { in: geoCodes } : undefined,
      schemeId: schemeIdParam || undefined,
    },
    include: { scheme: true, geography: true },
  });
  const allocated = allocs.reduce((s, a) => s + a.allocatedCr, 0);
  const released = allocs.reduce((s, a) => s + a.releasedCr, 0);
  const utilized = allocs.reduce((s, a) => s + a.utilizedCr, 0);
  const utilPct = released > 0 ? (utilized / released) * 100 : 0;

  const bens = await db.beneficiary.findMany({
    where: {
      lgdCode: geoCodes ? { in: geoCodes } : undefined,
      schemeId: schemeIdParam || undefined,
    },
  });
  const totalBen = bens.reduce((s, b) => s + b.beneficiariesTotal, 0);
  const women = bens.reduce((s, b) => s + b.beneficiariesWomen, 0);
  const scSt = bens.reduce((s, b) => s + b.beneficiariesScSt, 0);

  const anomalies = await db.anomaly.findMany({
    where: {
      lgdCode: geoCodes ? { in: geoCodes } : undefined,
      status: "OPEN",
    },
    include: { scheme: true, geography: true },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    take: 10,
  });

  const scope = claims.role === "district_magistrate" && claims.assignedLgdCode
    ? `District LGD ${claims.assignedLgdCode}`
    : stateLgdParam ? `State LGD ${stateLgdParam}` : "Pan-India";

  // Write JSON payload for the Python script
  const scriptsDir = "/home/z/my-project/scripts";
  if (!existsSync(scriptsDir)) await mkdir(scriptsDir, { recursive: true });
  const payloadPath = path.join(scriptsDir, `brief-payload-${Date.now()}.json`);
  const pdfPath = `/home/z/my-project/download/samanvay-executive-brief-${Date.now()}.pdf`;

  const payload = {
    generated_at: new Date().toISOString(),
    generated_by: claims.userId,
    role: claims.role,
    scope,
    fy,
    scheme_filter: schemeIdParam || "All Schemes",
    kpis: { allocated, released, utilized, util_pct: utilPct, beneficiaries: totalBen, women_pct: totalBen > 0 ? (women / totalBen) * 100 : 0, sc_st_pct: totalBen > 0 ? (scSt / totalBen) * 100 : 0 },
    anomalies: anomalies.map((a) => ({
      id: a.id,
      type: a.anomalyType,
      severity: a.severity,
      z_score: a.zScore,
      district: a.geography?.name ?? "",
      state: a.geography?.stateName ?? "",
      scheme: a.scheme?.code ?? "CROSS_SCHEME",
      description: a.description,
      status: a.status,
      created_at: a.createdAt.toISOString(),
    })),
    top_districts: allocs
      .reduce((acc: any[], a) => {
        const existing = acc.find((d) => d.lgdCode === a.lgdCode);
        if (existing) {
          existing.released += a.releasedCr;
          existing.utilized += a.utilizedCr;
          existing.allocated += a.allocatedCr;
        } else {
          acc.push({
            lgdCode: a.lgdCode,
            name: a.geography?.name ?? "",
            state: a.geography?.stateName ?? "",
            released: a.releasedCr,
            utilized: a.utilizedCr,
            allocated: a.allocatedCr,
          });
        }
        return acc;
      }, [])
      .sort((a, b) => a.utilized / Math.max(b.released, 1) - b.utilized / Math.max(b.released, 1))
      .slice(0, 5),
  };

  await writeFile(payloadPath, JSON.stringify(payload, null, 2));

  // Call Python script to generate PDF
  const pythonScript = path.join(scriptsDir, "generate-brief.py");
  const pyContent = `#!/usr/bin/env python3
import json, sys, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

def main():
    payload_path = sys.argv[1]
    pdf_path = sys.argv[2]
    with open(payload_path) as f:
        data = json.load(f)
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title1', parent=styles['Title'], fontSize=22, textColor=colors.HexColor('#0B0F19'), spaceAfter=6, leading=26)
    subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#6B7280'), spaceAfter=20)
    h2_style = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#2563EB'), spaceBefore=14, spaceAfter=6)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=4)
    kpi_value_style = ParagraphStyle('KpiV', parent=styles['Normal'], fontSize=20, textColor=colors.HexColor('#0B0F19'), alignment=TA_CENTER, fontName='Helvetica-Bold')
    kpi_label_style = ParagraphStyle('KpiL', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#6B7280'), alignment=TA_CENTER)
    story = []
    story.append(Paragraph('Samanvay Intelligence', title_style))
    story.append(Paragraph('Executive Brief — Cross-Scheme Governance Convergence Report', subtitle_style))
    meta = f"<b>Scope:</b> {data['scope']} &nbsp;|&nbsp; <b>FY:</b> {data['fy']} &nbsp;|&nbsp; <b>Scheme Filter:</b> {data['scheme_filter']}<br/><b>Generated:</b> {data['generated_at']} &nbsp;|&nbsp; <b>By:</b> {data['role']} ({data['generated_by']})"
    story.append(Paragraph(meta, body_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph('1. Executive Summary', h2_style))
    k = data['kpis']
    summary = f"This report aggregates <b>₹{k['allocated']:.0f} Cr allocated</b>, <b>₹{k['released']:.0f} Cr released</b>, and <b>₹{k['utilized']:.0f} Cr utilized</b> across active schemes. Overall utilization stands at <b>{k['util_pct']:.1f}%</b>. Total beneficiaries served: <b>{k['beneficiaries']:,}</b>, of which <b>{k['women_pct']:.0f}%</b> are women and <b>{k['sc_st_pct']:.0f}%</b> are SC/ST."
    story.append(Paragraph(summary, body_style))
    story.append(Spacer(1, 12))
    kpi_table = Table([
        [Paragraph(f"₹{k['allocated']:.0f} Cr", kpi_value_style), Paragraph(f"₹{k['released']:.0f} Cr", kpi_value_style), Paragraph(f"₹{k['utilized']:.0f} Cr", kpi_value_style), Paragraph(f"{k['util_pct']:.1f}%", kpi_value_style), Paragraph(f"{k['beneficiaries']:,}", kpi_value_style)],
        [Paragraph('Allocated', kpi_label_style), Paragraph('Released', kpi_label_style), Paragraph('Utilized', kpi_label_style), Paragraph('Utilization %', kpi_label_style), Paragraph('Beneficiaries', kpi_label_style)],
    ], colWidths=[3.2*cm]*5)
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F9FAFB')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 14))
    story.append(Paragraph('2. Top Divergent Districts (lowest utilization)', h2_style))
    top_rows = [['District', 'State', 'Allocated (₹ Cr)', 'Released (₹ Cr)', 'Utilization %']]
    for d in data['top_districts'][:5]:
        util = (d['utilized'] / d['released'] * 100) if d['released'] > 0 else 0
        top_rows.append([d['name'], d['state'], f"{d['allocated']:.1f}", f"{d['released']:.1f}", f"{util:.1f}%"])
    top_table = Table(top_rows, colWidths=[3*cm, 3*cm, 3*cm, 3*cm, 3*cm])
    top_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2563EB')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,1), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F9FAFB')]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(top_table)
    story.append(Spacer(1, 14))
    story.append(Paragraph('3. Open Anomalies (top 10)', h2_style))
    if not data['anomalies']:
        story.append(Paragraph('No open anomalies detected.', body_style))
    else:
        anom_rows = [['ID', 'Severity', 'Type', 'District', 'Description']]
        for a in data['anomalies'][:10]:
            desc = a['description'][:80] + '...' if len(a['description']) > 80 else a['description']
            anom_rows.append([a['id'], a['severity'], a['type'].replace('_', ' '), a['district'], desc])
        anom_table = Table(anom_rows, colWidths=[1.8*cm, 1.8*cm, 2.5*cm, 2.5*cm, 7.4*cm])
        anom_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#7F1D1D')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTSIZE', (0,0), (-1,0), 8),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,1), (-1,-1), 7),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#FEF2F2')]),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(anom_table)
    story.append(Spacer(1, 14))
    story.append(Paragraph('4. Recommendations', h2_style))
    recs = []
    if k['util_pct'] < 60:
        recs.append("• Utilization below 60% indicates significant pipeline friction. Recommend nodal ministry escalation within 7 working days.")
    if any(a['severity'] == 'CRITICAL' for a in data['anomalies']):
        recs.append("• CRITICAL anomalies detected. Dispatch Block Development Officer field audits to affected districts within 48 hours.")
    if k['women_pct'] < 35:
        recs.append("• Women beneficiary share below 35%. Recommend targeted outreach through Self-Help Groups (SHGs) in laggard districts.")
    if not recs:
        recs.append("• All metrics within acceptable thresholds. Continue current monitoring cadence.")
    for r in recs:
        story.append(Paragraph(r, body_style))
    story.append(Spacer(1, 14))
    story.append(Paragraph('— End of Executive Brief —', ParagraphStyle('End', parent=body_style, fontSize=8, textColor=colors.HexColor('#9CA3AF'), alignment=TA_CENTER)))
    doc.build(story)
    print(f"PDF written to {pdf_path}")

if __name__ == '__main__':
    main()
`;
  await writeFile(pythonScript, pyContent);

  try {
    await execFileAsync("python3", [pythonScript, payloadPath, pdfPath], { timeout: 30000 });
    const pdfBuffer = await readFile(pdfPath);
    // Cleanup temp files
    await unlink(payloadPath).catch(() => {});
    await unlink(pdfPath).catch(() => {});

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="samanvay-executive-brief-${Date.now()}.pdf"`,
      },
    });
  } catch (err: any) {
    return Response.json(
      { error: "PDF generation failed", reason: err.message },
      { status: 500 }
    );
  }
}
