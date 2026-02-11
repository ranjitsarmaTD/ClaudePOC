export class DeepWikiResponseDto {
  content: string;
  repository: string;
  tool: string;

  constructor(content: string, repository: string, tool: string) {
    this.content = content;
    this.repository = repository;
    this.tool = tool;
  }
}
