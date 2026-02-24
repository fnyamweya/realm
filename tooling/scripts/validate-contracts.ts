#!/usr/bin/env tsx
// Validate that all contract schemas are valid Zod types
import * as apiContracts from '@realtyos/contracts-api';
import * as eventContracts from '@realtyos/contracts-events';
import { z } from 'zod';

let errors = 0;

function validateExports(moduleName: string, mod: Record<string, unknown>) {
  const schemas = Object.entries(mod).filter(([key]) => key.endsWith('Schema'));
  console.log(`[${moduleName}] Found ${schemas.length} schemas`);

  for (const [name, schema] of schemas) {
    if (!(schema instanceof z.ZodType)) {
      console.error(`  ✗ ${name} is not a valid Zod schema`);
      errors++;
    } else {
      console.log(`  ✓ ${name}`);
    }
  }
}

validateExports('contracts-api', apiContracts as Record<string, unknown>);
validateExports('contracts-events', eventContracts as Record<string, unknown>);

if (errors > 0) {
  console.error(`\n${errors} contract validation error(s) found`);
  process.exit(1);
} else {
  console.log('\nAll contracts valid ✓');
  process.exit(0);
}
