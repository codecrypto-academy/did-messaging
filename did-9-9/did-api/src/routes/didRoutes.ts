import { Router } from 'express';
import { DIDController } from '../controllers/didController';
import { validateCreateDID, validateUpdateDID, validatePagination, validateAddKey, validateUpdateKeyActive } from '../middleware/validation';

const router = Router();

// Health check
router.get('/health', DIDController.healthCheck);

// DID CRUD operations
router.post('/dids', validateCreateDID, DIDController.createDID);
router.get('/dids', validatePagination, DIDController.getAllDIDs);
router.get('/dids/:did', DIDController.getDID);
router.put('/dids/:did', validateUpdateDID, DIDController.updateDID);
router.delete('/dids/:did', DIDController.deleteDID);

// Private key operations
router.get('/dids/:did/keys/:keyType', DIDController.getPrivateKey);

// Add a new key to a DID
router.post('/dids/:did/keys', validateAddKey, DIDController.addKey);

// Update key active status
router.put('/dids/:did/keys/:keyId/active', validateUpdateKeyActive, DIDController.updateKeyActive);

export default router;
