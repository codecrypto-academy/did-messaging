import { DIDAPIClient } from '../client/DIDAPIClient';
import chalk from 'chalk';
import ora from 'ora';

class DIDGenerator {
  private client: DIDAPIClient;

  constructor(apiBaseURL?: string) {
    this.client = new DIDAPIClient(apiBaseURL);
  }

  /**
   * Genera múltiples DIDs de ejemplo
   */
  async generateExampleDIDs(count: number = 5): Promise<void> {
    console.log(chalk.blue.bold(`\n🎯 Generating ${count} Example DIDs\n`));

    // Verificar que la API esté funcionando
    const healthSpinner = ora('Checking API health...').start();
    try {
      const healthResponse = await this.client.healthCheck();
      if (!healthResponse.success) {
        throw new Error('API is not healthy');
      }
      healthSpinner.succeed('API is healthy');
    } catch (error) {
      healthSpinner.fail('API health check failed');
      console.error(chalk.red('❌ Cannot proceed. API is not available.'));
      return;
    }

    const createdDIDs: string[] = [];
    const errors: string[] = [];

    for (let i = 1; i <= count; i++) {
      const username = `user${i}`;
      const spinner = ora(`Creating DID ${i}/${count}: did:web:user/${username}`).start();
      
      try {
        const response = await this.client.createExampleDID(username);
        
        if (response.success && response.data) {
          createdDIDs.push(response.data.did);
          spinner.succeed(`Created: ${response.data.did}`);
          
          // Mostrar información del DID
          console.log(chalk.gray(`  📄 Document ID: ${response.data.document?.id || 'N/A'}`));
          console.log(chalk.gray(`  🔑 Keys: ${response.data.keys?.length || 0} key(s)`));
          console.log(chalk.gray(`  📅 Created: ${new Date(response.data.created_at).toLocaleString()}`));
        } else {
          const errorMsg = `Failed to create DID for ${username}`;
          errors.push(errorMsg);
          spinner.fail(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Error creating DID for ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        spinner.fail(errorMsg);
      }
    }

    // Mostrar resumen
    console.log(chalk.blue.bold('\n📊 Generation Summary\n'));
    console.log(chalk.green(`✅ Successfully created: ${createdDIDs.length} DIDs`));
    console.log(chalk.red(`❌ Failed: ${errors.length} DIDs`));
    
    if (createdDIDs.length > 0) {
      console.log(chalk.yellow.bold('\n📋 Created DIDs:'));
      createdDIDs.forEach((did, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${did}`));
      });
    }

    if (errors.length > 0) {
      console.log(chalk.red.bold('\n❌ Errors:'));
      errors.forEach((error, index) => {
        console.log(chalk.red(`  ${index + 1}. ${error}`));
      });
    }

    // Mostrar comandos para probar los DIDs
    if (createdDIDs.length > 0) {
      console.log(chalk.blue.bold('\n🧪 Test Commands:\n'));
      console.log(chalk.gray('To test digital signature:'));
      console.log(chalk.cyan(`  curl -X POST http://localhost:3000/api/v1/dids/${encodeURIComponent(createdDIDs[0])}/sign \\`));
      console.log(chalk.cyan(`    -H "Content-Type: application/json" \\`));
      console.log(chalk.cyan(`    -d '{"message": "Hello, DID World!"}'`));
      
      console.log(chalk.gray('\nTo test key agreement:'));
      if (createdDIDs.length >= 2) {
        console.log(chalk.cyan(`  curl -X POST http://localhost:3000/api/v1/dids/${encodeURIComponent(createdDIDs[0])}/key-agreement \\`));
        console.log(chalk.cyan(`    -H "Content-Type: application/json" \\`));
        console.log(chalk.cyan(`    -d '{"otherPublicKey": "GET_FROM_DID_2"}'`));
      }
    }
  }

  /**
   * Lista todos los DIDs existentes
   */
  async listAllDIDs(): Promise<void> {
    console.log(chalk.blue.bold('\n📋 Listing All DIDs\n'));

    const spinner = ora('Fetching DIDs...').start();
    
    try {
      const response = await this.client.listDIDs();
      
      if (response.success && response.data) {
        spinner.succeed(`Found ${response.data.length} DIDs`);
        
        if (response.data.length === 0) {
          console.log(chalk.yellow('No DIDs found. Create some DIDs first.'));
          return;
        }

        response.data.forEach((did, index) => {
          console.log(chalk.green(`\n${index + 1}. ${did.did}`));
          console.log(chalk.gray(`   ID: ${did.id}`));
          console.log(chalk.gray(`   Created: ${new Date(did.created_at).toLocaleString()}`));
          console.log(chalk.gray(`   Updated: ${new Date(did.updated_at).toLocaleString()}`));
          
          if (did.keys && did.keys.length > 0) {
            console.log(chalk.gray(`   Keys: ${did.keys.length} key(s)`));
            did.keys.forEach(key => {
              console.log(chalk.gray(`     - ${key.name} (${key.keyType}, ${key.keyUsage})`));
            });
          }
        });
      } else {
        spinner.fail('Failed to fetch DIDs');
        console.log(chalk.red('❌ Failed to fetch DIDs'));
      }
    } catch (error) {
      spinner.fail('Error fetching DIDs');
      console.log(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Limpia todos los DIDs (elimina todos)
   */
  async cleanupAllDIDs(): Promise<void> {
    console.log(chalk.red.bold('\n🧹 Cleaning Up All DIDs\n'));

    const spinner = ora('Fetching DIDs to delete...').start();
    
    try {
      const response = await this.client.listDIDs();
      
      if (response.success && response.data) {
        const dids = response.data;
        spinner.succeed(`Found ${dids.length} DIDs to delete`);
        
        if (dids.length === 0) {
          console.log(chalk.yellow('No DIDs to delete.'));
          return;
        }

        let deletedCount = 0;
        let errorCount = 0;

        for (const did of dids) {
          const deleteSpinner = ora(`Deleting ${did.did}...`).start();
          
          try {
            const deleteResponse = await this.client.deleteDID(did.did);
            if (deleteResponse.success) {
              deletedCount++;
              deleteSpinner.succeed(`Deleted: ${did.did}`);
            } else {
              errorCount++;
              deleteSpinner.fail(`Failed to delete: ${did.did}`);
            }
          } catch (error) {
            errorCount++;
            deleteSpinner.fail(`Error deleting: ${did.did}`);
          }
        }

        console.log(chalk.blue.bold('\n📊 Cleanup Summary\n'));
        console.log(chalk.green(`✅ Successfully deleted: ${deletedCount} DIDs`));
        console.log(chalk.red(`❌ Failed to delete: ${errorCount} DIDs`));
      } else {
        spinner.fail('Failed to fetch DIDs');
        console.log(chalk.red('❌ Failed to fetch DIDs'));
      }
    } catch (error) {
      spinner.fail('Error fetching DIDs');
      console.log(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
}

// Ejecutar si se ejecuta directamente
if (require.main === module) {
  const apiBaseURL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  const generator = new DIDGenerator(apiBaseURL);
  
  const command = process.argv[2];
  const count = parseInt(process.argv[3]) || 5;

  switch (command) {
    case 'generate':
      generator.generateExampleDIDs(count).catch(error => {
        console.error(chalk.red.bold('❌ Generation failed:'), error);
        process.exit(1);
      });
      break;
    case 'list':
      generator.listAllDIDs().catch(error => {
        console.error(chalk.red.bold('❌ Listing failed:'), error);
        process.exit(1);
      });
      break;
    case 'cleanup':
      generator.cleanupAllDIDs().catch(error => {
        console.error(chalk.red.bold('❌ Cleanup failed:'), error);
        process.exit(1);
      });
      break;
    default:
      console.log(chalk.blue.bold('🎯 DID Generator\n'));
      console.log('Usage:');
      console.log('  npm run generate-dids generate [count]  - Generate example DIDs');
      console.log('  npm run generate-dids list             - List all DIDs');
      console.log('  npm run generate-dids cleanup          - Delete all DIDs');
      console.log('\nExamples:');
      console.log('  npm run generate-dids generate 10      - Generate 10 DIDs');
      console.log('  npm run generate-dids list             - List all DIDs');
      console.log('  npm run generate-dids cleanup          - Clean up all DIDs');
  }
}

export { DIDGenerator };
