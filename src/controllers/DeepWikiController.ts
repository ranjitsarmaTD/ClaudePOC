import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IDeepWikiService } from '../services/interfaces/IDeepWikiService';
import { AskQuestionDto } from '../dtos/deepwiki/ask-question.dto';
import { ReadWikiStructureDto } from '../dtos/deepwiki/read-wiki-structure.dto';
import { ReadWikiContentsDto } from '../dtos/deepwiki/read-wiki-contents.dto';
import { DeepWikiResponseDto } from '../dtos/deepwiki/deepwiki-response.dto';
import { ApiResponse } from '../types/common.types';

@injectable()
export class DeepWikiController {
  constructor(
    @inject('IDeepWikiService')
    private readonly deepWikiService: IDeepWikiService
  ) {}

  public askQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as AskQuestionDto;
      const content = await this.deepWikiService.askQuestion(dto);
      const response: ApiResponse<DeepWikiResponseDto> = {
        success: true,
        data: new DeepWikiResponseDto(content, `${dto.owner}/${dto.repo}`, 'ask_question'),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  public readWikiStructure = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as ReadWikiStructureDto;
      const content = await this.deepWikiService.readWikiStructure(dto);
      const response: ApiResponse<DeepWikiResponseDto> = {
        success: true,
        data: new DeepWikiResponseDto(
          content,
          `${dto.owner}/${dto.repo}`,
          'read_wiki_structure'
        ),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  public readWikiContents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as ReadWikiContentsDto;
      const content = await this.deepWikiService.readWikiContents(dto);
      const response: ApiResponse<DeepWikiResponseDto> = {
        success: true,
        data: new DeepWikiResponseDto(content, `${dto.owner}/${dto.repo}`, 'read_wiki_contents'),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
