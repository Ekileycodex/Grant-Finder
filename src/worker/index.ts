import cron from 'node-cron';
import { ingestGrantsGov, ingestSbir, runExtractionPass } from '@/src/services/ingestion';
import { sendDailyAlerts } from '@/src/services/alerts';

async function runIngestionCycle() {
  const grantsGovCount = await ingestGrantsGov();
  const sbirCount = await ingestSbir();
  await runExtractionPass(30);
  console.log(`[worker] ingestion complete grants.gov=${grantsGovCount} sbir=${sbirCount}`);
}

cron.schedule('0 */6 * * *', runIngestionCycle, { timezone: 'UTC' });
cron.schedule('0 13 * * *', sendDailyAlerts, { timezone: 'UTC' });

runIngestionCycle().catch((err) => {
  console.error('[worker] initial run failed', err);
  process.exitCode = 1;
});
