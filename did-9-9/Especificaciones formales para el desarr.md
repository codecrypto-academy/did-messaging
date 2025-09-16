Especificaciones formales para el desarrollo del sistema:

1. **API CRUD para DIDs**
   - Desarrollar una API RESTful con operaciones CRUD (crear, leer, actualizar, eliminar) para almacenar DIDs y sus documentos asociados (DID Document).
   - La API debe residir en el directorio `did-api`.
   - Utilizar TypeScript y el framework Express.js.
   - La persistencia de datos debe realizarse en una base de datos Supabase local .

2. **Cliente de Pruebas**
   - Implementar un cliente en TypeScript para consumir y probar la API desarrollada.
   - El cliente debe permitir la ejecución de pruebas automatizadas sobre los endpoints principales.

3. **Pruebas Criptográficas**
   - Incluir en las pruebas:
     - Una firma digital utilizando el método `assertionMethod` definido en el DID Document.
     - Una prueba de `keyAgreement` empleando el algoritmo de Diffie-Hellman.

4. **Gestión de Claves**
   - Utilizar los estándares BIP39 y BIP32 para la generación de claves privadas, partiendo del 
   - Usar la libreria @noble (ED25519 y X25519) para la generacion de claves publicas a partir de las privadas
   - Quiero el formato hexadecimal para las claves publicas y privadas.
   siguiente mnemonic de ejemplo:  
     `"test test test test test test test test test test test junk"`
   - Generar claves utilizando los algoritmos Ed25519 y X25519.
   

5. **Derivation Paths de Ejemplo**
   - Utilizar los siguientes paths de derivación para la obtención de claves:
     - Ed25519: `m/44'/0'/0'/0/0`
     - Ed25519: `m/44'/0'/0'/0/1`
     - X25519: `m/44'/0'/0'/1/0`
     - X25519: `m/44'/0'/0'/1/1`
     - X25519: `m/44'/0'/0'/1/2`

6. **Base de Datos**
   - Proveer un mecanismo para resetear la base de datos Supabase local, la cual debe estar instalada y ejecutándose en Docker.
