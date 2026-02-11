import { injectable } from 'tsyringe';
import { IDeepWikiService } from './interfaces/IDeepWikiService';
import { AskQuestionDto } from '../dtos/deepwiki/ask-question.dto';
import { ReadWikiStructureDto } from '../dtos/deepwiki/read-wiki-structure.dto';
import { ReadWikiContentsDto } from '../dtos/deepwiki/read-wiki-contents.dto';
import { AppError } from '../utils/errors/AppError';
import { logger } from '../utils/logger';

const DEEPWIKI_MCP_ENDPOINT = 'https://mcp.deepwiki.com/mcp';

interface McpRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: {
    name: string;
    arguments: Record<string, string>;
  };
}

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: {
    content?: Array<{ type: string; text: string }>;
  };
  error?: {
    code: number;
    message: string;
  };
}

@injectable()
export class DeepWikiService implements IDeepWikiService {
  private requestId = 0;

  private buildRepoUrl(owner: string, repo: string, repoType?: string): string {
    const type = repoType || 'github';
    return `${type}/${owner}/${repo}`;
  }

  private async callMcpTool(toolName: string, args: Record<string, string>): Promise<string> {
    const request: McpRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };

    logger.info(`DeepWiki MCP call: ${toolName}`, { args });

    try {
      const response = await fetch(DEEPWIKI_MCP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new AppError(
          `DeepWiki MCP server returned ${response.status}: ${response.statusText}`,
          502,
          'DEEPWIKI_MCP_ERROR'
        );
      }

      const data = (await response.json()) as McpResponse;

      if (data.error) {
        throw new AppError(
          `DeepWiki MCP error: ${data.error.message}`,
          502,
          'DEEPWIKI_MCP_ERROR',
          true,
          { mcpErrorCode: data.error.code }
        );
      }

      const textContent = data.result?.content
        ?.filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n');

      if (!textContent) {
        throw new AppError('No content returned from DeepWiki', 502, 'DEEPWIKI_EMPTY_RESPONSE');
      }

      logger.info(`DeepWiki MCP call successful: ${toolName}`);
      return textContent;
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('DeepWiki MCP call failed', { error, toolName, args });
      throw new AppError(
        'Failed to connect to DeepWiki MCP server',
        502,
        'DEEPWIKI_CONNECTION_ERROR'
      );
    }
  }

  async askQuestion(dto: AskQuestionDto): Promise<string> {
    const repoUrl = this.buildRepoUrl(dto.owner, dto.repo, dto.repoType);
    return this.callMcpTool('ask_question', {
      repo_url: repoUrl,
      question: dto.question,
    });
  }

  async readWikiStructure(dto: ReadWikiStructureDto): Promise<string> {
    const repoUrl = this.buildRepoUrl(dto.owner, dto.repo, dto.repoType);
    return this.callMcpTool('read_wiki_structure', {
      repo_url: repoUrl,
    });
  }

  async readWikiContents(dto: ReadWikiContentsDto): Promise<string> {
    const repoUrl = this.buildRepoUrl(dto.owner, dto.repo, dto.repoType);
    return this.callMcpTool('read_wiki_contents', {
      repo_url: repoUrl,
    });
  }
}
