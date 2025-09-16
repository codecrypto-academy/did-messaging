import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validateCreateDID = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    did: Joi.string().uri().required(),
    document: Joi.object({
      '@context': Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
      ).required(),
      id: Joi.string().uri().required(),
      verificationMethod: Joi.array().items(
        Joi.object({
          id: Joi.string().uri().required(),
          type: Joi.string().required(),
          controller: Joi.string().uri().required(),
          publicKeyJwk: Joi.object().optional(),
          publicKeyMultibase: Joi.string().optional(),
          publicKeyBase58: Joi.string().optional()
        })
      ).optional(),
      authentication: Joi.array().items(
        Joi.alternatives().try(
          Joi.string().uri(),
          Joi.object()
        )
      ).optional(),
      assertionMethod: Joi.array().items(
        Joi.alternatives().try(
          Joi.string().uri(),
          Joi.object()
        )
      ).optional(),
      keyAgreement: Joi.array().items(
        Joi.alternatives().try(
          Joi.string().uri(),
          Joi.object()
        )
      ).optional(),
      service: Joi.array().items(
        Joi.object({
          id: Joi.string().uri().required(),
          type: Joi.string().required(),
          serviceEndpoint: Joi.alternatives().try(
            Joi.string(),
            Joi.object()
          ).required()
        })
      ).optional(),
      alsoKnownAs: Joi.array().items(Joi.string()).optional(),
      controller: Joi.alternatives().try(
        Joi.string().uri(),
        Joi.array().items(Joi.string().uri())
      ).optional()
    }).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message,
      statusCode: 400
    });
  }
  next();
};

export const validateUpdateDID = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    document: Joi.object({
      '@context': Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
      ).required(),
      id: Joi.string().uri().required(),
      verificationMethod: Joi.array().items(
        Joi.object({
          id: Joi.string().uri().required(),
          type: Joi.string().required(),
          controller: Joi.string().uri().required(),
          publicKeyJwk: Joi.object().optional(),
          publicKeyMultibase: Joi.string().optional(),
          publicKeyBase58: Joi.string().optional()
        })
      ).optional(),
      authentication: Joi.array().items(
        Joi.alternatives().try(
          Joi.string().uri(),
          Joi.object()
        )
      ).optional(),
      assertionMethod: Joi.array().items(
        Joi.alternatives().try(
          Joi.string().uri(),
          Joi.object()
        )
      ).optional(),
      keyAgreement: Joi.array().items(
        Joi.alternatives().try(
          Joi.string().uri(),
          Joi.object()
        )
      ).optional(),
      service: Joi.array().items(
        Joi.object({
          id: Joi.string().uri().required(),
          type: Joi.string().required(),
          serviceEndpoint: Joi.alternatives().try(
            Joi.string(),
            Joi.object()
          ).required()
        })
      ).optional(),
      alsoKnownAs: Joi.array().items(Joi.string()).optional(),
      controller: Joi.alternatives().try(
        Joi.string().uri(),
        Joi.array().items(Joi.string().uri())
      ).optional()
    }).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message,
      statusCode: 400
    });
  }
  next();
};

export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  });

  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message,
      statusCode: 400
    });
  }
  
  req.query = value;
  next();
};

export const validateAddKey = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    key_type: Joi.string().valid('ed25519', 'x25519').required(),
    key_usage: Joi.string().valid('authentication', 'assertionMethod', 'keyAgreement').required(),
    active: Joi.boolean().optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message,
      statusCode: 400
    });
  }
  
  req.body = value;
  next();
};

export const validateUpdateKeyActive = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    active: Joi.boolean().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message,
      statusCode: 400
    });
  }
  
  req.body = value;
  next();
};
