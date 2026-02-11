import { AskQuestionDto } from '../../dtos/deepwiki/ask-question.dto';
import { ReadWikiStructureDto } from '../../dtos/deepwiki/read-wiki-structure.dto';
import { ReadWikiContentsDto } from '../../dtos/deepwiki/read-wiki-contents.dto';

export interface IDeepWikiService {
  askQuestion(dto: AskQuestionDto): Promise<string>;
  readWikiStructure(dto: ReadWikiStructureDto): Promise<string>;
  readWikiContents(dto: ReadWikiContentsDto): Promise<string>;
}
