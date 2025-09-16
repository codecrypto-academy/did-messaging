import { Request, Response, NextFunction } from 'express';
import { DIDModel } from '../models/DIDModel';
import { CreateDIDRequest, UpdateDIDRequest, AddKeyRequest, UpdateKeyActiveRequest } from '../types/did';

export class DIDController {
  /**
   * Create a new DID
   */
  static async createDID(req: Request, res: Response, next: NextFunction) {
    try {
      const createRequest: CreateDIDRequest = req.body;
      const result = await DIDModel.createDID(createRequest);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'DID created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a DID by identifier
   */
  static async getDID(req: Request, res: Response, next: NextFunction) {
    try {
      const { did } = req.params;
      const result = await DIDModel.getDID(did);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `DID ${did} not found`,
          statusCode: 404
        });
      }

      res.json({
        success: true,
        data: result,
        message: 'DID retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all DIDs with pagination
   */
  static async getAllDIDs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await DIDModel.getAllDIDs(page, limit);
      
      res.json({
        success: true,
        data: result,
        message: 'DIDs retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a DID document
   */
  static async updateDID(req: Request, res: Response, next: NextFunction) {
    try {
      const { did } = req.params;
      const updateRequest: UpdateDIDRequest = req.body;
      
      const result = await DIDModel.updateDID(did, updateRequest.document);
      
      res.json({
        success: true,
        data: result,
        message: 'DID updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a DID
   */
  static async deleteDID(req: Request, res: Response, next: NextFunction) {
    try {
      const { did } = req.params;
      const deleted = await DIDModel.deleteDID(did);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `DID ${did} not found`,
          statusCode: 404
        });
      }

      res.json({
        success: true,
        message: 'DID deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get private key for a DID
   */
  static async getPrivateKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { did, keyType } = req.params;
      
      if (!keyType || (keyType !== 'ed25519' && keyType !== 'x25519')) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'keyType must be either "ed25519" or "x25519"',
          statusCode: 400
        });
      }

      const privateKey = await DIDModel.getPrivateKey(did, keyType as 'ed25519' | 'x25519');
      
      if (!privateKey) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Private key of type ${keyType} not found for DID ${did}`,
          statusCode: 404
        });
      }

      res.json({
        success: true,
        data: {
          did,
          keyType,
          privateKey: Array.from(privateKey)
        },
        message: 'Private key retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a new key to an existing DID
   */
  static async addKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { did } = req.params;
      const keyRequest: AddKeyRequest = req.body;

      const result = await DIDModel.addKeyToDID(did, keyRequest);
      
      res.status(201).json({
        success: true,
        message: 'Key added successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update the active status of a key
   */
  static async updateKeyActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { did, keyId } = req.params;
      const activeRequest: UpdateKeyActiveRequest = req.body;

      const result = await DIDModel.updateKeyActiveStatus(did, keyId, activeRequest);
      
      res.json({
        success: true,
        message: `Key ${activeRequest.active ? 'activated' : 'deactivated'} successfully`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check endpoint
   */
  static async healthCheck(req: Request, res: Response) {
    res.json({
      success: true,
      message: 'DID API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }
}
