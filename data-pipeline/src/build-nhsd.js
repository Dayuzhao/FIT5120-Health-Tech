// Build the bundled NHSD mental-health services file for Curbi Epic 2 (US2).
//
// Reads the raw data.gov.au NHSD June-2025 extract from ./input/, filters to
// mental-health services within the agreed geographic scope, trims each record to
// the fields the app needs, drops rows without coordinates, de-duplicates, and
// writes ../Curbi/public/data/nhsd-services.json.
//
// Not implemented yet: waiting on the raw extract so the file format and the
// service-type taxonomy can be inspected. See README.md for the filter decisions
// still to confirm with the team.

console.error(
  'build-nhsd: not implemented yet — put the raw NHSD extract in data-pipeline/input/ first',
)
process.exit(1)
