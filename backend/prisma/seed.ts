/**
 * Seed de démonstration — Gestion Fiscale
 * Crée : settings, activités, catégories de dépenses, 3 clients, 2 factures, 3 dépenses.
 */
import { PrismaClient } from '@prisma/client';
// Enums portables (Postgres native enums OU SQLite String) — voir src/common/enums.ts
const TaxStatus = { TAXABLE: 'TAXABLE', EXEMPT: 'EXEMPT', ZERO_RATED: 'ZERO_RATED' } as const;
const ClientType = { PARTICULIER: 'PARTICULIER', ENTREPRISE: 'ENTREPRISE', GARDERIE: 'GARDERIE' } as const;
const InvoiceStatus = {
  DRAFT: 'DRAFT', SENT: 'SENT', PAID: 'PAID', OVERDUE: 'OVERDUE', CANCELLED: 'CANCELLED',
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seed démarré...');

  // -- Settings (entreprise)
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyName: process.env.COMPANY_NAME ?? 'KJ SOLUTIONS',
      address: process.env.COMPANY_ADDRESS ?? '1805 rue de Grandville',
      city: 'Québec',
      province: 'QC',
      phone: process.env.COMPANY_PHONE ?? '438-870-4777',
      email: process.env.COMPANY_EMAIL ?? 'nganbou76@gmail.com',
      neq: process.env.COMPANY_NEQ ?? '',
      tpsNumber: process.env.COMPANY_TPS ?? '74551 1428 RT0001',
      tvqNumber: process.env.COMPANY_TVQ ?? '4048614006 TQ0001',
      invoicePrefix: 'KJ',
    },
  });

  // -- Utilisateur unique (préparation auth future)
  await prisma.user.upsert({
    where: { email: 'nganbou76@gmail.com' },
    update: {},
    create: {
      email: 'nganbou76@gmail.com',
      name: 'Blaise Nganbou',
      role: 'ADMIN',
    },
  });

  // -- Activités
  const activities = [
    { code: 'UBER', name: 'Uber / Taxi', taxStatus: TaxStatus.TAXABLE, color: '#000000' },
    { code: 'GARDERIE', name: 'Assistance garderie', taxStatus: TaxStatus.EXEMPT, color: '#f59e0b' },
    { code: 'MENAGE', name: 'Entretien ménager', taxStatus: TaxStatus.TAXABLE, color: '#10b981' },
    { code: 'INFO', name: 'Services informatiques / réseau', taxStatus: TaxStatus.TAXABLE, color: '#6366f1' },
  ];
  for (const a of activities) {
    await prisma.activity.upsert({
      where: { code: a.code },
      update: {},
      create: a,
    });
  }

  // -- Catégories de dépenses
  const categories = [
    { code: 'ESSENCE', name: 'Essence', reclaimGST: true, reclaimQST: true },
    { code: 'ENTRETIEN_VEH', name: 'Entretien véhicule', reclaimGST: true, reclaimQST: true },
    { code: 'PRODUITS_MENAGE', name: 'Produits ménagers', reclaimGST: true, reclaimQST: true },
    { code: 'INTERNET', name: 'Internet', reclaimGST: true, reclaimQST: true },
    { code: 'TELEPHONE', name: 'Téléphone', reclaimGST: true, reclaimQST: true },
    { code: 'EQUIP_INFO', name: 'Équipement informatique', reclaimGST: true, reclaimQST: true },
    { code: 'ASSURANCES', name: 'Assurances', reclaimGST: false, reclaimQST: false },
    { code: 'PUBLICITE', name: 'Publicité', reclaimGST: true, reclaimQST: true },
    { code: 'FOURN_GARDERIE', name: 'Fournitures garderie', reclaimGST: false, reclaimQST: false },
    { code: 'AUTRE', name: 'Autre', reclaimGST: true, reclaimQST: true },
  ];
  for (const c of categories) {
    await prisma.expenseCategory.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // -- Clients
  const garderie = await prisma.client.upsert({
    where: { id: 'seed-client-garderie' },
    update: {},
    create: {
      id: 'seed-client-garderie',
      name: 'Garderie Les Petits Soleils',
      type: ClientType.GARDERIE,
      email: 'admin@petitssoleils.qc.ca',
      phone: '514-555-1010',
      city: 'Montréal',
      province: 'QC',
    },
  });

  const particulier = await prisma.client.upsert({
    where: { id: 'seed-client-tremblay' },
    update: {},
    create: {
      id: 'seed-client-tremblay',
      name: 'Marie Tremblay',
      type: ClientType.PARTICULIER,
      email: 'marie.tremblay@example.qc.ca',
      phone: '514-555-2020',
      city: 'Laval',
      province: 'QC',
    },
  });

  await prisma.client.upsert({
    where: { id: 'seed-client-tech' },
    update: {},
    create: {
      id: 'seed-client-tech',
      name: 'Boutique Informatique Plus inc.',
      type: ClientType.ENTREPRISE,
      email: 'comptes@infoplus.ca',
      phone: '450-555-3030',
      city: 'Longueuil',
      province: 'QC',
    },
  });

  // -- Facture exemple (ménage — taxable)
  const menage = await prisma.activity.findUnique({ where: { code: 'MENAGE' } });
  await prisma.invoice.upsert({
    where: { number: 'KJ-2026-0001' },
    update: {},
    create: {
      number: 'KJ-2026-0001',
      status: InvoiceStatus.SENT,
      clientId: particulier.id,
      issueDate: new Date('2026-04-15'),
      dueDate: new Date('2026-05-15'),
      subtotal: 200,
      taxableBase: 200,
      exemptBase: 0,
      tpsAmount: 10,
      tvqAmount: 19.95,
      total: 229.95,
      amountDue: 229.95,
      items: {
        create: [
          {
            description: 'Entretien ménager résidentiel — 5h',
            quantity: 5,
            unitPrice: 40,
            taxStatus: TaxStatus.TAXABLE,
            lineTotal: 200,
            activityId: menage?.id,
            order: 1,
          },
        ],
      },
    },
  });

  // -- Facture exemple (garderie — exonérée)
  const acGarderie = await prisma.activity.findUnique({ where: { code: 'GARDERIE' } });
  await prisma.invoice.upsert({
    where: { number: 'KJ-2026-0002' },
    update: {},
    create: {
      number: 'KJ-2026-0002',
      status: InvoiceStatus.PAID,
      clientId: garderie.id,
      issueDate: new Date('2026-04-30'),
      dueDate: new Date('2026-05-14'),
      subtotal: 800,
      taxableBase: 0,
      exemptBase: 800,
      tpsAmount: 0,
      tvqAmount: 0,
      total: 800,
      amountPaid: 800,
      amountDue: 0,
      paidAt: new Date('2026-05-02'),
      items: {
        create: [
          {
            description: 'Assistance en garderie — bimensuel (40h)',
            quantity: 40,
            unitPrice: 20,
            taxStatus: TaxStatus.EXEMPT,
            lineTotal: 800,
            activityId: acGarderie?.id,
            order: 1,
          },
        ],
      },
      payments: {
        create: [{ amount: 800, method: 'INTERAC', reference: 'INT-04302026' }],
      },
    },
  });

  // -- Dépenses exemples
  const catEssence = await prisma.expenseCategory.findUnique({ where: { code: 'ESSENCE' } });
  const catInternet = await prisma.expenseCategory.findUnique({ where: { code: 'INTERNET' } });
  if (catEssence) {
    await prisma.expense.create({
      data: {
        date: new Date('2026-05-05'),
        description: 'Plein essence Costco',
        vendor: 'Costco Brossard',
        subtotal: 65.0,
        tps: 3.25,
        tvq: 6.48,
        amount: 74.73,
        categoryId: catEssence.id,
      },
    });
  }
  if (catInternet) {
    await prisma.expense.create({
      data: {
        date: new Date('2026-05-01'),
        description: 'Forfait Internet mai',
        vendor: 'Vidéotron',
        subtotal: 79.99,
        tps: 4.0,
        tvq: 7.98,
        amount: 91.97,
        categoryId: catInternet.id,
      },
    });
  }

  console.log('✅  Seed terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.