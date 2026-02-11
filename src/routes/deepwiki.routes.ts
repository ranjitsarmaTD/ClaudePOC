import { Router } from 'express';
import { container } from 'tsyringe';
import { DeepWikiController } from '../controllers/DeepWikiController';
import { validateDto } from '../middlewares/validation.middleware';
import { AskQuestionDto } from '../dtos/deepwiki/ask-question.dto';
import { ReadWikiStructureDto } from '../dtos/deepwiki/read-wiki-structure.dto';
import { ReadWikiContentsDto } from '../dtos/deepwiki/read-wiki-contents.dto';

const router = Router();
const deepWikiController = container.resolve(DeepWikiController);

/**
 * @route   POST /api/v1/deepwiki/ask
 * @desc    Ask a question about a repository's documentation via DeepWiki
 * @access  Public
 */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/ask', validateDto(AskQuestionDto, 'body'), deepWikiController.askQuestion);

/**
 * @route   POST /api/v1/deepwiki/structure
 * @desc    Read the wiki structure of a repository via DeepWiki
 * @access  Public
 */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post(
  '/structure',
  validateDto(ReadWikiStructureDto, 'body'),
  deepWikiController.readWikiStructure
);

/**
 * @route   POST /api/v1/deepwiki/contents
 * @desc    Read the full wiki contents of a repository via DeepWiki
 * @access  Public
 */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post(
  '/contents',
  validateDto(ReadWikiContentsDto, 'body'),
  deepWikiController.readWikiContents
);

export default router;
