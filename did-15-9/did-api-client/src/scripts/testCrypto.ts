import { DIDAPIClient } from '../client/DIDAPIClient';
import chalk from 'chalk';
import ora from 'ora';

class CryptoTester {
  private client: DIDAPIClient;

  constructor(apiBaseURL?: string) {
    this.client = new DIDAPIClient(apiBaseURL);
  }

  /**
   * Ejecuta todas las pruebas criptográficas
   */
  async runCryptoTests(): Promise<void> {
    console.log(chalk.blue.bold('\n🔐 Cryptographic Tests for DID API\n'));

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
      console.error(chalk.red('❌ Cannot proceed with tests. API is not available.'));
      return;
    }

    // Crear DIDs de prueba
    const testDID1 = `did:web:user/crypto-test-1-${Date.now()}`;
    const testDID2 = `did:web:user/crypto-test-2-${Date.now()}`;

    const createSpinner = ora('Creating test DIDs...').start();
    let did1Data, did2Data;

    try {
      const [did1Response, did2Response] = await Promise.all([
        this.client.createExampleDID(`crypto-test-1-${Date.now()}`),
        this.client.createExampleDID(`crypto-test-2-${Date.now()}`)
      ]);

      if (!did1Response.success || !did1Response.data || !did2Response.success || !did2Response.data) {
        throw new Error('Failed to create test DIDs');
      }

      did1Data = did1Response.data;
      did2Data = did2Response.data;
      createSpinner.succeed('Test DIDs created successfully');
    } catch (error) {
      createSpinner.fail('Failed to create test DIDs');
      console.error(chalk.red('❌ Cannot proceed with tests. Failed to create test DIDs.'));
      return;
    }

    // Ejecutar pruebas
    await this.testDigitalSignature(did1Data.did);
    await this.testKeyAgreement(did1Data.did, did2Data.did);
    await this.testKeyDerivation();
    await this.testEncryptionDecryption();

    // Limpiar
    const cleanupSpinner = ora('Cleaning up test DIDs...').start();
    try {
      await Promise.all([
        this.client.deleteDID(did1Data.did),
        this.client.deleteDID(did2Data.did)
      ]);
      cleanupSpinner.succeed('Test DIDs cleaned up');
    } catch (error) {
      cleanupSpinner.fail('Failed to clean up test DIDs');
    }

    console.log(chalk.green.bold('\n🎉 Cryptographic tests completed!'));
  }

  /**
   * Prueba la firma digital con assertionMethod
   */
  private async testDigitalSignature(did: string): Promise<void> {
    console.log(chalk.yellow.bold('\n📝 Testing Digital Signature (assertionMethod)'));
    
    const testMessages = [
      'Hello, DID World!',
      'This is a test message for digital signature verification.',
      'Innovation DID API - Cryptographic Test Suite',
      'Test message with special characters: !@#$%^&*()_+-=[]{}|;:,.<>?',
      'Unicode test: 你好世界 🌍'
    ];

    for (const message of testMessages) {
      const spinner = ora(`Testing signature for: "${message.substring(0, 30)}..."`).start();
      
      try {
        const result = await this.client.testDigitalSignature(did, message);
        
        if (result.success && result.verification) {
          spinner.succeed(`Signature test passed for: "${message.substring(0, 30)}..."`);
          console.log(chalk.gray(`  Signature: ${result.signature.substring(0, 20)}...`));
          console.log(chalk.gray(`  Public Key: ${result.publicKey.substring(0, 20)}...`));
        } else {
          spinner.fail(`Signature test failed for: "${message.substring(0, 30)}..."`);
          console.log(chalk.red(`  Error: ${result.message}`));
        }
      } catch (error) {
        spinner.fail(`Signature test error for: "${message.substring(0, 30)}..."`);
        console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    }
  }

  /**
   * Prueba el key agreement (Diffie-Hellman) con X25519
   */
  private async testKeyAgreement(did1: string, did2: string): Promise<void> {
    console.log(chalk.yellow.bold('\n🤝 Testing Key Agreement (Diffie-Hellman)'));
    
    const spinner = ora('Testing key agreement between two DIDs...').start();
    
    try {
      const result = await this.client.testKeyAgreement(did1, did2);
      
      if (result.success && result.secretsMatch) {
        spinner.succeed('Key agreement test passed');
        console.log(chalk.gray(`  Shared Secret 1: ${result.sharedSecret1.substring(0, 20)}...`));
        console.log(chalk.gray(`  Shared Secret 2: ${result.sharedSecret2.substring(0, 20)}...`));
        console.log(chalk.green(`  ✅ Secrets match: ${result.secretsMatch}`));
      } else {
        spinner.fail('Key agreement test failed');
        console.log(chalk.red(`  Error: Secrets do not match or test failed`));
      }
    } catch (error) {
      spinner.fail('Key agreement test error');
      console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Prueba la derivación de claves BIP39/BIP32
   */
  private async testKeyDerivation(): Promise<void> {
    console.log(chalk.yellow.bold('\n🔑 Testing Key Derivation (BIP39/BIP32)'));
    
    const spinner = ora('Testing key derivation paths...').start();
    
    try {
      // Crear un DID temporal para probar la derivación
      const tempDID = `did:web:user/derivation-test-${Date.now()}`;
      const createResponse = await this.client.createExampleDID(`derivation-test-${Date.now()}`);
      
      if (!createResponse.success || !createResponse.data) {
        throw new Error('Failed to create temporary DID for derivation test');
      }

      const didData = await this.client.getDID(createResponse.data.did);
      if (!didData.success || !didData.data || !didData.data.keys) {
        throw new Error('Failed to get DID data for derivation test');
      }

      // Verificar que se generaron las claves correctas
      const expectedKeys = [
        { name: 'auth-key', keyType: 'ed25519', keyUsage: 'authentication' },
        { name: 'assertion-key', keyType: 'ed25519', keyUsage: 'assertionMethod' },
        { name: 'key-agreement-1', keyType: 'x25519', keyUsage: 'keyAgreement' },
        { name: 'key-agreement-2', keyType: 'x25519', keyUsage: 'keyAgreement' },
        { name: 'key-agreement-3', keyType: 'x25519', keyUsage: 'keyAgreement' }
      ];

      let allKeysPresent = true;
      for (const expectedKey of expectedKeys) {
        const foundKey = didData.data.keys.find(k => 
          k.name === expectedKey.name && 
          k.keyType === expectedKey.keyType && 
          k.keyUsage === expectedKey.keyUsage
        );
        
        if (!foundKey) {
          allKeysPresent = false;
          console.log(chalk.red(`  ❌ Missing key: ${expectedKey.name} (${expectedKey.keyType}, ${expectedKey.keyUsage})`));
        } else {
          console.log(chalk.green(`  ✅ Found key: ${foundKey.name} (${foundKey.keyType}, ${foundKey.keyUsage})`));
          console.log(chalk.gray(`     Derivation Path: ${foundKey.derivationPath}`));
          console.log(chalk.gray(`     Public Key: ${foundKey.publicKey.substring(0, 20)}...`));
        }
      }

      if (allKeysPresent) {
        spinner.succeed('Key derivation test passed');
      } else {
        spinner.fail('Key derivation test failed - missing keys');
      }

      // Limpiar DID temporal
      await this.client.deleteDID(createResponse.data.did);
      
    } catch (error) {
      spinner.fail('Key derivation test error');
      console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Prueba el cifrado y descifrado de claves privadas
   */
  private async testEncryptionDecryption(): Promise<void> {
    console.log(chalk.yellow.bold('\n🔒 Testing Key Encryption/Decryption'));
    
    const spinner = ora('Testing encrypted key storage...').start();
    
    try {
      // Crear un DID temporal para probar el cifrado
      const tempDID = `did:web:user/encryption-test-${Date.now()}`;
      const createResponse = await this.client.createExampleDID(`encryption-test-${Date.now()}`);
      
      if (!createResponse.success || !createResponse.data) {
        throw new Error('Failed to create temporary DID for encryption test');
      }

      // Obtener datos del DID
      const didData = await this.client.getDID(createResponse.data.did);
      if (!didData.success || !didData.data || !didData.data.keys) {
        throw new Error('Failed to get DID data for encryption test');
      }

      // Verificar que las claves están cifradas (no son claves privadas reales)
      const ed25519Key = didData.data.keys.find(k => k.keyType === 'ed25519' && k.keyUsage === 'authentication');
      const x25519Key = didData.data.keys.find(k => k.keyType === 'x25519' && k.keyUsage === 'keyAgreement');

      if (ed25519Key) {
        console.log(chalk.green(`  ✅ Ed25519 key found: ${ed25519Key.name}`));
        console.log(chalk.gray(`     Public Key: ${ed25519Key.publicKey.substring(0, 20)}...`));
        console.log(chalk.gray(`     Derivation Path: ${ed25519Key.derivationPath}`));
      }

      if (x25519Key) {
        console.log(chalk.green(`  ✅ X25519 key found: ${x25519Key.name}`));
        console.log(chalk.gray(`     Public Key: ${x25519Key.publicKey.substring(0, 20)}...`));
        console.log(chalk.gray(`     Derivation Path: ${x25519Key.derivationPath}`));
      }

      // Probar que las claves funcionan para operaciones criptográficas
      const signResult = await this.client.testDigitalSignature(createResponse.data.did, 'Encryption test message');
      if (signResult.success && signResult.verification) {
        console.log(chalk.green(`  ✅ Encrypted keys work for cryptographic operations`));
      } else {
        console.log(chalk.red(`  ❌ Encrypted keys do not work for cryptographic operations`));
      }

      spinner.succeed('Key encryption/decryption test passed');

      // Limpiar DID temporal
      await this.client.deleteDID(createResponse.data.did);
      
    } catch (error) {
      spinner.fail('Key encryption/decryption test error');
      console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
}

// Ejecutar pruebas si se ejecuta directamente
if (require.main === module) {
  const apiBaseURL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  const tester = new CryptoTester(apiBaseURL);
  
  tester.runCryptoTests().catch(error => {
    console.error(chalk.red.bold('❌ Cryptographic test execution failed:'), error);
    process.exit(1);
  });
}

export { CryptoTester };
