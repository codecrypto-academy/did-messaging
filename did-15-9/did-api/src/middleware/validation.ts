import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Esquema de validación para DID
const didSchema = Joi.string().pattern(/^did:[a-z0-9]+:[a-zA-Z0-9._\/-]+$/).required();

// Esquema de validación para VerificationMethod
const verificationMethodSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid('Ed25519VerificationKey2020', 'X25519KeyAgreementKey2020').required(),
  controller: Joi.string().required(),
  publicKeyMultibase: Joi.string().required()
});

// Esquema de validación para Service
const serviceSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().required(),
  serviceEndpoint: Joi.string().uri().required()
});

// Esquema de validación para DIDDocument
const didDocumentSchema = Joi.object({
  id: Joi.string().required(),
  '@context': Joi.array().items(Joi.string()).required(),
  controller: Joi.string().required(),
  alsoKnownAs: Joi.array().items(Joi.string()).optional(),
  service: Joi.array().items(serviceSchema).optional(),
  authentication: Joi.array().items(Joi.string()).required(),
  assertionMethod: Joi.array().items(Joi.string()).required(),
  keyAgreement: Joi.array().items(Joi.string()).required(),
  verificationMethod: Joi.array().items(verificationMethodSchema).required()
});

// Esquema de validación para KeyPair
const keyPairSchema = Joi.object({
  name: Joi.string().required(),
  keyType: Joi.string().valid('ed25519', 'x25519').required(),
  keyUsage: Joi.string().valid('authentication', 'assertionMethod', 'keyAgreement').required(),
  active: Joi.boolean().optional().default(true)
});

// Esquema de validación para crear DID
const createDIDSchema = Joi.object({
  did: didSchema,
  document: didDocumentSchema.optional(),
  keys: Joi.array().items(keyPairSchema).optional()
});

// Esquema de validación para actualizar DID
const updateDIDSchema = Joi.object({
  document: didDocumentSchema.optional(),
  keys: Joi.array().items(keyPairSchema).optional()
}).min(1);

// Esquema de validación para firmar mensaje
const signMessageSchema = Joi.object({
  message: Joi.string().required(),
  keyName: Joi.string().optional()
});

// Esquema de validación para verificar firma
const verifySignatureSchema = Joi.object({
  message: Joi.string().required(),
  signature: Joi.string().required(),
  keyName: Joi.string().optional()
});

// Esquema de validación para key agreement
const keyAgreementSchema = Joi.object({
  otherPublicKey: Joi.string().required(),
  keyName: Joi.string().optional()
});

// Middleware de validación genérico
const validate = (schema: Joi.ObjectSchema, property: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[property]);
    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
      return;
    }
    next();
  };
};

// Middlewares específicos
export const validateDID = validate(
  Joi.object({ did: didSchema }),
  'params'
);

export const validateCreateDID = validate(createDIDSchema);

export const validateUpdateDID = validate(updateDIDSchema);

export const validateSignMessage = validate(signMessageSchema);

export const validateVerifySignature = validate(verifySignatureSchema);

export const validateKeyAgreement = validate(keyAgreementSchema);
