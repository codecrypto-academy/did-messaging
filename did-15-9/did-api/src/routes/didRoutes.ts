import { Router } from 'express';
import { DIDController } from '../controllers/didController';
import { validateDID, validateCreateDID, validateUpdateDID, validateSignMessage, validateVerifySignature, validateKeyAgreement } from '../middleware/validation';

const router = Router();
const didController = new DIDController();

// Rutas CRUD para DIDs
router.post('/', validateCreateDID, didController.createDID.bind(didController));
router.post('/simple', didController.createSimpleDID.bind(didController));
router.get('/', didController.listDIDs.bind(didController));
router.get('/:did', validateDID, didController.getDID.bind(didController));
router.get('/:did/document', validateDID, didController.getDIDDocument.bind(didController));
router.put('/:did', validateDID, validateUpdateDID, didController.updateDID.bind(didController));
router.delete('/:did', validateDID, didController.deleteDID.bind(didController));

// Rutas criptográficas
router.post('/:did/sign', validateDID, validateSignMessage, didController.signMessage.bind(didController));
router.post('/:did/verify', validateDID, validateVerifySignature, didController.verifySignature.bind(didController));
router.post('/:did/key-agreement', validateDID, validateKeyAgreement, didController.generateSharedSecret.bind(didController));

// Rutas para mensajes encriptados
router.post('/:did/send-message', validateDID, didController.sendMessage.bind(didController));
router.post('/:did/read-message', validateDID, didController.readMessage.bind(didController));
router.get('/:did/messages', validateDID, didController.getMessages.bind(didController));

export default router;
