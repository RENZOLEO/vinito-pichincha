/**
 * Deletes reservations with date >= 2026-05-14, excluding customers named "Maggiolo".
 *
 * Usage (dry-run, shows what would be deleted):
 *   DATABASE_URL="..." node scripts/cleanup-reservations.js
 *
 * Usage (execute deletion):
 *   DATABASE_URL="..." node scripts/cleanup-reservations.js --confirm
 *
 * With Railway CLI:
 *   railway run node scripts/cleanup-reservations.js
 *   railway run node scripts/cleanup-reservations.js --confirm
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const dryRun = !process.argv.includes('--confirm')
const CUTOFF = new Date('2026-05-14T00:00:00.000Z')

async function main() {
  const candidates = await prisma.reservation.findMany({
    where: { date: { gte: CUTOFF } },
    include: { customer: true },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  })

  const toDelete = candidates.filter(r => !r.customer.name.toLowerCase().includes('maggiolo'))
  const toKeep   = candidates.filter(r =>  r.customer.name.toLowerCase().includes('maggiolo'))

  console.log(`\nReservations found from 2026-05-14 onwards: ${candidates.length}`)

  console.log(`\n--- WILL DELETE (${toDelete.length}) ---`)
  if (toDelete.length === 0) {
    console.log('  (none)')
  } else {
    toDelete.forEach(r =>
      console.log(`  ID ${r.id}  ${r.date.toISOString().split('T')[0]}  ${r.time}  ${r.customer.name}  ${r.customer.phone}`)
    )
  }

  console.log(`\n--- WILL KEEP — Maggiolo (${toKeep.length}) ---`)
  if (toKeep.length === 0) {
    console.log('  (none)')
  } else {
    toKeep.forEach(r =>
      console.log(`  ID ${r.id}  ${r.date.toISOString().split('T')[0]}  ${r.time}  ${r.customer.name}  ${r.customer.phone}`)
    )
  }

  if (dryRun) {
    console.log('\n⚠  DRY RUN — nothing was changed.')
    console.log('   Add --confirm to execute the deletion.\n')
    return
  }

  if (toDelete.length === 0) {
    console.log('\nNothing to delete.\n')
    return
  }

  const ids = toDelete.map(r => r.id)
  const result = await prisma.reservation.deleteMany({ where: { id: { in: ids } } })
  console.log(`\n✓ Deleted ${result.count} reservation(s).\n`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
