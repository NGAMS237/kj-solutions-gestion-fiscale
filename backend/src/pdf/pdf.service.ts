import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { SettingsService } from '../settings/settings.service';

interface InvoiceForPdf {
  number: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  client: {
    name: string;
    address?: string | null; city?: string | null; province?: string | null; postalCode?: string | null;
    email?: string | null; phone?: string | null;
  };
  items: { description: string; quantity: any; unitPrice: any; lineTotal: any; taxStatus: string }[];
  subtotal: any; taxableBase: any; exemptBase: any; tpsAmount: any; tvqAmount: any; total: any;
  amountPaid: any; amountDue: any;
  tpsRate: any; tvqRate: any;
  notes?: string | null;
  termsText?: string | null;
}

@Injectable()
export class PdfService {
  // Palette épurée — teal sobre, gris doux
  private readonly ACCENT = '#0f766e';
  private readonly DARK   = '#0b1220';
  private readonly TEXT   = '#1f2937';
  private readonly MUTED  = '#6b7280';
  private readonly LINE   = '#e5e7eb';
  private readonly SOFT   = '#f9fafb';

  constructor(private settings: SettingsService) {}

  async streamInvoice(invoice: InvoiceForPdf, res: Response): Promise<void> {
    const s = await this.settings.get();
    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
    doc.pipe(res);

    const money = (v: any) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(v));
    const date = (d: Date) => new Date(d).toLocaleDateString('fr-CA');
    const taxLabel = (t: string) => t === 'EXEMPT' ? 'Exonéré' : t === 'ZERO_RATED' ? '0 %' : 'Taxable';
    const statusFR: Record<string, string> = { DRAFT:'Brouillon', SENT:'Envoyée', PAID:'Payée', OVERDUE:'En retard', CANCELLED:'Annulée' };

    const pageW = doc.page.width;
    const margin = 50;
    const contentW = pageW - margin * 2;

    // ---- ENTÊTE — Nom à gauche, "FACTURE" à droite ----
    let y = margin;

    // Logo / nom entreprise
    doc.fillColor(this.DARK).font('Helvetica-Bold').fontSize(16);
    doc.text((s.companyName || '').toUpperCase(), margin, y, { characterSpacing: 1.2 });
    y += 22;
    doc.fillColor(this.MUTED).font('Helvetica').fontSize(9);
    if (s.address) { doc.text(s.address, margin, y); y += 12; }
    const cityLine = [s.city, s.province, s.postalCode].filter(Boolean).join(' ');
    if (cityLine) { doc.text(cityLine, margin, y); y += 12; }
    if (s.phone) { doc.text(s.phone, margin, y); y += 12; }
    if (s.email) { doc.text(s.email, margin, y); y += 12; }

    // Bloc droite — titre "FACTURE" + numéro
    const rightX = margin + 320;
    let yRight = margin;
    doc.fillColor(this.DARK).font('Helvetica').fontSize(26);
    doc.text('FACTURE', rightX, yRight, { width: contentW - 320, align: 'right', characterSpacing: 3 });
    yRight += 36;

    // Accent line sous le titre
    doc.rect(pageW - margin - 60, yRight, 60, 2).fill(this.ACCENT);
    yRight += 14;

    // Numéro de facture
    doc.fillColor(this.DARK).font('Courier-Bold').fontSize(13);
    doc.text(invoice.number, rightX, yRight, { width: contentW - 320, align: 'right' });
    yRight += 22;

    // Badge statut
    const statusLabel = statusFR[invoice.status] || invoice.status;
    const statusBg: Record<string, string> = { DRAFT:'#f3f4f6', SENT:'#ecfeff', PAID:'#ecfdf5', OVERDUE:'#fef2f2' };
    const statusFg: Record<string, string> = { DRAFT:'#6b7280', SENT:'#0e7490', PAID:'#047857', OVERDUE:'#dc2626' };
    const sBg = statusBg[invoice.status] || '#f3f4f6';
    const sFg = statusFg[invoice.status] || this.MUTED;
    const labelW = doc.font('Helvetica-Bold').fontSize(8).widthOfString(statusLabel.toUpperCase()) + 20;
    const labelX = pageW - margin - labelW;
    doc.roundedRect(labelX, yRight, labelW, 16, 8).fill(sBg);
    doc.fillColor(sFg).font('Helvetica-Bold').fontSize(8);
    doc.text(statusLabel.toUpperCase(), labelX, yRight + 4, { width: labelW, align: 'center', characterSpacing: 1 });

    y = Math.max(y, yRight + 30) + 30;

    // ---- BLOC INFOS — Client à gauche, méta à droite ----
    const tag = (txt: string, x: number, y: number, w: number) => {
      doc.fillColor(this.MUTED).font('Helvetica-Bold').fontSize(8);
      doc.text(txt.toUpperCase(), x, y, { width: w, characterSpacing: 1.5 });
    };

    tag('Facturer à', margin, y, 250);
    doc.fillColor(this.DARK).font('Helvetica-Bold').fontSize(12);
    doc.text(invoice.client.name, margin, y + 14, { width: 250 });
    let yClient = y + 30;
    doc.fillColor(this.MUTED).font('Helvetica').fontSize(9);
    if (invoice.client.address) { doc.text(invoice.client.address, margin, yClient, { width: 250 }); yClient += 12; }
    const clientCity = [invoice.client.city, invoice.client.province, invoice.client.postalCode].filter(Boolean).join(' ');
    if (clientCity) { doc.text(clientCity, margin, yClient, { width: 250 }); yClient += 12; }
    if (invoice.client.email) { doc.text(invoice.client.email, margin, yClient, { width: 250 }); yClient += 12; }
    if (invoice.client.phone) { doc.text(invoice.client.phone, margin, yClient, { width: 250 }); yClient += 12; }

    // Méta à droite (table key/value)
    const metaX = rightX;
    let yMeta = y;
    const metaRow = (label: string, value: string, opts?: { mono?: boolean; bold?: boolean }) => {
      doc.fillColor(this.MUTED).font('Helvetica-Bold').fontSize(8);
      doc.text(label.toUpperCase(), metaX, yMeta, { width: 100, characterSpacing: 1.2 });
      doc.fillColor(this.DARK).font(opts?.mono ? 'Courier' : (opts?.bold ? 'Helvetica-Bold' : 'Helvetica')).fontSize(opts?.mono ? 9 : 10);
      doc.text(value, metaX + 100, yMeta - 1, { width: contentW - 320 - 100, align: 'right' });
      yMeta += 16;
    };
    metaRow('Émise le', date(invoice.issueDate));
    metaRow('Échéance', date(invoice.dueDate), { bold: true });
    if (s.tpsNumber) metaRow('N° TPS', s.tpsNumber, { mono: true });
    if (s.tvqNumber) metaRow('N° TVQ', s.tvqNumber, { mono: true });

    y = Math.max(yClient, yMeta) + 24;

    // ---- TABLEAU DES LIGNES ----
    const colX = { desc: margin, qty: margin + 290, price: margin + 350, tax: margin + 420, total: margin + 490 };

    // Header
    doc.fillColor(this.MUTED).font('He