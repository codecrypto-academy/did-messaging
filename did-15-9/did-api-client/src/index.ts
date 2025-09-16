import { DIDAPIClient } from './client/DIDAPIClient';
import { TestSuite, TestResult } from './types/api';
import chalk from 'chalk';
import ora from 'ora';

class DIDTestRunner {
  private client: DIDAPIClient;
  private results: TestSuite[] = [];

  constructor(apiBaseURL?: string) {
    this.client = new DIDAPIClient(apiBaseURL);
  }

  /**
   * Ejecuta todas las pruebas
   */
  async runAllTests(): Promise<void> {
    console.log(chalk.blue.bold('\n🧪 Innovation DID API Test Suite\n'));

    // Verificar salud de la API
    await this.testHealthCheck();

    // Pruebas CRUD
    await this.testCRUDOperations();

    // Pruebas criptográficas
    await this.testCryptographicOperations();

    // Mostrar resumen
    this.showSummary();
  }

  /**
   * Prueba la salud de la API
   */
  private async testHealthCheck(): Promise<void> {
    const suite = this.createTestSuite('Health Check');
    
    const spinner = ora('Testing API health...').start();
    
    try {
      const response = await this.client.healthCheck();
      
      if (response.success) {
        this.addTestResult(suite, 'API Health Check', true, 'API is healthy', 0);
        spinner.succeed('API is healthy');
      } else {
        this.addTestResult(suite, 'API Health Check', false, 'API health check failed', 0);
        spinner.fail('API health check failed');
      }
    } catch (error) {
      this.addTestResult(suite, 'API Health Check', false, error instanceof Error ? error.message : 'Unknown error', 0);
      spinner.fail('API health check failed');
    }

    this.results.push(suite);
  }

  /**
   * Prueba las operaciones CRUD
   */
  private async testCRUDOperations(): Promise<void> {
    const suite = this.createTestSuite('CRUD Operations');
    const testDID = `did:web:user/test-${Date.now()}`;

    // Crear DID
    const createSpinner = ora('Creating test DID...').start();
    try {
      const createResponse = await this.client.createExampleDID(`test-${Date.now()}`);
      if (createResponse.success && createResponse.data) {
        this.addTestResult(suite, 'Create DID', true, 'DID created successfully', 0);
        createSpinner.succeed('DID created');
        
        // Obtener DID
        const getSpinner = ora('Retrieving DID...').start();
        try {
          const getResponse = await this.client.getDID(createResponse.data.did);
          if (getResponse.success && getResponse.data) {
            this.addTestResult(suite, 'Get DID', true, 'DID retrieved successfully', 0);
            getSpinner.succeed('DID retrieved');
            
            // Obtener documento
            const docSpinner = ora('Retrieving DID document...').start();
            try {
              const docResponse = await this.client.getDIDDocument(createResponse.data.did);
              if (docResponse.success && docResponse.data) {
                this.addTestResult(suite, 'Get DID Document', true, 'DID document retrieved successfully', 0);
                docSpinner.succeed('DID document retrieved');
              } else {
                this.addTestResult(suite, 'Get DID Document', false, 'Failed to retrieve DID document', 0);
                docSpinner.fail('Failed to retrieve DID document');
              }
            } catch (error) {
              this.addTestResult(suite, 'Get DID Document', false, error instanceof Error ? error.message : 'Unknown error', 0);
              docSpinner.fail('Failed to retrieve DID document');
            }
            
            // Listar DIDs
            const listSpinner = ora('Listing DIDs...').start();
            try {
              const listResponse = await this.client.listDIDs();
              if (listResponse.success && listResponse.data && listResponse.data.length > 0) {
                this.addTestResult(suite, 'List DIDs', true, `Found ${listResponse.data.length} DIDs`, 0);
                listSpinner.succeed(`Found ${listResponse.data.length} DIDs`);
              } else {
                this.addTestResult(suite, 'List DIDs', false, 'No DIDs found', 0);
                listSpinner.fail('No DIDs found');
              }
            } catch (error) {
              this.addTestResult(suite, 'List DIDs', false, error instanceof Error ? error.message : 'Unknown error', 0);
              listSpinner.fail('Failed to list DIDs');
            }
            
            // Eliminar DID
            const deleteSpinner = ora('Deleting DID...').start();
            try {
              const deleteResponse = await this.client.deleteDID(createResponse.data.did);
              if (deleteResponse.success) {
                this.addTestResult(suite, 'Delete DID', true, 'DID deleted successfully', 0);
                deleteSpinner.succeed('DID deleted');
              } else {
                this.addTestResult(suite, 'Delete DID', false, 'Failed to delete DID', 0);
                deleteSpinner.fail('Failed to delete DID');
              }
            } catch (error) {
              this.addTestResult(suite, 'Delete DID', false, error instanceof Error ? error.message : 'Unknown error', 0);
              deleteSpinner.fail('Failed to delete DID');
            }
          } else {
            this.addTestResult(suite, 'Get DID', false, 'Failed to retrieve DID', 0);
            getSpinner.fail('Failed to retrieve DID');
          }
        } catch (error) {
          this.addTestResult(suite, 'Get DID', false, error instanceof Error ? error.message : 'Unknown error', 0);
          getSpinner.fail('Failed to retrieve DID');
        }
      } else {
        this.addTestResult(suite, 'Create DID', false, 'Failed to create DID', 0);
        createSpinner.fail('Failed to create DID');
      }
    } catch (error) {
      this.addTestResult(suite, 'Create DID', false, error instanceof Error ? error.message : 'Unknown error', 0);
      createSpinner.fail('Failed to create DID');
    }

    this.results.push(suite);
  }

  /**
   * Prueba las operaciones criptográficas
   */
  private async testCryptographicOperations(): Promise<void> {
    const suite = this.createTestSuite('Cryptographic Operations');
    const testDID1 = `did:web:user/crypto-test-1-${Date.now()}`;
    const testDID2 = `did:web:user/crypto-test-2-${Date.now()}`;

    // Crear DIDs para pruebas criptográficas
    const createSpinner = ora('Creating DIDs for cryptographic tests...').start();
    try {
      const [did1Response, did2Response] = await Promise.all([
        this.client.createExampleDID(`crypto-test-1-${Date.now()}`),
        this.client.createExampleDID(`crypto-test-2-${Date.now()}`)
      ]);

      if (did1Response.success && did1Response.data && did2Response.success && did2Response.data) {
        createSpinner.succeed('DIDs created for cryptographic tests');
        
        // Prueba de firma digital
        const signSpinner = ora('Testing digital signature...').start();
        try {
          const signResult = await this.client.testDigitalSignature(did1Response.data.did, 'Test message for digital signature');
          if (signResult.success && signResult.verification) {
            this.addTestResult(suite, 'Digital Signature', true, 'Digital signature test passed', 0);
            signSpinner.succeed('Digital signature test passed');
          } else {
            this.addTestResult(suite, 'Digital Signature', false, 'Digital signature test failed', 0);
            signSpinner.fail('Digital signature test failed');
          }
        } catch (error) {
          this.addTestResult(suite, 'Digital Signature', false, error instanceof Error ? error.message : 'Unknown error', 0);
          signSpinner.fail('Digital signature test failed');
        }

        // Prueba de key agreement (Diffie-Hellman)
        const keyAgreementSpinner = ora('Testing key agreement (Diffie-Hellman)...').start();
        try {
          const keyAgreementResult = await this.client.testKeyAgreement(did1Response.data.did, did2Response.data.did);
          if (keyAgreementResult.success && keyAgreementResult.secretsMatch) {
            this.addTestResult(suite, 'Key Agreement (Diffie-Hellman)', true, 'Key agreement test passed', 0);
            keyAgreementSpinner.succeed('Key agreement test passed');
          } else {
            this.addTestResult(suite, 'Key Agreement (Diffie-Hellman)', false, 'Key agreement test failed', 0);
            keyAgreementSpinner.fail('Key agreement test failed');
          }
        } catch (error) {
          this.addTestResult(suite, 'Key Agreement (Diffie-Hellman)', false, error instanceof Error ? error.message : 'Unknown error', 0);
          keyAgreementSpinner.fail('Key agreement test failed');
        }

        // Limpiar DIDs de prueba
        await Promise.all([
          this.client.deleteDID(did1Response.data.did),
          this.client.deleteDID(did2Response.data.did)
        ]);
      } else {
        this.addTestResult(suite, 'Create DIDs for Crypto Tests', false, 'Failed to create DIDs for cryptographic tests', 0);
        createSpinner.fail('Failed to create DIDs for cryptographic tests');
      }
    } catch (error) {
      this.addTestResult(suite, 'Create DIDs for Crypto Tests', false, error instanceof Error ? error.message : 'Unknown error', 0);
      createSpinner.fail('Failed to create DIDs for cryptographic tests');
    }

    this.results.push(suite);
  }

  /**
   * Crea una suite de pruebas
   */
  private createTestSuite(name: string): TestSuite {
    return {
      name,
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0
    };
  }

  /**
   * Añade un resultado de prueba
   */
  private addTestResult(suite: TestSuite, testName: string, success: boolean, message: string, duration: number): void {
    const result: TestResult = {
      testName,
      success,
      message,
      duration
    };

    suite.results.push(result);
    suite.totalTests++;
    
    if (success) {
      suite.passedTests++;
    } else {
      suite.failedTests++;
    }
  }

  /**
   * Muestra el resumen de las pruebas
   */
  private showSummary(): void {
    console.log(chalk.blue.bold('\n📊 Test Summary\n'));

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    this.results.forEach(suite => {
      console.log(chalk.yellow.bold(`\n${suite.name}:`));
      
      suite.results.forEach(result => {
        const status = result.success ? chalk.green('✅') : chalk.red('❌');
        const message = result.success ? chalk.green(result.message) : chalk.red(result.message);
        console.log(`  ${status} ${result.testName}: ${message}`);
      });

      console.log(chalk.gray(`  Total: ${suite.totalTests}, Passed: ${suite.passedTests}, Failed: ${suite.failedTests}`));
      
      totalTests += suite.totalTests;
      totalPassed += suite.passedTests;
      totalFailed += suite.failedTests;
    });

    console.log(chalk.blue.bold(`\n🎯 Overall Results:`));
    console.log(chalk.gray(`Total Tests: ${totalTests}`));
    console.log(chalk.green(`Passed: ${totalPassed}`));
    console.log(chalk.red(`Failed: ${totalFailed}`));
    
    if (totalFailed === 0) {
      console.log(chalk.green.bold('\n🎉 All tests passed!'));
    } else {
      console.log(chalk.red.bold(`\n⚠️  ${totalFailed} test(s) failed.`));
    }
  }
}

// Ejecutar pruebas si se ejecuta directamente
if (require.main === module) {
  const apiBaseURL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  const testRunner = new DIDTestRunner(apiBaseURL);
  
  testRunner.runAllTests().catch(error => {
    console.error(chalk.red.bold('❌ Test execution failed:'), error);
    process.exit(1);
  });
}

export { DIDTestRunner };
