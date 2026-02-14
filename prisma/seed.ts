import { PrismaClient, EntityType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@grantfinder.dev' },
    update: {},
    create: { email: 'demo@grantfinder.dev', passwordHash }
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      entityType: EntityType.LLC,
      locationState: 'CA',
      employees: 12,
      revenueBand: '$1M-$5M',
      isUsOwned: true,
      hasPriorFederalFunding: false,
      naicsCodes: ['541715', '541330'],
      trlLevel: 5
    }
  });

  await prisma.grantOpportunity.createMany({
    data: [
      {
        source: 'grants.gov',
        sourceIdentifier: 'SAMPLE-GG-001',
        sourceUrl: 'https://www.grants.gov/',
        title: 'Clean Energy Small Business Pilot',
        agency: 'DOE',
        program: 'Energy Innovation TRL 5',
        fundingMin: 100000,
        fundingMax: 500000,
        ceiling: 500000,
        floor: 100000,
        closeDate: new Date(Date.now() + 86400000 * 30),
        openDate: new Date(),
        postedDate: new Date(),
        eligibilityTextRaw: 'Only US-owned small businesses with NAICS 541715 are eligible.',
        descriptionRaw: 'Develop climate tech pilots for grid modernization.',
        keywords: ['climate', 'energy', 'grid'],
        geography: ['US'],
        entityTypeConstraints: ['small business', 'LLC'],
        costShareRequired: false,
        citizenshipRequired: false,
        usOwnedRequired: true,
        naicsConstraints: ['541715'],
        sizeConstraints: 'SBA small business',
        notes: '{}',
        extractionStatus: 'done',
        lastSeenAt: new Date()
      },
      {
        source: 'sbir.gov',
        sourceIdentifier: 'SAMPLE-SBIR-001',
        sourceUrl: 'https://www.sbir.gov/',
        title: 'AI for Defense Readiness',
        agency: 'DoD',
        program: 'SBIR Phase I TRL 4',
        fundingMin: 50000,
        fundingMax: 250000,
        ceiling: 250000,
        floor: 50000,
        closeDate: new Date(Date.now() + 86400000 * 14),
        openDate: new Date(),
        postedDate: new Date(),
        eligibilityTextRaw: 'Must be US-owned for-profit business under 500 employees.',
        descriptionRaw: 'AI systems for defense logistics simulation.',
        keywords: ['ai', 'defense', 'logistics'],
        geography: ['US'],
        entityTypeConstraints: ['small business', 'C-Corp', 'LLC'],
        costShareRequired: false,
        citizenshipRequired: false,
        usOwnedRequired: true,
        naicsConstraints: ['541715'],
        sizeConstraints: 'under 500 employees',
        notes: '{}',
        extractionStatus: 'done',
        lastSeenAt: new Date()
      }
    ],
    skipDuplicates: true
  });
}

main().finally(() => prisma.$disconnect());
